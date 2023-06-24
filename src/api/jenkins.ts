import axios, { Axios, AxiosHeaders, AxiosRequestConfig } from 'axios';
import FormData from 'form-data';
import { JenkinsServer } from '../config/settings';
import { CrumbIssuer } from '../types/model';
import { Response } from '../types/response';
import { JenkinsAxiosInterface } from './interfaces';

export class Jenkins {

    private client: JenkinsAxiosInterface;

    private _crumb: string = '';

    constructor(private readonly _server: JenkinsServer) {
        this.client = axios.create({
            baseURL: this.server.url,
            auth: {
                username: this.server.username,
                password: this.server.token
            }
        });
    }

    public get server(): JenkinsServer {
        return this._server;
    }

    public async initialized() {
        const crumbIssuer = await this.getCrumbIssuer();
        // logger.debug(`crumbIssuer <${crumbIssuer.crumb}>`);
        this._crumb = crumbIssuer.crumb;
        return this._crumb ? true : false;
    }

    public expire() {
        this._crumb = '';
    }

    async getCrumbIssuer(): Promise<CrumbIssuer> {
        return await this._get<CrumbIssuer>(
            `crumbIssuer/api/json`
        );
    }

    get crumb() {
        return this._crumb ?? '';
    }

    makeBearerToken(server: JenkinsServer) {
        const credentials = `${server.username}:${server.token}`;
        return Buffer.from(credentials).toString('base64');
    }

    _get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        console.log(`url <${url}>`);
        const response = await this.client.get<Response<T>>(url, config);
        console.log(`response <${response.data}>`);

        return response.data;
    };

    _post = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        console.log(`_post:: url <${url}>`);
        if (!config) {
            config = {
            };
        }

        let headers: AxiosHeaders;
        if (config.headers) {
            headers = config.headers as AxiosHeaders;
        } else {
            headers = new AxiosHeaders();
        }
        headers.set('jenkins-crumb', this._crumb);
        config.headers = headers;
        config.method = 'POST';
        // if (data) {
        //     config.data = data;
        // }
        try {
            const response = await this.client.post<Response<T>>(url, data, config);
            console.log(`response <${response}>`);
            return response.data;
        } catch (error: any) {
            console.log(`  >> Error <${error.message}>`);
            return error.message;
        }
    };

    _postForm = async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
        console.log(`url <${url}>`);
        if (!config) {
            config = {
            };
        }

        const headers = new AxiosHeaders();
        headers.set('jenkins-crumb', this._crumb);
        headers.set('Content-Type', 'multipart/form-data; charset=utf-8;');
        config.headers = headers;
        config.method = 'POST';

        try {
            const response = await this.client.postForm<Response<T>>(url, formData, config);

            console.log(`response <${response.data}>`);
            return response.data;
        } catch (error: any) {
            console.log(`  >> Error <${error.message}>`);
            return error.message;
        }
    };

    _postJson = async <T>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<T> => {
        console.log(`url <${url}>`);
        if (!config) {
            config = {
            };
        }

        const headers = new AxiosHeaders();
        headers.set('jenkins-crumb', this._crumb);
        headers.set('Content-Type', 'application/json; charset=utf-8');
        config.headers = headers;
        config.method = 'POST';

        try {
            const response = await this.client.postForm<Response<T>>(url, formData, config);

            console.log(`response <${response.data}>`);
            return response.data;
        } catch (error: any) {
            console.log(`  >> Error <${error.message}>`);
            return error.message;
        }
    };

    _put = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        const response = await this.client.put<Response<T>>(url, data, config);
        return response.data;
    };

    _delete = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
        const response = await this.client.delete<Response<T>>(url, config);
        return response.data;
    };

    _create = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
        console.log(`_create:: url <${url}>`);
        if (!config) {
            config = {
            };
        }

        let headers: AxiosHeaders;
        if (config.headers) {
            headers = config.headers as AxiosHeaders;
        } else {
            headers = new AxiosHeaders();
        }
        headers.set('Content-Type', 'application/xml; charset=utf-8');
        headers.set('jenkins-crumb', this._crumb);
        config.headers = headers;
        config.method = 'POST';
        // if (data) {
        //     config.data = data;
        // }
        try {
            const response = await this.client.post<Response<T>>(url, data, config);
            console.log(`response <${response.headers ?? response.data}>`);
            return response.data;
        } catch (error: any) {
            console.log(`  >> Error <${error.message}>`);
            return error.message;
        }
    };

}
