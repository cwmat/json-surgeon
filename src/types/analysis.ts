export interface AnalysisResult {
  keyFrequency: Record<string, number>;
  depthDistribution: Record<number, number>;
  typeBreakdown: {
    string: number;
    number: number;
    boolean: number;
    null: number;
    object: number;
    array: number;
  };
  arrayLengths: number[];
  totalNodes: number;
  maxDepth: number;
  uniqueKeys: number;
}
