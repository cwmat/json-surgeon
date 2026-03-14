import { Hash, Layers, Key, FileJson } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";
import type { ParseMetadata } from "@/types/json";
import { formatNumber, formatBytes, formatMs } from "@/utils/format";

interface StatsOverviewProps {
  analysis: AnalysisResult;
  metadata: ParseMetadata;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-4 py-3">
      <div className="rounded-md bg-surface-2 p-2 text-accent">{icon}</div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-semibold text-text-primary">{value}</p>
      </div>
    </div>
  );
}

export function StatsOverview({ analysis, metadata }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon={<Hash className="h-4 w-4" />}
        label="Total Nodes"
        value={formatNumber(analysis.totalNodes)}
      />
      <StatCard
        icon={<Layers className="h-4 w-4" />}
        label="Max Depth"
        value={String(analysis.maxDepth)}
      />
      <StatCard
        icon={<Key className="h-4 w-4" />}
        label="Unique Keys"
        value={formatNumber(analysis.uniqueKeys)}
      />
      <StatCard
        icon={<FileJson className="h-4 w-4" />}
        label="Root Type"
        value={metadata.rootType}
      />
      <StatCard
        icon={<FileJson className="h-4 w-4" />}
        label="File Size"
        value={formatBytes(metadata.fileSize)}
      />
      <StatCard
        icon={<FileJson className="h-4 w-4" />}
        label="Parse Time"
        value={formatMs(metadata.parseTimeMs)}
      />
    </div>
  );
}
