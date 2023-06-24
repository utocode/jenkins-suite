import {
    AxiosInstance,
    AxiosInterceptorManager,
    AxiosRequestConfig,
    AxiosResponse,
    InternalAxiosRequestConfig
} from 'axios';


type JenkinsAxiosResponse<T = any> = {
    response?: T
};

export interface JenkinsAxiosInterface extends AxiosInstance {

    interceptors: {
        request: AxiosInterceptorManager<InternalAxiosRequestConfig>
        response: AxiosInterceptorManager<AxiosResponse<JenkinsAxiosResponse>>
    }

    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>

    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>

    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>

    postForm<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>

    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>

    patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>

}
