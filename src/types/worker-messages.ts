import type { TreeNode, ParseMetadata } from "./json";
import type { AnalysisResult } from "./analysis";

// Parse worker messages
export type ParseWorkerInbound =
  | { type: "PARSE_STRING"; payload: { text: string; fileName?: string } }
  | { type: "PARSE_FILE"; payload: File }
  | { type: "EXPAND_NODE"; payload: { path: string } }
  | { type: "CANCEL" };

export type ParseWorkerOutbound =
  | { type: "PARSE_PROGRESS"; payload: { bytesRead: number; totalBytes: number } }
  | {
      type: "PARSE_COMPLETE";
      payload: {
        metadata: ParseMetadata;
        rootNodes: TreeNode[];
        rawJson?: string;
        analysis: AnalysisResult;
      };
    }
  | { type: "NODE_CHILDREN"; payload: { parentPath: string; children: TreeNode[] } }
  | { type: "PARSE_ERROR"; payload: { message: string } };

// jq worker messages
export type JqWorkerInbound =
  | { type: "INIT"; payload: { json: string } }
  | { type: "QUERY"; payload: { filter: string } }
  | { type: "CANCEL" };

export type JqWorkerOutbound =
  | { type: "READY" }
  | { type: "RESULT"; payload: { output: string; timeMs: number } }
  | { type: "ERROR"; payload: { message: string } };

// Analysis worker messages
export type AnalysisWorkerInbound =
  | { type: "ANALYZE"; payload: { json: string } }
  | { type: "CANCEL" };

export type AnalysisWorkerOutbound =
  | { type: "ANALYSIS_COMPLETE"; payload: AnalysisResult }
  | { type: "ANALYSIS_ERROR"; payload: { message: string } };
