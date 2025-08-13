import useAuthStore from '@/store/useAuthStore';
import { useHttp } from '@/util/axiosInstance';

interface UserInput {
    email: string;
    password: string;
}

interface UserResponse {
    email: string;
    createdDate: string;
    token: string;
}
const useAuth = () => {
    const { post } = useHttp();
    const { setInfo } = useAuthStore();
    const login = async (param: UserInput) => {
        try {
            const res = await post<UserResponse>('/v1/db/sign-in', param);
            setInfo(res.data);
            return true;
        } catch (error) {
            console.log('error', error);
            return false;
        }
    };

    return { login };
};

export default useAuth;
