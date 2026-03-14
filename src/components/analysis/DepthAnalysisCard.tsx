import { Card } from "@/components/shared/Card";
import { formatNumber } from "@/utils/format";

interface DepthAnalysisCardProps {
  distribution: Record<number, number>;
}

export function DepthAnalysisCard({ distribution }: DepthAnalysisCardProps) {
  const entries = Object.entries(distribution)
    .map(([depth, count]) => ({ depth: Number(depth), count }))
    .sort((a, b) => a.depth - b.depth);

  if (entries.length === 0) {
    return (
      <Card title="Depth Analysis">
        <p className="text-sm text-text-muted">No depth data</p>
      </Card>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count));

  return (
    <Card title="Depth Distribution">
      <div className="flex items-end gap-1" style={{ height: 120 }}>
        {entries.map(({ depth, count }) => (
          <div key={depth} className="group flex flex-1 flex-col items-center gap-1">
            <div className="relative w-full">
              <div
                className="mx-auto w-full max-w-8 rounded-t bg-accent/40 transition-all group-hover:bg-accent/60"
                style={{
                  height: `${Math.max(4, (count / maxCount) * 100)}px`,
                }}
                title={`Depth ${depth}: ${formatNumber(count)} nodes`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {entries.map(({ depth }) => (
          <div key={depth} className="flex-1 text-center text-[10px] text-text-muted">
            {depth}
          </div>
        ))}
      </div>
    </Card>
  );
}
