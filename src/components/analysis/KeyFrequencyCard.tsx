import { Card } from "@/components/shared/Card";
import { formatNumber } from "@/utils/format";

interface KeyFrequencyCardProps {
  frequency: Record<string, number>;
}

export function KeyFrequencyCard({ frequency }: KeyFrequencyCardProps) {
  const entries = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  if (entries.length === 0) {
    return (
      <Card title="Key Frequency">
        <p className="text-sm text-text-muted">No object keys found</p>
      </Card>
    );
  }

  const maxCount = entries[0]![1];

  return (
    <Card title="Key Frequency (Top 20)">
      <div className="flex flex-col gap-1.5">
        {entries.map(([key, count]) => (
          <div key={key} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 truncate font-mono text-text-primary" title={key}>
              {key}
            </span>
            <div className="relative h-4 flex-1 overflow-hidden rounded bg-surface-2">
              <div
                className="h-full rounded bg-accent/40 transition-all"
                style={{ width: `${(count / maxCount) * 100}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-text-secondary">
              {formatNumber(count)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
