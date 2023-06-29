import { exec } from 'child_process';
import * as vscode from 'vscode';
import { Executor } from '../api/executor';
import { WebSocketClient } from '../api/ws';
import JenkinsConfiguration, { JenkinsServer } from '../config/settings';
import { JobsModel, ViewsModel } from '../types/model';
import { switchConnection } from '../ui/manage';
import { openLinkBrowser, showInfoMessageWithTimeout } from '../ui/ui';
import logger from '../utils/logger';
import { BuildsProvider } from './builds-provider';
import { JobsProvider } from './jobs-provider';
import { NotifyProvider } from './notify-provider';
import { ViewsProvider } from './views-provider';

export class ConnectionProvider implements vscode.TreeDataProvider<JenkinsServer> {

    private _executor: Executor | undefined;

    private _wsClient: WebSocketClient | undefined;

    private _currentServer: JenkinsServer | undefined;

    private _onDidChangeTreeData: vscode.EventEmitter<JenkinsServer | undefined> = new vscode.EventEmitter<JenkinsServer | undefined>();

    readonly onDidChangeTreeData: vscode.Event<JenkinsServer | JenkinsServer[] | undefined> = this._onDidChangeTreeData.event;

    constructor(protected context: vscode.ExtensionContext, private readonly viewsProvider: ViewsProvider, private readonly jobsProvider: JobsProvider, private readonly buildsProvider: BuildsProvider, private readonly notifyProvider: NotifyProvider) {
        context.subscriptions.push(
            vscode.commands.registerCommand('utocode.switchConnection', async () => {
                switchConnection(context, this);
            }),
            vscode.commands.registerCommand('utocode.connections.refresh', () => {
                this.refresh();
            }),
            vscode.commands.registerCommand('utocode.goHome', (server: JenkinsServer) => {
                openLinkBrowser(server.url);
            }),
            vscode.commands.registerCommand('utocode.connectServer', (server: JenkinsServer) => {
                this.connect(server);
            }),
            vscode.commands.registerCommand('utocode.disconnectServer', (server: JenkinsServer) => {
                this.disconnect(server);
            }),
            vscode.commands.registerCommand('utocode.setPrimaryServer', (server: JenkinsServer) => {
                if (JenkinsConfiguration.primary !== server.name) {
                    JenkinsConfiguration.primary = server.name;
                }
            }),
            vscode.commands.registerCommand('utocode.connectSSH', (server: JenkinsServer) => {
                if (server.ssh && server.ssh.enabled) {
                    const terminal = vscode.window.createTerminal(server.name + ' terminal');
                    const port = server.ssh.port === 22 ? '' : ' -p ' + server.ssh.port;
                    const sshCommand = `ssh ${server.ssh.username}@${server.ssh.address}${port}`;
                    terminal.sendText(sshCommand);
                    terminal.show();
                } else {
                    showInfoMessageWithTimeout(vscode.l10n.t('SSH Server is not exist'));
                }
            }),
            vscode.commands.registerCommand('utocode.connectSSHExternal', (server: JenkinsServer) => {
                if (server.ssh && server.ssh.enabled) {
                    const program = server.ssh.externalPath ?? 'putty';
                    let portArg = server.ssh.externalArg ?? '-P';
                    if (!server.ssh.externalArg) {
                        if (program.endsWith('putty.exe')) {
                            portArg = '-P';
                        } else {
                            portArg = ':';
                        }
                    }
                    if (portArg.startsWith('-')) {
                        portArg = ` ${portArg} `;
                    }
                    const port = server.ssh.port === 22 ? '' : `${portArg}${server.ssh.port}`;
                    const execCmd = `${program} ${server.ssh.username}@${server.ssh.address}${port} ${server.ssh.extraArg ?? ''}`;
                    exec(execCmd, (error, stdout, stderr) => {
                        if (error) {
                            console.log(stderr);
                        }
                    });
                } else {
                    showInfoMessageWithTimeout(vscode.l10n.t('SSH Server Address is not exist'));
                }
            }),
            vscode.commands.registerCommand('utocode.views.refresh', () => {
                this.updateViewsProvider();
            }),
            vscode.commands.registerCommand('utocode.showJobs', (view: ViewsModel) => {
                viewsProvider.view = view;
                jobsProvider.view = view;
                const jobs: Partial<JobsModel> = {};
                buildsProvider.jobs = jobs as JobsModel;
            }),
            vscode.commands.registerCommand('utocode.openExternalBrowser', (job: JobsModel) => {
                openLinkBrowser(job.url);
            }),
        );

        const primary = JenkinsConfiguration.primary;
        if (primary) {
            const server = this.getServer(primary);
            this.connect(server);
        }
    }

    async getTreeItem(element: JenkinsServer): Promise<vscode.TreeItem> {
        console.log(`connection::treeItem <${element}>`);
        let status = 'grey';
        if (this._currentServer && this._currentServer.name === element.name) {
            if (this.isConnected()) {
                status = 'blue';
            } else {
                status = 'red';
            }
        }
        let treeItem; vscode.TreeItem;
        treeItem = {
            label: element.name,
            description: element.description,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'connection',
            iconPath: this.context.asAbsolutePath(`resources/job/${status}.png`),
            tooltip: this.viewServer(element)
        };
        return treeItem;
    }

