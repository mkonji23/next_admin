import { create } from 'zustand';
import Cookies from 'js-cookie';
interface User {
    userId?: string;
    userName?: string;
    email: string;
    createdDate: string;
    token: string;
    auth?: string | null;
}

interface UserInfo {
    userInfo: User;
    setInfo: (data: User) => void;
    clearInfo: () => void;
    initializeFromStorage: () => void;
}

// localStorage에서 userInfo 복원
const getStoredUserInfo = (): User | null => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('userInfo');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Failed to parse stored userInfo:', error);
    }
    return null;
};

// localStorage에 userInfo 저장
const setStoredUserInfo = (data: User) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('userInfo', JSON.stringify(data));
    } catch (error) {
        console.error('Failed to store userInfo:', error);
    }
};

// localStorage에서 userInfo 제거
const removeStoredUserInfo = () => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.removeItem('userInfo');
    } catch (error) {
        console.error('Failed to remove stored userInfo:', error);
    }
};

const useAuthStore = create<UserInfo>()((set) => ({
    userInfo: (() => {
        // 초기화 시 localStorage에서 복원 시도
        const stored = getStoredUserInfo();
        return stored || { email: '', createdDate: '', token: '' };
    })(),
    setInfo: (data) => {
        set({ userInfo: data });
        setStoredUserInfo(data);
        Cookies.set('token', data.token, {
            expires: 1,
            secure: process.env.NEXT_PUBLIC_TYPE !== 'dev',
            sameSite: 'Strict' // CSRF 방어
        });
    },
    clearInfo: () => {
        set({ userInfo: { email: '', createdDate: '', token: '' } });
        removeStoredUserInfo();
        Cookies.remove('token');
    },
    initializeFromStorage: () => {
        const stored = getStoredUserInfo();
        const token = Cookies.get('token');
        // 토큰이 있고 저장된 userInfo가 있으면 복원
        if (token && stored) {
            set({ userInfo: stored });
        } else if (!token) {
            // 토큰이 없으면 저장된 정보도 제거
            removeStoredUserInfo();
            set({ userInfo: { email: '', createdDate: '', token: '' } });
        }
    }
}));

export default useAuthStore;
