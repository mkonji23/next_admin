import 'axios';

declare module 'axios' {
    export interface AxiosRequestConfig {
        disableLoading?: boolean;
    }
}
