import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Loader2, AlertCircle } from "lucide-react";
import { useJsonStore } from "@/stores/json-store";
import { formatMs } from "@/utils/format";
import type { JqWorkerInbound, JqWorkerOutbound } from "@/types/worker-messages";

let jqWorker: Worker | null = null;
let jqReady = false;
let jqInitializing = false;

export function QueryBar() {
  const [query, setQuery] = useState(".");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [timeMs, setTimeMs] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rawJson = useJsonStore((s) => s.rawJson);

  const initWorker = useCallback(() => {
    if (jqWorker || jqInitializing) return;
    if (!rawJson) return;

    jqInitializing = true;
    jqWorker = new Worker(new URL("@/workers/jq.worker.ts", import.meta.url), {
      type: "module",
    });

    jqWorker.onmessage = (e: MessageEvent<JqWorkerOutbound>) => {
      const msg = e.data;
      switch (msg.type) {
        case "READY":
          jqReady = true;
          jqInitializing = false;
          break;
        case "RESULT":
          setResult(msg.payload.output);
          setTimeMs(msg.payload.timeMs);
          setError(null);
          setRunning(false);
          setShowResult(true);
          break;
        case "ERROR":
          setError(msg.payload.message);
          setResult(null);
          setRunning(false);
          setShowResult(true);
          break;
      }
    };

    const initMsg: JqWorkerInbound = { type: "INIT", payload: { json: rawJson } };
    jqWorker.postMessage(initMsg);
  }, [rawJson]);

  // Re-init when rawJson changes
  useEffect(() => {
    if (rawJson && jqWorker && jqReady) {
      const msg: JqWorkerInbound = { type: "INIT", payload: { json: rawJson } };
      jqWorker.postMessage(msg);
    }
  }, [rawJson]);

  const handleRun = useCallback(() => {
    if (!rawJson) {
      setError("jq queries require JSON in memory (files under 50MB)");
      setShowResult(true);
      return;
    }

    if (!jqWorker || !jqReady) {
      initWorker();
      // Wait for ready, then retry
      const check = setInterval(() => {
        if (jqReady) {
          clearInterval(check);
          handleRun();
        }
      }, 100);
      return;
    }

    setRunning(true);
    setError(null);
    const msg: JqWorkerInbound = { type: "QUERY", payload: { filter: query } };
    jqWorker.postMessage(msg);
  }, [query, rawJson, initWorker]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleRun();
      }
    },
    [handleRun],
  );

  return (
    <div className="shrink-0 border-b border-border bg-surface-1">
      {/* Query input */}
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-xs font-medium text-accent">jq</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='. | keys'
          className="flex-1 bg-transparent font-mono text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
        />
        {running ? (
          <Loader2 className="h-4 w-4 animate-spin text-accent" />
        ) : (
          <button
            onClick={handleRun}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-secondary transition-colors hover:bg-surface-2 hover:text-accent"
            title="Run query (Enter)"
          >
            <Play className="h-3 w-3" />
            Run
          </button>
        )}
        {timeMs !== null && (
          <span className="text-[10px] text-text-muted">{formatMs(timeMs)}</span>
        )}
      </div>

      {/* Result */}
      {showResult && (
        <div className="border-t border-border">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono">{error}</span>
            </div>
          )}
          {result && (
            <pre className="max-h-64 overflow-auto px-3 py-2 font-mono text-xs text-text-primary">
              {result}
            </pre>
          )}
          <button
            onClick={() => setShowResult(false)}
            className="w-full border-t border-border py-1 text-[10px] text-text-muted hover:bg-surface-2"
          >
            Hide results
          </button>
        </div>
      )}
    </div>
  );
}
