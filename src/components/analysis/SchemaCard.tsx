import { useState, useMemo } from "react";
import { useJsonStore } from "@/stores/json-store";
import { Card } from "@/components/shared/Card";
import { CopyButton } from "@/components/shared/CopyButton";

export function SchemaCard() {
  const rawJson = useJsonStore((s) => s.rawJson);
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInfer = async () => {
    if (!rawJson) return;
    setLoading(true);
    setError(null);
    try {
      // Dynamic import to code-split the schema inference library
      const { inferSchema } = await import("@jsonhero/schema-infer");
      const parsed = JSON.parse(rawJson);
      const result = inferSchema(parsed);
      setSchema(result.toJSONSchema() as Record<string, unknown> | null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Schema inference failed");
    } finally {
      setLoading(false);
    }
  };

  const schemaJson = useMemo(() => (schema ? JSON.stringify(schema, null, 2) : null), [schema]);

  return (
    <Card title="Schema Inference">
      {!schema && !loading && (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className="text-sm text-text-secondary">
            Infer a JSON Schema from the loaded data
          </p>
          <button
            onClick={handleInfer}
            disabled={!rawJson}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface-0 transition-colors hover:bg-carbon-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rawJson ? "Infer Schema" : "Schema requires full JSON in memory"}
          </button>
        </div>
      )}

      {loading && (
        <div className="py-4 text-center text-sm text-text-secondary">Inferring schema...</div>
      )}

      {error && <div className="py-2 text-sm text-red-400">{error}</div>}

      {schemaJson && (
        <div className="relative">
          <div className="absolute right-2 top-2">
            <CopyButton text={schemaJson} />
          </div>
          <pre className="max-h-96 overflow-auto rounded-lg bg-surface-2 p-4 font-mono text-xs text-text-primary">
            {schemaJson}
          </pre>
        </div>
      )}
    </Card>
  );
}
