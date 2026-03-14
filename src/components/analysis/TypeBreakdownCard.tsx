import { Card } from "@/components/shared/Card";
import { formatNumber, formatPercent } from "@/utils/format";

interface TypeBreakdownCardProps {
  breakdown: Record<string, number>;
  total: number;
}

const TYPE_COLORS: Record<string, string> = {
  string: "bg-json-string",
  number: "bg-json-number",
  boolean: "bg-json-boolean",
  null: "bg-json-null",
  object: "bg-carbon-600",
  array: "bg-carbon-400",
};

const TYPE_TEXT_COLORS: Record<string, string> = {
  string: "text-json-string",
  number: "text-json-number",
  boolean: "text-json-boolean",
  null: "text-json-null",
  object: "text-carbon-400",
  array: "text-carbon-300",
};

export function TypeBreakdownCard({ breakdown, total }: TypeBreakdownCardProps) {
  const entries = Object.entries(breakdown)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  // Build conic gradient
  let gradientParts: string[] = [];
  let cumulative = 0;
  const conicColors: Record<string, string> = {
    string: "#67e8f9",
    number: "#fbbf24",
    boolean: "#a78bfa",
    null: "#6b7280",
    object: "#0891b2",
    array: "#22d3ee",
  };

  for (const [type, count] of entries) {
    const pct = (count / total) * 100;
    const color = conicColors[type] ?? "#555";
    gradientParts.push(`${color} ${cumulative}% ${cumulative + pct}%`);
    cumulative += pct;
  }

  const gradient = `conic-gradient(${gradientParts.join(", ")})`;

  return (
    <Card title="Type Breakdown">
      <div className="flex items-start gap-6">
        {/* Donut chart */}
        <div className="relative h-32 w-32 shrink-0">
          <div
            className="h-full w-full rounded-full"
            style={{ background: gradient }}
          />
          <div className="absolute inset-3 rounded-full bg-surface-1" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-text-muted">{formatNumber(total)}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5">
          {entries.map(([type, count]) => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div className={`h-2.5 w-2.5 rounded-sm ${TYPE_COLORS[type]}`} />
              <span className={`w-16 ${TYPE_TEXT_COLORS[type]}`}>{type}</span>
              <span className="text-text-secondary">{formatNumber(count)}</span>
              <span className="text-text-muted">({formatPercent(count, total)})</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
