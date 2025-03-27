import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    email: string;
    createdDate: string;
    token: string;
}

interface UserInfo {
    userInfo: User;
    setInfo: (data: User) => void;
}

const useAuthStore = create<UserInfo>()(
    persist(
        (set) => ({
            userInfo: { email: '', createdDate: '', token: '' },
            setInfo: (data) => set({ userInfo: data })
        }),
        {
            name: 'auth'
        }
    )
);

export default useAuthStore;
