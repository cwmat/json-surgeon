import type { TreeNode, ParseMetadata, JsonNodeType } from "@/types/json";
import type { AnalysisResult } from "@/types/analysis";
import type { ParseWorkerInbound, ParseWorkerOutbound } from "@/types/worker-messages";
import { WORKER_PARSE_LIMIT } from "@/constants/limits";

let storedJson: unknown = null;

function post(msg: ParseWorkerOutbound) {
  self.postMessage(msg);
}

function getType(val: unknown): JsonNodeType {
  if (val === null) return "null";
  if (Array.isArray(val)) return "array";
  return typeof val as JsonNodeType;
}

interface WalkContext {
  analysis: AnalysisResult;
  depthLimit: number;
}

function walkNode(
  value: unknown,
  key: string | number,
  parentPath: string,
  parentId: string | null,
  depth: number,
  ctx: WalkContext,
): TreeNode {
  ctx.analysis.totalNodes++;
  if (depth > ctx.analysis.maxDepth) ctx.analysis.maxDepth = depth;
  ctx.analysis.depthDistribution[depth] = (ctx.analysis.depthDistribution[depth] ?? 0) + 1;

  const type = getType(value);
  ctx.analysis.typeBreakdown[type]++;

  const path =
    typeof key === "number" ? `${parentPath}[${key}]` : parentPath === "$" ? `$.${key}` : `${parentPath}.${key}`;
  const id = path;

  if (typeof key === "string") {
    ctx.analysis.keyFrequency[key] = (ctx.analysis.keyFrequency[key] ?? 0) + 1;
  }

  const shouldLoadChildren = depth < ctx.depthLimit;

  if (type === "object" && value !== null) {
    const entries = Object.entries(value as Record<string, unknown>);
    const children = shouldLoadChildren
      ? entries.map(([k, v]) => walkNode(v, k, path, id, depth + 1, ctx))
      : undefined;
    // If we're not building children, still walk them for stats
    if (!shouldLoadChildren) {
      for (const [k, v] of entries) {
        walkStats(v, k, depth + 1, ctx);
      }
    }
    return {
      id,
      path,
      key,
      type,
      depth,
      childCount: entries.length,
      expanded: false,
      parentId,
      childrenLoaded: shouldLoadChildren,
      children,
    };
  }

  if (type === "array") {
    const arr = value as unknown[];
    ctx.analysis.arrayLengths.push(arr.length);
    const children = shouldLoadChildren
      ? arr.map((item, i) => walkNode(item, i, path, id, depth + 1, ctx))
      : undefined;
    if (!shouldLoadChildren) {
      for (let i = 0; i < arr.length; i++) {
        walkStats(arr[i], i, depth + 1, ctx);
      }
    }
    return {
      id,
      path,
      key,
      type,
      depth,
      childCount: arr.length,
      expanded: false,
      parentId,
      childrenLoaded: shouldLoadChildren,
      children,
    };
  }

  return {
    id,
    path,
    key,
    type,
    depth,
    value: value as TreeNode["value"],
    expanded: false,
    parentId,
    childrenLoaded: true,
  };
}

// Walk for stats only (no tree node creation)
function walkStats(value: unknown, key: string | number, depth: number, ctx: WalkContext) {
  ctx.analysis.totalNodes++;
  if (depth > ctx.analysis.maxDepth) ctx.analysis.maxDepth = depth;
  ctx.analysis.depthDistribution[depth] = (ctx.analysis.depthDistribution[depth] ?? 0) + 1;

  const type = getType(value);
  ctx.analysis.typeBreakdown[type]++;

  if (typeof key === "string") {
    ctx.analysis.keyFrequency[key] = (ctx.analysis.keyFrequency[key] ?? 0) + 1;
  }

  if (type === "object" && value !== null) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      walkStats(v, k, depth + 1, ctx);
    }
  } else if (type === "array") {
    const arr = value as unknown[];
    ctx.analysis.arrayLengths.push(arr.length);
    for (let i = 0; i < arr.length; i++) {
      walkStats(arr[i], i, depth + 1, ctx);
    }
  }
}

function parseJsonFull(text: string, _fileName?: string) {
  const start = performance.now();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    post({ type: "PARSE_ERROR", payload: { message: (e as Error).message } });
    return;
  }
  storedJson = parsed;

  const ctx: WalkContext = {
    analysis: {
      keyFrequency: {},
      depthDistribution: {},
      typeBreakdown: { string: 0, number: 0, boolean: 0, null: 0, object: 0, array: 0 },
      arrayLengths: [],
      totalNodes: 0,
      maxDepth: 0,
      uniqueKeys: 0,
    },
    depthLimit: 100, // full tree for <50MB
  };

  let rootNodes: TreeNode[];
  if (Array.isArray(parsed)) {
    rootNodes = (parsed as unknown[]).map((item, i) => walkNode(item, i, "$", null, 0, ctx));
  } else if (typeof parsed === "object" && parsed !== null) {
    rootNodes = Object.entries(parsed as Record<string, unknown>).map(([k, v]) =>
      walkNode(v, k, "$", null, 0, ctx),
    );
  } else {
    rootNodes = [];
  }

  ctx.analysis.uniqueKeys = Object.keys(ctx.analysis.keyFrequency).length;
  const elapsed = performance.now() - start;
  const rootType = Array.isArray(parsed) ? "array" : "object";

  const metadata: ParseMetadata = {
    totalNodes: ctx.analysis.totalNodes,
    maxDepth: ctx.analysis.maxDepth,
    rootType: rootType as "object" | "array",
    fileSize: new Blob([text]).size,
    parseTimeMs: elapsed,
    isStreamed: false,
  };

  post({
    type: "PARSE_COMPLETE",
    payload: {
      metadata,
      rootNodes,
      rawJson: text.length <= WORKER_PARSE_LIMIT ? text : undefined,
      analysis: ctx.analysis,
    },
  });
}

