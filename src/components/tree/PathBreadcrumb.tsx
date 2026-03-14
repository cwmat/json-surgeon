import { ChevronRight } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { CopyButton } from "@/components/shared/CopyButton";

export function PathBreadcrumb() {
  const selectedPath = useUiStore((s) => s.selectedPath);
  const setSelectedPath = useUiStore((s) => s.setSelectedPath);

  if (!selectedPath) {
    return (
      <div className="flex h-8 shrink-0 items-center border-b border-border bg-surface-1 px-3 text-xs text-text-muted">
        <span className="font-mono">$</span>
        <span className="ml-2">Select a node to see its path</span>
      </div>
    );
  }

  // Parse path into segments
  const segments = parsePathSegments(selectedPath);

  return (
    <div className="flex h-8 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border bg-surface-1 px-3 text-xs">
      {segments.map((seg, i) => (
        <span key={i} className="flex shrink-0 items-center">
          {i > 0 && <ChevronRight className="mx-0.5 h-3 w-3 text-text-muted" />}
          <button
            className="rounded px-1 py-0.5 font-mono text-text-secondary transition-colors hover:bg-surface-2 hover:text-accent"
            onClick={() => setSelectedPath(seg.fullPath)}
          >
            {seg.label}
          </button>
        </span>
      ))}
      <CopyButton text={selectedPath} className="ml-auto shrink-0" />
    </div>
  );
}

interface PathSegment {
  label: string;
  fullPath: string;
}

function parsePathSegments(path: string): PathSegment[] {
  const segments: PathSegment[] = [{ label: "$", fullPath: "$" }];
  const cleaned = path.startsWith("$.") ? path.slice(2) : path.startsWith("$") ? path.slice(1) : path;
  if (!cleaned) return segments;

  let current = "";
  let builtPath = "$";

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i]!;
    if (ch === ".") {
      if (current) {
        builtPath += `.${current}`;
        segments.push({ label: current, fullPath: builtPath });
        current = "";
      }
    } else if (ch === "[") {
      if (current) {
        builtPath += `.${current}`;
        segments.push({ label: current, fullPath: builtPath });
        current = "";
      }
      let idx = "";
      i++;
      while (i < cleaned.length && cleaned[i] !== "]") {
        idx += cleaned[i];
        i++;
      }
      builtPath += `[${idx}]`;
      segments.push({ label: `[${idx}]`, fullPath: builtPath });
    } else {
      current += ch;
    }
  }
  if (current) {
    builtPath += `.${current}`;
    segments.push({ label: current, fullPath: builtPath });
  }

  return segments;
}
