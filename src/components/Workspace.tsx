import { useCallback, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { JsonTree } from "@/components/tree/JsonTree";
import { PathBreadcrumb } from "@/components/tree/PathBreadcrumb";
import { AnalysisPanel } from "@/components/analysis/AnalysisPanel";
import { QueryBar } from "@/components/query/QueryBar";
import { useUiStore } from "@/stores/ui-store";

export function Workspace() {
  const sidebarWidth = useUiStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUiStore((s) => s.setSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);

      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const handleMouseMove = (e: MouseEvent) => {
        const delta = e.clientX - startX;
        const newWidth = Math.max(250, Math.min(800, startWidth + delta));
        setSidebarWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [sidebarWidth, setSidebarWidth],
  );

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
      {/* Query bar at top */}
      <ErrorBoundary fallbackLabel="Query bar error">
        <QueryBar />
      </ErrorBoundary>

      {/* Main content: tree | analysis */}
      <div className="flex min-h-0 flex-1">
        {/* Tree sidebar */}
        <div
          className="flex min-h-0 flex-col border-r border-border"
          style={{ width: sidebarWidth }}
        >
          <PathBreadcrumb />
          <ErrorBoundary fallbackLabel="Tree view error">
            <JsonTree />
          </ErrorBoundary>
        </div>

        {/* Resize handle */}
        <div
          className={`w-1 cursor-col-resize transition-colors hover:bg-accent/30 ${
            isResizing ? "bg-accent/30" : "bg-transparent"
          }`}
          onMouseDown={handleMouseDown}
        />

        {/* Analysis panel */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ErrorBoundary fallbackLabel="Analysis panel error">
            <AnalysisPanel />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
