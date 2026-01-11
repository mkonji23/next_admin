import useAuthStore from '@/store/useAuthStore';
import { useHttp } from '@/util/axiosInstance';

interface UserInput {
    userId: string;
    password: string;
}

interface UserResponse {
    email: string;
    createdDate: string;
    token: string;
}
const useAuth = () => {
    const { post } = useHttp();
    const { setInfo, clearInfo } = useAuthStore();
    const login = async (param: UserInput) => {
        try {
            const res = await post<UserResponse>('/choiMath/user/signin', param);
            setInfo(res.data);
            return true;
        } catch (error) {
            console.log('error', error);
            return false;
        }
    };

    const logout = () => {
        clearInfo();
    };

    return { login, logout };
};

export default useAuth;
