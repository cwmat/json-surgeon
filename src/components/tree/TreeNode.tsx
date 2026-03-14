import { memo } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { CopyButton } from "@/components/shared/CopyButton";
import type { TreeNode } from "@/types/json";

interface TreeNodeRowProps {
  node: TreeNode;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
}

function formatValue(node: TreeNode): string {
  if (node.type === "string") return `"${node.value}"`;
  if (node.type === "null") return "null";
  return String(node.value);
}

function getValueColorClass(type: TreeNode["type"]): string {
  switch (type) {
    case "string":
      return "text-json-string";
    case "number":
      return "text-json-number";
    case "boolean":
      return "text-json-boolean";
    case "null":
      return "text-json-null";
    default:
      return "text-text-secondary";
  }
}

function getBracket(type: TreeNode["type"], open: boolean): string {
  if (type === "object") return open ? "{" : "}";
  if (type === "array") return open ? "[" : "]";
  return "";
}

export const TreeNodeRow = memo(function TreeNodeRow({
  node,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
}: TreeNodeRowProps) {
  const isContainer = node.type === "object" || node.type === "array";
  const indent = node.depth * 20;

  return (
    <div
      className={`group flex h-7 cursor-pointer items-center pr-2 transition-colors hover:bg-surface-2 ${
        isSelected ? "bg-surface-2" : ""
      }`}
      style={{ paddingLeft: `${indent + 8}px` }}
      onClick={() => {
        onSelect(node.path);
        if (isContainer) onToggle(node.path);
      }}
    >
      {/* Expand/collapse chevron */}
      <span className="mr-1 inline-flex w-4 shrink-0 items-center justify-center">
        {isContainer ? (
          isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
          )
        ) : null}
      </span>

      {/* Key */}
      <span className="shrink-0 text-json-key">
        {typeof node.key === "number" ? (
          <span className="text-json-number">{node.key}</span>
        ) : (
          <span>&quot;{node.key}&quot;</span>
        )}
      </span>
      <span className="mx-1 text-text-muted">:</span>

      {/* Value */}
      {isContainer ? (
        <span className="text-json-bracket">
          {getBracket(node.type, true)}
          {!isExpanded && (
            <>
              <span className="mx-1 text-text-muted">
                {node.childCount} {node.childCount === 1 ? "item" : "items"}
              </span>
              {getBracket(node.type, false)}
            </>
          )}
        </span>
      ) : (
        <span className={`truncate ${getValueColorClass(node.type)}`}>{formatValue(node)}</span>
      )}

      {/* Copy button (visible on hover) */}
      <span className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <CopyButton text={node.path} />
      </span>
    </div>
  );
});
