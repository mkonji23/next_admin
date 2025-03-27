import useAuthStore from '@/store/useAuthStore';
import axiosInstance from '@/util/axiosInstance';

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
    const { setInfo } = useAuthStore();
    const login = async (param: UserInput) => {
        try {
            const res = await axiosInstance.post<UserResponse>('/db/sign-in', param);
            setInfo(res.data);
        } catch (error) {
            console.log('error', error);
        }
    };

    return { login };
};

export default useAuth;
