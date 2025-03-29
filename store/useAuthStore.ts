import { create } from 'zustand';
import Cookies from 'js-cookie';
interface User {
    email: string;
    createdDate: string;
    token: string;
}

interface UserInfo {
    userInfo: User;
    setInfo: (data: User) => void;
    clearInfo: () => void;
}

const useAuthStore = create<UserInfo>()((set) => ({
    userInfo: { email: '', createdDate: '', token: '' },
    setInfo: (data) => {
        set({ userInfo: data });
        Cookies.set('token', data.token, {
            expires: 1,
            secure: process.env.NEXT_PUBLIC_TYPE !== 'dev',
            sameSite: 'Strict' // CSRF 방어
        });
    },
    clearInfo: () => {
        set({ userInfo: { email: '', createdDate: '', token: '' } });
        Cookies.remove('token');
    }
}));

export default useAuthStore;
