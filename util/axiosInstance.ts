import { useLoading } from '@/layout/context/loadingcontext';
import Cookies from 'js-cookie';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { useToast } from '@/hooks/useToast';
import { useRouter } from 'next/navigation';

export const useHttp = (): AxiosInstance => {
    const { showToast } = useToast();
    const axiosInstance = axios.create({
        baseURL: process.env.NEXT_PUBLIC_TYPE === 'dev' ? '/v1/api' : process.env.NEXT_PUBLIC_BACKEND_URL,
        withCredentials: true, // 도메인 다른경우 필요한 옵션
        timeout: 5000,
        headers: {
            'Content-Type': 'application/json'
        }
    });

    const { setLoading } = useLoading();
    // 요청 인터셉터 (Request Interceptor)
    axiosInstance.interceptors.request.use(
        (config) => {
            // App route 호출
            if (config.url?.startsWith('/app')) {
                config.baseURL = '/api';
                config.url = config.url.replace('/app', '');
            }
            setLoading(true);
            const token = Cookies.get('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`; // 헤더에 토큰 추가
            }
            return config;
        },
        (error) => {
            setLoading(false);
            return Promise.reject(error);
        }
    );

    // 응답 인터셉터 (Response Interceptor)
    axiosInstance.interceptors.response.use(
        <T>(response: AxiosResponse<T>) => {
            setLoading(false);
            return response;
        },
        (error) => {
            setLoading(false);
            if (error.response && axios.isAxiosError(error)) {
                const { status } = error.response;
                if (status === 401) {
                    console.error('인증 실패: 다시 로그인하세요.');
                    window.location.href = '/auth/login'; // 로그인 페이지로 이동
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
                        detail:  error.response.data?.error || error.response?.statusText || error.response.data?.message
                    });
                }
            }
            return Promise.reject(error.response ? error.response.data.message : 'no content');
        }
    );
    return axiosInstance;
};
