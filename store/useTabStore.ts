
import { create } from 'zustand';

export interface Tab {
    id: string;
    label: string;
    path: string;
}

interface TabState {
    tabs: Tab[];
    activeTab: string | null;
    addTab: (tab: Tab) => void;
    removeTab: (tabId: string) => void;
    setActiveTab: (tabId: string) => void;
    clearTabs: () => void;
    reorderTabs: (startIndex: number, endIndex: number) => void;
}

export const useTabStore = create<TabState>((set) => ({
    tabs: [],
    activeTab: null,
    addTab: (tab) =>
        set((state) => {
            if (state.tabs.some((t) => t.id === tab.id)) {
                return { activeTab: tab.id };
            }
            return {
                tabs: [...state.tabs, tab],
                activeTab: tab.id
            };
        }),
    removeTab: (tabId) =>
        set((state) => {
            const tabIndex = state.tabs.findIndex((t) => t.id === tabId);
            if (tabIndex === -1) return state;

            const newTabs = state.tabs.filter((t) => t.id !== tabId);
            let newActiveTab = state.activeTab;

            if (state.activeTab === tabId) {
                if (newTabs.length === 0) {
                    newActiveTab = null;
                } else {
                    const newActiveIndex = Math.max(0, tabIndex - 1);
                    newActiveTab = newTabs[newActiveIndex].id;
                }
            }

            return {
                tabs: newTabs,
                activeTab: newActiveTab
            };
        }),
    setActiveTab: (tabId) => set({ activeTab: tabId }),
    clearTabs: () => set({ tabs: [], activeTab: null }),
    reorderTabs: (startIndex, endIndex) =>
        set((state) => {
            const newTabs = [...state.tabs];
            const [removed] = newTabs.splice(startIndex, 1);
            newTabs.splice(endIndex, 0, removed);
            return { tabs: newTabs };
        })
}));