    viewServer(server: JenkinsServer) {
        const text = new vscode.MarkdownString();
        text.appendMarkdown(`## Jenkins\n`);
        text.appendMarkdown(`_${server.description ?? ' '}_\n`);
        text.appendMarkdown('\n---\n');
        text.appendMarkdown(`* name: __${server.name}__\n`);
        text.appendMarkdown(`* user: **${server.username}**\n`);
        text.appendMarkdown(`* URL: *${server.url}*\n`);
        text.appendMarkdown('\n---\n');

        const wsStatus = vscode.Uri.file(this.context.asAbsolutePath(`resources/job/${server.wstalk?.enabled ? 'green' : 'grey'}_16.png`));
        text.appendMarkdown(`## WsTalk ![Server](${wsStatus})\n`);
        text.appendMarkdown(`${server.wstalk?.description ?? ' '}\n`);
        text.appendMarkdown('\n---\n');
        if (server.wstalk?.enabled) {
            text.appendMarkdown(`* URL: *${server.wstalk.url}*\n`);
        } else {
            text.appendMarkdown(`* ${server.wstalk?.enabled ? 'enabled' : 'disabled'}\n`);
        }
        text.appendMarkdown('\n---\n');

        const sshStatus = vscode.Uri.file(this.context.asAbsolutePath(`resources/job/${server.ssh?.enabled ? 'green' : 'grey'}_16.png`));
        text.appendMarkdown(`## SSH ![Server](${sshStatus})\n`);
        text.appendMarkdown('\n---\n');
        if (server.ssh?.enabled) {
            text.appendMarkdown(`* user: **${server.ssh.username}**\n`);
            text.appendMarkdown(`* address: **${server.ssh.address}**\n`);
            text.appendMarkdown(`* port: ${server.ssh.port}\n`);
        } else {
            text.appendMarkdown(`* ${server.ssh?.enabled ? 'enabled' : 'disabled'}\n`);
        }
        return text;
    }

    getChildren(element?: JenkinsServer): JenkinsServer[] {
        return this.getServers();
    }

    getServers = () => Array.from(JenkinsConfiguration.servers.values());

    getServer = (name: string): JenkinsServer => this.getServers().filter(it => name === it.name)[0];

    public async connect(server: JenkinsServer) {
        try {
            if (server === undefined) {
                return;
            }
            this._executor = new Executor(this.context, server);
            await this._executor.initialized();
            this._currentServer = server;
            console.log(`  * jenkins <${this._currentServer.name}> url <${server.url}> `);
        } catch (error: any) {
            logger.error(error.message);
            vscode.window.showErrorMessage(error.message);
            return;
        }

        try {
            if (server.wstalk && server.wstalk.enabled && server.wstalk.url) {
                this._wsClient = new WebSocketClient(server.wstalk.url, 15000, this.buildsProvider, this.notifyProvider);
                this._wsClient.connect();
            }
        } catch (error: any) {
            logger.error(error.message);
            vscode.window.showErrorMessage(error.message);
        }
        this.updateUI(true);
    }

    public updateViewsProvider() {
        if (this._executor) {
            this._executor.getInfo().then(info => {
                this.viewsProvider.info = info;
            });
        } else {
            this.viewsProvider.info = undefined;
        }
    }

    public updateUI(connected: boolean) {
        this.updateViewsProvider();
        if (!connected && this._wsClient) {
            this._wsClient?.disconnect();
            this.notifyProvider.clear();
        }
        this.viewsProvider.executor = this._executor;
        this.jobsProvider.executor = this._executor;
        this.buildsProvider.executor = this._executor;

        if (connected) {
            showInfoMessageWithTimeout(vscode.l10n.t(`Connected Server <{0}>`, `${this._currentServer?.description ?? this._currentServer?.name}`));
        } else {
            const jobs: Partial<JobsModel> = {};
            this.buildsProvider.jobs = jobs as JobsModel;
            this.notifyProvider.clear();

            vscode.window.showInformationMessage(vscode.l10n.t(`Disconnected Server <{0}>`, `${this._currentServer?.name}`));
        }
        this.refresh();
    }

    public disconnect(server: JenkinsServer): void {
        if (server.name === this._currentServer?.name) {
            this._executor?.disconnect();
            this._executor = undefined;
            this.updateUI(false);
            this._currentServer = undefined;
        }
    }

    public changeServer(server: JenkinsServer) {
        if (server.name !== this._currentServer?.name) {
            if (this._currentServer) {
                this.disconnect(server);
            }
            this.connect(server);
        } else {
            this.refresh();
        }
    }

    public isConnected() {
        return this._executor?.initialized();
    }

    public get executor() {
        if (!this._executor) {
            showInfoMessageWithTimeout(vscode.l10n.t('Server is not connected'));
        }
        return this._executor;
    }

    public executeCommand(cmdName: string, ...params: any[]) {
        if (!this._executor) {
            throw new Error(`Jenkins is not connnected`);
        } else if (typeof this._executor[cmdName] !== 'function') {
            throw new Error(`command < ${cmdName}> is not function`);
        }

        if (this._executor && typeof this._executor[cmdName] === 'function') {
            return (this._executor[cmdName] as Function)(...params);
        }
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

}
