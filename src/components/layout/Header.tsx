import { FileJson, Trash2, Upload } from "lucide-react";
import { useJsonStore } from "@/stores/json-store";
import { formatBytes, formatMs } from "@/utils/format";

export function Header() {
  const { metadata, fileName, parseStatus, clear } = useJsonStore();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface-1 px-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <FileJson className="h-5 w-5 text-accent" />
          <h1 className="text-sm font-semibold tracking-tight text-text-primary">JSONSurgeon</h1>
        </div>

        {metadata && fileName && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="rounded bg-surface-2 px-2 py-0.5">{fileName}</span>
            <span>{formatBytes(metadata.fileSize)}</span>
            <span className="text-text-muted">|</span>
            <span>{formatMs(metadata.parseTimeMs)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {parseStatus === "complete" && (
          <button
            onClick={clear}
            className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
        {parseStatus === "idle" && (
          <label className="flex cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary">
            <Upload className="h-3.5 w-3.5" />
            Open File
            <input
              type="file"
              accept=".json,.jsonl,.geojson"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) useJsonStore.getState().loadFile(file);
              }}
            />
          </label>
        )}
      </div>
    </header>
  );
}
