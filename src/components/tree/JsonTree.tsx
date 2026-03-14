import { useRef, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useJsonStore } from "@/stores/json-store";
import { useUiStore } from "@/stores/ui-store";
import { TreeNodeRow } from "@/components/tree/TreeNode";
import type { TreeNode } from "@/types/json";
import { TREE_ROW_HEIGHT, VIRTUAL_OVERSCAN } from "@/constants/limits";

function flattenVisibleTree(nodes: TreeNode[], expandedPaths: Set<string>): TreeNode[] {
  const result: TreeNode[] = [];

  function visit(nodeList: TreeNode[]) {
    for (const node of nodeList) {
      result.push(node);
      if (expandedPaths.has(node.path) && node.children) {
        visit(node.children);
      }
    }
  }

  visit(nodes);
  return result;
}

export function JsonTree() {
  const parentRef = useRef<HTMLDivElement>(null);
  const rootNodes = useJsonStore((s) => s.rootNodes);
  const expandedPaths = useUiStore((s) => s.expandedPaths);
  const toggleExpand = useUiStore((s) => s.toggleExpand);
  const selectedPath = useUiStore((s) => s.selectedPath);
  const setSelectedPath = useUiStore((s) => s.setSelectedPath);

  const flatNodes = useMemo(
    () => flattenVisibleTree(rootNodes, expandedPaths),
    [rootNodes, expandedPaths],
  );

  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => TREE_ROW_HEIGHT,
    overscan: VIRTUAL_OVERSCAN,
  });

  const handleToggle = useCallback(
    (path: string) => {
      toggleExpand(path);
    },
    [toggleExpand],
  );

  const handleSelect = useCallback(
    (path: string) => {
      setSelectedPath(path);
    },
    [setSelectedPath],
  );

  if (flatNodes.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-muted">
        No data
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto font-mono text-sm">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const node = flatNodes[virtualItem.index]!;
          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <TreeNodeRow
                node={node}
                isExpanded={expandedPaths.has(node.path)}
                isSelected={selectedPath === node.path}
                onToggle={handleToggle}
                onSelect={handleSelect}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
