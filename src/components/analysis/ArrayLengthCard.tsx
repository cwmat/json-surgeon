import { Card } from "@/components/shared/Card";
import { formatNumber } from "@/utils/format";

interface ArrayLengthCardProps {
  lengths: number[];
}

export function ArrayLengthCard({ lengths }: ArrayLengthCardProps) {
  if (lengths.length === 0) {
    return (
      <Card title="Array Lengths">
        <p className="text-sm text-text-muted">No arrays found</p>
      </Card>
    );
  }

  const sorted = [...lengths].sort((a, b) => a - b);
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const median = sorted[Math.floor(sorted.length / 2)]!;
  const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;

  // Build histogram buckets
  const buckets = buildBuckets(sorted, max);

  const maxBucketCount = Math.max(...buckets.map((b) => b.count));

  return (
    <Card title="Array Lengths">
      <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
        <div>
          <p className="text-text-muted">Min</p>
          <p className="font-semibold text-text-primary">{formatNumber(min)}</p>
        </div>
        <div>
          <p className="text-text-muted">Max</p>
          <p className="font-semibold text-text-primary">{formatNumber(max)}</p>
        </div>
        <div>
          <p className="text-text-muted">Median</p>
          <p className="font-semibold text-text-primary">{formatNumber(median)}</p>
        </div>
        <div>
          <p className="text-text-muted">Avg</p>
          <p className="font-semibold text-text-primary">{avg.toFixed(1)}</p>
        </div>
      </div>

      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {buckets.map((bucket, i) => (
          <div key={i} className="group flex flex-1 flex-col items-center">
            <div
              className="w-full rounded-t bg-carbon-600/60 transition-all group-hover:bg-carbon-500/60"
              style={{
                height: `${Math.max(2, (bucket.count / maxBucketCount) * 100)}%`,
              }}
              title={`${bucket.label}: ${bucket.count} arrays`}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {buckets.map((bucket, i) => (
          <div key={i} className="flex-1 text-center text-[9px] text-text-muted">
            {bucket.label}
          </div>
        ))}
      </div>
    </Card>
  );
}

interface Bucket {
  label: string;
  count: number;
}

function buildBuckets(sorted: number[], max: number): Bucket[] {
  if (max <= 10) {
    // Each value gets its own bucket
    const counts = new Map<number, number>();
    for (const v of sorted) counts.set(v, (counts.get(v) ?? 0) + 1);
    return Array.from(counts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([val, count]) => ({ label: String(val), count }));
  }

  // Create ~8 buckets
  const bucketCount = Math.min(8, max);
  const bucketSize = Math.ceil((max + 1) / bucketCount);
  const buckets: Bucket[] = [];

  for (let i = 0; i < bucketCount; i++) {
    const lo = i * bucketSize;
    const hi = Math.min(lo + bucketSize - 1, max);
    const count = sorted.filter((v) => v >= lo && v <= hi).length;
    buckets.push({ label: lo === hi ? String(lo) : `${lo}-${hi}`, count });
  }

  return buckets.filter((b) => b.count > 0);
}
