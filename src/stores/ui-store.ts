import { create } from "zustand";

export type ActivePanel = "tree" | "analysis" | "query";
export type ActiveTab = "stats" | "schema" | "keys" | "depth" | "arrays" | "types";

interface UiStore {
  activePanel: ActivePanel;
  setActivePanel: (panel: ActivePanel) => void;

  activeAnalysisTab: ActiveTab;
  setActiveAnalysisTab: (tab: ActiveTab) => void;

  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;

  selectedPath: string | null;
  setSelectedPath: (path: string | null) => void;

  expandedPaths: Set<string>;
  toggleExpand: (path: string) => void;
  expandAll: (paths: string[]) => void;
  collapseAll: () => void;

  queryBarVisible: boolean;
  setQueryBarVisible: (visible: boolean) => void;
}

export const useUiStore = create<UiStore>()((set) => ({
  activePanel: "tree",
  setActivePanel: (panel) => set({ activePanel: panel }),

  activeAnalysisTab: "stats",
  setActiveAnalysisTab: (tab) => set({ activeAnalysisTab: tab }),

  sidebarWidth: 400,
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  selectedPath: null,
  setSelectedPath: (path) => set({ selectedPath: path }),

  expandedPaths: new Set<string>(),
  toggleExpand: (path) =>
    set((state) => {
      const next = new Set(state.expandedPaths);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return { expandedPaths: next };
    }),
  expandAll: (paths) =>
    set((state) => {
      const next = new Set(state.expandedPaths);
      for (const p of paths) next.add(p);
      return { expandedPaths: next };
    }),
  collapseAll: () => set({ expandedPaths: new Set() }),

  queryBarVisible: true,
  setQueryBarVisible: (visible) => set({ queryBarVisible: visible }),
}));
