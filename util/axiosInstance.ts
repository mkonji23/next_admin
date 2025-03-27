import axios, { AxiosResponse } from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_TYPE === 'dev' ? '/api' : process.env.NEXT_PUBLIC_BACKEND_URL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 요청 인터셉터 (Request Interceptor)
axiosInstance.interceptors.request.use(
    (config) => {
        console.log('config', config.baseURL);
        const auth = localStorage.getItem('auth'); // 로컬 스토리지에서 토큰 가져오기
        const token = auth ? JSON.parse(auth).accessToken : '';
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // 헤더에 토큰 추가
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 응답 인터셉터 (Response Interceptor)
axiosInstance.interceptors.response.use(
    <T>(response: AxiosResponse<T>) => response,
    (error) => {
        if (error.response && axios.isAxiosError(error)) {
            const { status } = error.response;
            if (status === 401) {
                console.error('인증 실패: 다시 로그인하세요.');
                localStorage.removeItem('accessToken'); // 토큰 삭제
                window.location.href = '/login'; // 로그인 페이지로 이동
            } else if (status === 403) {
                console.error('권한 없음: 접근할 수 없습니다.');
            } else if (status >= 500) {
                console.error(error.response.data.message);
            }
        }
        return Promise.reject(error.response ? error.response.data.message : 'no content');
    }
);

export default axiosInstance;
