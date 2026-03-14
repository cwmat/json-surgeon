import { MainLayout } from "@/components/layout/MainLayout";
import { DropZone } from "@/components/input/DropZone";
import { Workspace } from "@/components/Workspace";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { useJsonStore } from "@/stores/json-store";
import { ProgressBar } from "@/components/shared/ProgressBar";

export default function App() {
  const { parseStatus, parseProgress } = useJsonStore();

  return (
    <MainLayout>
      <ErrorBoundary fallbackLabel="Application error">
        {parseStatus === "idle" || parseStatus === "error" ? (
          <DropZone />
        ) : parseStatus === "parsing" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="w-full max-w-md">
              <ProgressBar progress={parseProgress} label="Parsing JSON..." />
            </div>
          </div>
        ) : (
          <Workspace />
        )}
      </ErrorBoundary>
    </MainLayout>
  );
}
