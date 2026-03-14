export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

export type JsonNodeType = "object" | "array" | "string" | "number" | "boolean" | "null";

export interface TreeNode {
  id: string;
  path: string;
  key: string | number;
  type: JsonNodeType;
  depth: number;
  childCount?: number;
  value?: JsonPrimitive;
  children?: TreeNode[];
  expanded: boolean;
  parentId: string | null;
  childrenLoaded: boolean;
}

export interface ParseMetadata {
  totalNodes: number;
  maxDepth: number;
  rootType: "object" | "array";
  fileSize: number;
  parseTimeMs: number;
  isStreamed: boolean;
}

export type FileLoadMode = "direct" | "worker" | "streamed";
