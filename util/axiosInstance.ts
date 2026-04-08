'use client';

import { useLoading } from '@/layout/context/loadingcontext';
import Cookies from 'js-cookie';
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';
import useStudentAuthStore from '@/store/useStudentAuthStore';

export const useHttp = (): AxiosInstance => {
    const { showToast } = useToast();
    const axiosInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_TYPE === 'dev' ? '/v1/api' : process.env.NEXT_PUBLIC_BACKEND_URL,
        withCredentials: true, // 도메인 다른경우 필요한 옵션
        timeout: 30000,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const { setLoading } = useLoading();

    // 요청 인터셉터 (Request Interceptor)
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            // App route 호출
            if (config.url?.startsWith('/app')) {
                config.baseURL = '/api';
                config.url = config.url.replace('/app', '');
            }
            if (!config.disableLoading) {
                setLoading(true);
            }

            // Admin Token
            const token = Cookies.get('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`; // 헤더에 토큰 추가
            }

            const sToken = Cookies.get('x-student-log');
            if (sToken) {
                config.headers['x-student-log'] = `Bearer ${sToken}`; // 헤더에 토큰 추가
            }

            return config;
        },
        (error) => {
            // 요청 에러 시에는 disableLoading 여부와 관계없이 로딩을 중단해야 할 수 있습니다.
            const config = error.config;
            if (!config?.disableLoading) {
                setLoading(false);
            }
            return Promise.reject(error);
        }
    );

    // 응답 인터셉터 (Response Interceptor)
    axiosInstance.interceptors.response.use(
        <T>(response: AxiosResponse<T>) => {
            const config = response.config;
            if (!config.disableLoading) {
                setLoading(false);
            }
            return response;
        },
        async (error) => {
            const config = error.config;
            if (!config?.disableLoading) {
                setLoading(false);
            }

            const originalRequest = error.config;
            const isStudentRequest = !!originalRequest?.headers['x-student-log'];
            const isTokenExpired =
                error.response?.status === 401 ||
                error.response?.data?.message === 'jwt expired' ||
                error.response?.data?.error === 'jwt expired';

            // 학생용 토큰 만료 처리
            if (isTokenExpired && isStudentRequest && !originalRequest._retry) {
                originalRequest._retry = true;
                try {
                    // Refresh Token으로 새 Access Token 요청
                    const res = await axios.post(
                        `${axiosInstance.defaults.baseURL}/choiMath/student/refreshToken`,
                        {},
                        { withCredentials: true }
                    );

                    if (res.data && res.data.studentToken) {
                        const { studentToken, student } = res.data;

                        // 스토어 업데이트 (Zustand & Cookie)
                        const { setStudentAuth } = useStudentAuthStore.getState();
                        setStudentAuth(studentToken, student);

                        // 실패했던 원래 요청 재시도
                        originalRequest.headers['x-student-log'] = `Bearer ${studentToken}`;
                        return axiosInstance(originalRequest);
                    }
                } catch (refreshError) {
                    // Refresh도 실패 시 세션 종료
                    const { clearStudentAuth } = useStudentAuthStore.getState();
                    clearStudentAuth();
                    return Promise.reject('student session expired');
                }
            }

            if (error.response && axios.isAxiosError(error)) {
                const { status } = error.response;
                const exceptUrl = ['/choiMath/share/detail-with-auth'];
                if (status === 401) {
                    if (exceptUrl.includes(error.config?.url || '')) {
                        showToast({
                            severity: 'error',
                            summary: error.response?.data?.error || 'error',
                            detail: error.response?.data?.message || ''
                        });
                    } else if (!isStudentRequest) {
                        // 관리자용 로그인 만료 처리 (필요시 주석 해제)
                        // window.location.href = '/auth/login';
                    }
                } else if (status === 403) {
                    showToast({
                        severity: 'error',
                        summary: 'Error',
                        detail: '권한 없음: 접근할 수 없습니다.'
                    });
                } else if (status === 404) {
                    showToast({
                        severity: 'error',
                        summary: 'Error',
                        detail: '페이지를 찾을수 없습니다.'
                    });
                } else {
                    showToast({
                        severity: 'error',
                        summary: 'Error',
                        detail: error.response.data?.error || error.response?.statusText || error.response.data?.message
                    });
                }
            }
            return Promise.reject(
                error.response
                    ? error.response.data?.error || error.response?.statusText || error.response.data?.message
                    : 'no content'
            );
        }
    );
    return axiosInstance;
};
