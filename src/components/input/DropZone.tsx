import { useState, useCallback, useRef } from "react";
import { FileJson, Clipboard, Upload } from "lucide-react";
import { useJsonStore } from "@/stores/json-store";
import { STREAM_PARSE_LIMIT } from "@/constants/limits";
import { formatBytes } from "@/utils/format";

export function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { loadString, loadFile, parseStatus, errorMessage } = useJsonStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        if (file.size > STREAM_PARSE_LIMIT) {
          useJsonStore.getState().setError(`File too large (${formatBytes(file.size)}). Max: 500MB`);
          return;
        }
        loadFile(file);
      }
    },
    [loadFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > STREAM_PARSE_LIMIT) {
          useJsonStore.getState().setError(`File too large (${formatBytes(file.size)}). Max: 500MB`);
          return;
        }
        loadFile(file);
      }
    },
    [loadFile],
  );

  const handlePaste = useCallback(() => {
    const text = textareaRef.current?.value.trim();
    if (text) {
      loadString(text);
      setPasteMode(false);
    }
  }, [loadString]);

  if (pasteMode) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="w-full max-w-2xl">
          <textarea
            ref={textareaRef}
            autoFocus
            placeholder="Paste your JSON here..."
            className="h-64 w-full resize-none rounded-lg border border-border bg-surface-2 p-4 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={handlePaste}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface-0 transition-colors hover:bg-carbon-400"
            >
              Parse JSON
            </button>
            <button
              onClick={() => setPasteMode(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-1 items-center justify-center p-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border-2 border-dashed p-12 transition-all ${
          isDragging
            ? "border-accent bg-accent/5 glow-accent"
            : "border-border hover:border-border-hover"
        }`}
      >
        <div className="rounded-xl bg-surface-2 p-4">
          <FileJson className="h-10 w-10 text-accent" />
        </div>

        <div className="text-center">
          <h2 className="text-lg font-medium text-text-primary">Drop JSON file here</h2>
          <p className="mt-1 text-sm text-text-secondary">
            or use one of the options below (up to 500MB)
          </p>
        </div>

        {parseStatus === "error" && errorMessage && (
          <div className="w-full rounded-lg bg-red-500/10 px-4 py-2 text-center text-sm text-red-400">
            {errorMessage}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setPasteMode(true)}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary"
          >
            <Clipboard className="h-4 w-4" />
            Paste JSON
          </button>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm text-text-secondary transition-colors hover:bg-surface-2 hover:text-text-primary">
            <Upload className="h-4 w-4" />
            Browse Files
            <input
              type="file"
              accept=".json,.jsonl,.geojson"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
