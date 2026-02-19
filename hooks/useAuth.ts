import useAuthStore from '@/store/useAuthStore';
import { useHttp } from '@/util/axiosInstance';

interface UserInput {
    userId: string;
    password: string;
}

interface UserResponse {
    userId?: string;
    userName?: string;
    email: string;
    createdDate: string;
    token: string;
    auth?: string | null;
}
const useAuth = () => {
    const { post } = useHttp();
    const { setInfo, clearInfo } = useAuthStore();
    const login = async (param: UserInput) => {
        try {
            const res = await post<UserResponse>('/choiMath/user/signin', param);
            setInfo(res.data);
            if(res?.data?.token){
                return true;
            }else{
                return false;
            }
        } catch (error) {
            return false;
        }
    };

    const logout = () => {
        clearInfo();
    };

    return { login, logout };
};

export default useAuth;
