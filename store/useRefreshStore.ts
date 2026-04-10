import { create } from 'zustand';

interface RefreshState {
    refreshSignal: number;
    triggerRefresh: () => void;
    initRefresh: () => void;
}

export const useRefreshStore = create<RefreshState>((set) => ({
    refreshSignal: 0,
    initRefresh: () => set(() => ({ refreshSignal: 0 })),
    triggerRefresh: () => set((state) => ({ refreshSignal: state.refreshSignal + 1 }))
}));