async function parseFileFull(file: File) {
  const start = performance.now();

  // For files that fit in memory, read as text and parse
  if (file.size <= WORKER_PARSE_LIMIT) {
    const text = await file.text();
    post({ type: "PARSE_PROGRESS", payload: { bytesRead: file.size, totalBytes: file.size } });
    parseJsonFull(text, file.name);
    return;
  }

  // Streaming parse for large files — read and parse in chunks
  // For now, read the file in chunks and attempt JSON.parse
  // TODO: Integrate @streamparser/json-whatwg for true streaming
  try {
    let text = "";
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let bytesRead = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      text += decoder.decode(value, { stream: true });

      // Report progress every ~1MB
      if (bytesRead % (1024 * 1024) < value.byteLength) {
        post({ type: "PARSE_PROGRESS", payload: { bytesRead, totalBytes: file.size } });
      }
    }

    post({ type: "PARSE_PROGRESS", payload: { bytesRead: file.size, totalBytes: file.size } });

    const parsed = JSON.parse(text);
    storedJson = parsed;
    const elapsed = performance.now() - start;

    const ctx: WalkContext = {
      analysis: {
        keyFrequency: {},
        depthDistribution: {},
        typeBreakdown: { string: 0, number: 0, boolean: 0, null: 0, object: 0, array: 0 },
        arrayLengths: [],
        totalNodes: 0,
        maxDepth: 0,
        uniqueKeys: 0,
      },
      depthLimit: 3, // Only build 3 levels deep for large files
    };

    let rootNodes: TreeNode[];
    const rootType = Array.isArray(parsed) ? "array" : "object";

    if (Array.isArray(parsed)) {
      rootNodes = (parsed as unknown[]).map((item, i) => walkNode(item, i, "$", null, 0, ctx));
    } else if (typeof parsed === "object" && parsed !== null) {
      rootNodes = Object.entries(parsed as Record<string, unknown>).map(([k, v]) =>
        walkNode(v, k, "$", null, 0, ctx),
      );
    } else {
      rootNodes = [];
    }

    ctx.analysis.uniqueKeys = Object.keys(ctx.analysis.keyFrequency).length;

    const metadata: ParseMetadata = {
      totalNodes: ctx.analysis.totalNodes,
      maxDepth: ctx.analysis.maxDepth,
      rootType: rootType as "object" | "array",
      fileSize: file.size,
      parseTimeMs: elapsed,
      isStreamed: true,
    };

    post({
      type: "PARSE_COMPLETE",
      payload: {
        metadata,
        rootNodes,
        // Don't send rawJson for large files to avoid cloning huge strings
        rawJson: text.length <= WORKER_PARSE_LIMIT ? text : undefined,
        analysis: ctx.analysis,
      },
    });
  } catch (e) {
    post({ type: "PARSE_ERROR", payload: { message: (e as Error).message } });
  }
}

function expandNode(path: string) {
  if (!storedJson) {
    post({ type: "PARSE_ERROR", payload: { message: "No JSON loaded" } });
    return;
  }

  // Navigate to the path in storedJson
  const segments = parsePath(path);
  let current: unknown = storedJson;

  for (const seg of segments) {
    if (current === null || current === undefined) break;
    if (typeof seg === "number") {
      current = (current as unknown[])[seg];
    } else {
      current = (current as Record<string, unknown>)[seg];
    }
  }

  if (current === null || current === undefined || typeof current !== "object") {
    post({ type: "NODE_CHILDREN", payload: { parentPath: path, children: [] } });
    return;
  }

  const ctx: WalkContext = {
    analysis: {
      keyFrequency: {},
      depthDistribution: {},
      typeBreakdown: { string: 0, number: 0, boolean: 0, null: 0, object: 0, array: 0 },
      arrayLengths: [],
      totalNodes: 0,
      maxDepth: 0,
      uniqueKeys: 0,
    },
    depthLimit: 3, // Load 3 more levels
  };

  const depth = segments.length;
  let children: TreeNode[];

  if (Array.isArray(current)) {
    children = current.map((item, i) => walkNode(item, i, path, path, depth, ctx));
  } else {
    children = Object.entries(current as Record<string, unknown>).map(([k, v]) =>
      walkNode(v, k, path, path, depth, ctx),
    );
  }

  post({ type: "NODE_CHILDREN", payload: { parentPath: path, children } });
}

function parsePath(path: string): (string | number)[] {
  // Parse paths like $.foo.bar[0].baz
  const segments: (string | number)[] = [];
  const cleaned = path.startsWith("$.") ? path.slice(2) : path.startsWith("$") ? path.slice(1) : path;
  if (!cleaned) return segments;

  let current = "";
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]!;
    if (ch === ".") {
      if (current) {
        segments.push(current);
        current = "";
      }
    } else if (ch === "[") {
      if (current) {
        segments.push(current);
        current = "";
      }
      let numStr = "";
      i++;
      while (i < cleaned.length && cleaned[i] !== "]") {
        numStr += cleaned[i];
        i++;
      }
      segments.push(parseInt(numStr, 10));
    } else {
      current += ch;
    }
  }
  if (current) segments.push(current);
  return segments;
}

self.onmessage = (e: MessageEvent<ParseWorkerInbound>) => {
  const msg = e.data;
  switch (msg.type) {
    case "PARSE_STRING":
      parseJsonFull(msg.payload.text, msg.payload.fileName);
      break;
    case "PARSE_FILE":
      parseFileFull(msg.payload);
      break;
    case "EXPAND_NODE":
      expandNode(msg.payload.path);
      break;
    case "CANCEL":
      storedJson = null;
      break;
  }
};
