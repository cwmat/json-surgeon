import { useJsonStore } from "@/stores/json-store";
import { formatNumber } from "@/utils/format";

export function Footer() {
  const { metadata, parseStatus, parseProgress } = useJsonStore();

  return (
    <footer className="flex h-7 shrink-0 items-center justify-between border-t border-border bg-surface-1 px-4 text-[11px] text-text-muted">
      <div className="flex items-center gap-3">
        {parseStatus === "parsing" && (
          <span className="text-accent">Parsing... {parseProgress}%</span>
        )}
        {parseStatus === "complete" && metadata && (
          <>
            <span>{formatNumber(metadata.totalNodes)} nodes</span>
            <span>Depth: {metadata.maxDepth}</span>
            <span>Root: {metadata.rootType}</span>
          </>
        )}
        {parseStatus === "error" && <span className="text-red-400">Parse error</span>}
        {parseStatus === "idle" && <span>Ready</span>}
      </div>
      <div className="flex items-center gap-2">
        <span>Client-side only</span>
        <span className="text-text-muted/50">|</span>
        <span>Your data stays local</span>
      </div>
    </footer>
  );
}
