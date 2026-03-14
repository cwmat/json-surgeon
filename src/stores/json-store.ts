import { create } from "zustand";
import type { TreeNode, ParseMetadata, FileLoadMode } from "@/types/json";
import type { AnalysisResult } from "@/types/analysis";
import type { ParseWorkerOutbound } from "@/types/worker-messages";
import { DIRECT_PARSE_LIMIT } from "@/constants/limits";

interface JsonStore {
  rawJson: string | null;
  rootNodes: TreeNode[];
  metadata: ParseMetadata | null;
  analysis: AnalysisResult | null;
  loadMode: FileLoadMode | null;
  parseStatus: "idle" | "parsing" | "complete" | "error";
  parseProgress: number;
  errorMessage: string | null;
  fileName: string | null;

  loadString: (text: string, fileName?: string) => void;
  loadFile: (file: File) => void;
  setParseResult: (data: {
    metadata: ParseMetadata;
    rootNodes: TreeNode[];
    rawJson?: string;
    analysis: AnalysisResult;
  }) => void;
  setProgress: (progress: number) => void;
  setError: (message: string) => void;
  clear: () => void;
  addChildNodes: (parentPath: string, children: TreeNode[]) => void;
}

let parseWorker: Worker | null = null;

function getParseWorker(): Worker {
  if (!parseWorker) {
    parseWorker = new Worker(new URL("@/workers/parse.worker.ts", import.meta.url), {
      type: "module",
    });
  }
  return parseWorker;
}

export const useJsonStore = create<JsonStore>()((set, _get) => ({
  rawJson: null,
  rootNodes: [],
  metadata: null,
  analysis: null,
  loadMode: null,
  parseStatus: "idle",
  parseProgress: 0,
  errorMessage: null,
  fileName: null,

  loadString: (text, fileName) => {
    const size = new Blob([text]).size;

    if (size <= DIRECT_PARSE_LIMIT) {
      // Parse directly in main thread
      set({ parseStatus: "parsing", parseProgress: 0, fileName: fileName ?? "pasted.json" });
      try {
        const start = performance.now();
        const parsed = JSON.parse(text);
        const { nodes, analysis } = buildTreeAndAnalysis(parsed);
        const elapsed = performance.now() - start;
        const rootType = Array.isArray(parsed) ? "array" : "object";
        set({
          rawJson: text,
          rootNodes: nodes,
          metadata: {
            totalNodes: analysis.totalNodes,
            maxDepth: analysis.maxDepth,
            rootType,
            fileSize: size,
            parseTimeMs: elapsed,
            isStreamed: false,
          },
          analysis,
          loadMode: "direct",
          parseStatus: "complete",
          parseProgress: 100,
          errorMessage: null,
        });
      } catch (e) {
        set({
          parseStatus: "error",
          errorMessage: e instanceof Error ? e.message : "Invalid JSON",
        });
      }
    } else {
      // Send to worker
      set({
        parseStatus: "parsing",
        parseProgress: 0,
        fileName: fileName ?? "pasted.json",
        loadMode: "worker",
      });
      const worker = getParseWorker();
      worker.onmessage = (e: MessageEvent<ParseWorkerOutbound>) => {
        handleWorkerMessage(e.data, set);
      };
      worker.postMessage({ type: "PARSE_STRING", payload: { text, fileName } });
    }
  },

  loadFile: (file) => {
    set({
      parseStatus: "parsing",
      parseProgress: 0,
      fileName: file.name,
      loadMode: file.size > DIRECT_PARSE_LIMIT ? "streamed" : "worker",
    });
    const worker = getParseWorker();
    worker.onmessage = (e: MessageEvent<ParseWorkerOutbound>) => {
      handleWorkerMessage(e.data, set);
    };
    worker.postMessage({ type: "PARSE_FILE", payload: file });
  },

  setParseResult: (data) =>
    set({
      rootNodes: data.rootNodes,
      metadata: data.metadata,
      rawJson: data.rawJson ?? null,
      analysis: data.analysis,
      parseStatus: "complete",
      parseProgress: 100,
      errorMessage: null,
    }),

  setProgress: (progress) => set({ parseProgress: progress }),

  setError: (message) => set({ parseStatus: "error", errorMessage: message }),

  clear: () => {
    if (parseWorker) {
      parseWorker.postMessage({ type: "CANCEL" });
    }
    set({
      rawJson: null,
      rootNodes: [],
      metadata: null,
      analysis: null,
      loadMode: null,
      parseStatus: "idle",
      parseProgress: 0,
      errorMessage: null,
      fileName: null,
    });
  },

  addChildNodes: (parentPath, children) =>
    set((state) => {
      const updateNodes = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((node) => {
          if (node.path === parentPath) {
            return { ...node, children, childrenLoaded: true };
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) };
          }
          return node;
        });
      return { rootNodes: updateNodes(state.rootNodes) };
    }),
}));

