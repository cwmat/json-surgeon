import { useJsonStore } from "@/stores/json-store";
import { StatsOverview } from "./StatsOverview";
import { KeyFrequencyCard } from "./KeyFrequencyCard";
import { DepthAnalysisCard } from "./DepthAnalysisCard";
import { ArrayLengthCard } from "./ArrayLengthCard";
import { TypeBreakdownCard } from "./TypeBreakdownCard";
import { SchemaCard } from "./SchemaCard";

export function AnalysisPanel() {
  const analysis = useJsonStore((s) => s.analysis);
  const metadata = useJsonStore((s) => s.metadata);

  if (!analysis || !metadata) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-text-muted">
        No analysis available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <StatsOverview analysis={analysis} metadata={metadata} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TypeBreakdownCard breakdown={analysis.typeBreakdown} total={analysis.totalNodes} />
        <KeyFrequencyCard frequency={analysis.keyFrequency} />
        <DepthAnalysisCard distribution={analysis.depthDistribution} />
        <ArrayLengthCard lengths={analysis.arrayLengths} />
      </div>

      <SchemaCard />
    </div>
  );
}
