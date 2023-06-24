import * as vscode from "vscode";

export class JenkinsConfiguration1 {

    private readonly configuration;

    private static instance = new JenkinsConfiguration1();

    private constructor() {
        this.configuration = vscode.workspace.getConfiguration("jenkinssuite");
    }

    public static getInstance = () =>  this.instance;

    getConnectUrl(): string {
        let serverUrl: string = '';
        const url = this.getServer();
        if (url?.startsWith('http')) {
            serverUrl = url.replace('http://', 'http://' + this.getUsername() + ':' + this.getUserToken() + '@' );
        } else {
            serverUrl = 'http://' + this.getUsername() + ':' + this.getUserToken() + '@' + url;
        }

        return serverUrl;
    }

    getWsConnectUrl(): string {
        let serverUrl: string = '';
        const url = this.getWsServer();
        if (url?.startsWith('http')) {
            serverUrl = url.replace('http://', 'ws://' + this.getUsername() + ':' + this.getUserToken() + '@');
        } else {
            // serverUrl = 'ws://' + this.getUsername() + ':' + this.getUserToken() + '@' + url;
            serverUrl = '' + url;
        }

        return serverUrl;
    }

    getServer = () => this.configuration.get<string>("server.url");

    getWsServer = () => this.configuration.get<string>("ws-server.url");

    getUsername = () => this.configuration.get<string>("server.user.username");

    getUserToken = () => this.configuration.get<string>("server.user.token");

}
