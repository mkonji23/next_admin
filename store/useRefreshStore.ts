import { create } from 'zustand';

interface RefreshState {
    refreshSignal: number;
    noticeRefreshSignal: number;
    triggerRefresh: () => void;
    triggerNoticeRefresh: () => void;
    initRefresh: () => void;
}

export const useRefreshStore = create<RefreshState>((set) => ({
    refreshSignal: 0,
    noticeRefreshSignal: 0,
    initRefresh: () => set(() => ({ refreshSignal: 0, noticeRefreshSignal: 0 })),
    triggerRefresh: () => set((state) => ({ refreshSignal: state.refreshSignal + 1 })),
    triggerNoticeRefresh: () => set((state) => ({ noticeRefreshSignal: state.noticeRefreshSignal + 1 }))
}));
