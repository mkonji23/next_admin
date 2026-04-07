'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface StudentAuthData {
    studentId?: string;
    name?: string;
    school?: string;
    grade?: string;
    phoneNumber?: string;
}

interface StudentAuthState {
    studentToken: string | null;
    studentAuthData: StudentAuthData | null;
    setStudentAuth: (token: string, data: StudentAuthData) => void;
    clearStudentAuth: () => void;
}

const useStudentAuthStore = create<StudentAuthState>()(
    persist(
        (set) => ({
            studentToken: null,
            studentAuthData: null,
            setStudentAuth: (token, data) => {
                set({ studentToken: token, studentAuthData: data });
                Cookies.set('x-student-log', token, {
                    expires: 1,
                    secure: process.env.NEXT_PUBLIC_TYPE !== 'dev',
                    sameSite: 'Strict'
                });
            },
            clearStudentAuth: () => {
                set({ studentToken: null, studentAuthData: null });
                Cookies.remove('x-student-log');
            }
        }),
        {
            name: 'student-auth-storage',
            storage: createJSONStorage(() => localStorage)
        }
    )
);

export default useStudentAuthStore;