function handleWorkerMessage(
  data: ParseWorkerOutbound,
  set: (partial: Partial<ReturnType<typeof useJsonStore.getState>>) => void,
) {
  switch (data.type) {
    case "PARSE_PROGRESS":
      set({
        parseProgress: Math.round((data.payload.bytesRead / data.payload.totalBytes) * 100),
      });
      break;
    case "PARSE_COMPLETE":
      set({
        rootNodes: data.payload.rootNodes,
        metadata: data.payload.metadata,
        rawJson: data.payload.rawJson ?? null,
        analysis: data.payload.analysis,
        parseStatus: "complete",
        parseProgress: 100,
        errorMessage: null,
      });
      break;
    case "PARSE_ERROR":
      set({ parseStatus: "error", errorMessage: data.payload.message });
      break;
  }
}

// Build tree nodes and analysis from parsed JSON (main thread, <10MB)
function buildTreeAndAnalysis(data: unknown): {
  nodes: TreeNode[];
  analysis: AnalysisResult;
} {
  const analysis: AnalysisResult = {
    keyFrequency: {},
    depthDistribution: {},
    typeBreakdown: { string: 0, number: 0, boolean: 0, null: 0, object: 0, array: 0 },
    arrayLengths: [],
    totalNodes: 0,
    maxDepth: 0,
    uniqueKeys: 0,
  };

  function getType(val: unknown): TreeNode["type"] {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    return typeof val as TreeNode["type"];
  }

  function walk(
    value: unknown,
    key: string | number,
    parentPath: string,
    parentId: string | null,
    depth: number,
  ): TreeNode {
    analysis.totalNodes++;
    if (depth > analysis.maxDepth) analysis.maxDepth = depth;
    analysis.depthDistribution[depth] = (analysis.depthDistribution[depth] ?? 0) + 1;

    const type = getType(value);
    analysis.typeBreakdown[type]++;

    const path = parentPath === "$" ? `$.${key}` : `${parentPath}.${key}`;
    const id = path;

    if (typeof key === "string") {
      analysis.keyFrequency[key] = (analysis.keyFrequency[key] ?? 0) + 1;
    }

    if (type === "object" && value !== null) {
      const entries = Object.entries(value as Record<string, unknown>);
      const children = entries.map(([k, v]) => walk(v, k, path, id, depth + 1));
      return {
        id,
        path,
        key,
        type,
        depth,
        childCount: entries.length,
        expanded: false,
        parentId,
        childrenLoaded: true,
        children,
      };
    }

    if (type === "array") {
      const arr = value as unknown[];
      analysis.arrayLengths.push(arr.length);
      const children = arr.map((item, i) => walk(item, i, path, id, depth + 1));
      return {
        id,
        path,
        key,
        type,
        depth,
        childCount: arr.length,
        expanded: false,
        parentId,
        childrenLoaded: true,
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

  let nodes: TreeNode[];
  if (Array.isArray(data)) {
    nodes = data.map((item, i) => walk(item, i, "$", null, 0));
  } else if (typeof data === "object" && data !== null) {
    nodes = Object.entries(data).map(([k, v]) => walk(v, k, "$", null, 0));
  } else {
    nodes = [
      {
        id: "$.root",
        path: "$.root",
        key: "root",
        type: getType(data),
        depth: 0,
        value: data as TreeNode["value"],
        expanded: false,
        parentId: null,
        childrenLoaded: true,
      },
    ];
  }

  analysis.uniqueKeys = Object.keys(analysis.keyFrequency).length;

  return { nodes, analysis };
}
