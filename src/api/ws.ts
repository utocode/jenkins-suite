import * as vscode from 'vscode';
import WebSocket from 'ws';
import { BuildsProvider } from '../sidebar/builds-provider';
import { NotifyProvider } from '../sidebar/notify-provider';
import { Result } from '../types/jenkins-types';
import { WsTalkMessage } from '../types/model';
import { getLocalDate } from '../utils/datetime';
import logger from '../utils/logger';
import { showMessageWithTimeout } from '../utils/vsc';

export class WebSocketClient {

    private socket: WebSocket | undefined;

    private reconnectTimer: NodeJS.Timeout | undefined;
    private pingInterval: number = 30000;
    private pingTimer: NodeJS.Timeout | undefined;

    constructor(private serverAddress: string, private readonly reconnectInterval: number, private readonly buildsProvider: BuildsProvider, private readonly notifyProvider: NotifyProvider) {
    }

    public connect(): void {
        this.socket = new WebSocket(this.serverAddress);
        console.log(`socket <${this.serverAddress}>`);

        this.socket.on('open', () => {
            // vscode.window.showInformationMessage('WebSocket connection has been established successfully.');
            logger.info(`WebSocket connection has been established <${this.serverAddress}>`);
            this.startPingPong();
        });

        this.socket.on('message', (data: WebSocket.Data) => {
            const message = data.toString();
            logger.debug(`message <${message}>`);

            this.handleMessage(message);
        });

        this.socket.on('close', (code: number, reason: string) => {
            logger.warn(`WebSocket connection closed with code ${code} and reason: <${reason}>`);
            this.setReconnectTimer();
        });

        this.socket.on('error', (code: number) => {
            logger.warn(`WebSocket connection closed with code ${code}`);
        });
    }

    public disconnect(): void {
        if (this.socket) {
            this.clearReconnectTimer();
            this.stopPingPong();
            this.socket.close();
        }
        logger.info('disconnected');
    }

    private setReconnectTimer(): void {
        if (!this.reconnectTimer) {
            this.reconnectTimer = setInterval(() => {
                if (this.socket?.readyState === WebSocket.CLOSED) {
                    this.connect();
                }
            }, this.reconnectInterval);
        }
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearInterval(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }

    public sendMessage(message: string): void {
        if (this.socket) {
            this.socket.send(message);
        }
    }

    private handleMessage(message: string): void {
        try {
            const response = JSON.parse(message) as WsTalkMessage;
            response.createTime = getLocalDate(response.timestamp);
            const mesg = `Job <${response.job} #${response.number}>: ${response.result} `;
            if (response.result === Result.success) {
                vscode.window.showInformationMessage(mesg);
            } else if (response.result === Result.start) {
                showMessageWithTimeout(mesg, 10000);
            } else {
                vscode.window.showErrorMessage(mesg);
            }

            this.notifyProvider.insert(response);
            if (this.buildsProvider.jobs && response.job === this.buildsProvider.jobs.name) {
                this.buildsProvider.refresh();
            }
        } catch (error: any) {
            logger.error(`Exception <${error.message}>`);
            vscode.window.showErrorMessage(error.message);
        }
    }

    private startPingPong(): void {
        this.pingTimer = setInterval(() => {
            if (this.socket) {
                this.socket.ping();
            }
        }, this.pingInterval);

        this.socket?.on('pong', () => {
            logger.debug('Pong received from the server.');
        });
    }

    private stopPingPong(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = undefined;
        }
    }

}
