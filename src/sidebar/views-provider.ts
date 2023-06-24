import path from 'path';
import * as vscode from 'vscode';
import { Executor } from '../api/executor';
import { JenkinsInfo, ModelQuickPick, ViewsModel } from '../types/model';
import { showInfoMessageWithTimeout } from '../ui/ui';
import { printEditorWithNew } from '../utils/editor';
import logger from '../utils/logger';
import { JobsProvider } from './jobs-provider';

export class ViewsProvider implements vscode.TreeDataProvider<ViewsModel> {

    private _info: JenkinsInfo | undefined;

    private _executor: Executor | undefined;

    private _view!: ViewsModel;

    constructor(protected context: vscode.ExtensionContext, private readonly jobsProvider: JobsProvider) {
        context.subscriptions.push(
            vscode.commands.registerCommand('utocode.reloadWebview', (view: ViewsModel) => {
                logger.debug(view.name);
                this.refresh();
            }),
            vscode.commands.registerCommand('utocode.switchView', async () => {
                const views = this.info?.views;
                if (!views) {
                    showInfoMessageWithTimeout('View is not exists');
                    return;
                }
                const items: ModelQuickPick<ViewsModel>[] = [];
                views.forEach(view => {
                    items.push({
                        label: view.name,
                        description: view._class.split('.').pop(),
                        model: view
                    });
                });

                await vscode.window.showQuickPick(items, {
                    placeHolder: vscode.l10n.t("Select to switch view")
                }).then(async (selectedItem) => {
                    if (selectedItem) {
                        jobsProvider.view = selectedItem.model!;
                    }
                });
            }),
            vscode.commands.registerCommand('utocode.createView', async () => {
                const mesg = await this.executor?.createView();
                console.log(`result <${mesg}>`);
                setTimeout(() => {
                    vscode.commands.executeCommand('utocode.views.refresh');
                }, 1500);
            }),
            vscode.commands.registerCommand('utocode.getConfigView', async (view: ViewsModel) => {
                const text = await this.executor?.getConfigView(view.name);
                console.log(`text <${text}>`);
                printEditorWithNew(text);
            }),
            vscode.commands.registerCommand('utocode.withView', async () => {
                if (!this._executor || !this._executor?.isConnected()) {
                    vscode.window.showErrorMessage('Jenkins server is not connected');
                    return;
                }

                const items: vscode.QuickPickItem[] = [
                    { label: 'Update', description: 'Update the existing view' },
                    { label: 'Create', description: 'Create a view with a new name' },
                ];
                await vscode.window.showQuickPick(items, {
                    placeHolder: vscode.l10n.t("Select to run view")
                }).then(async (selectedItem) => {
                    if (selectedItem) {
                        if (selectedItem.label === 'Create') {
                            await vscode.commands.executeCommand('utocode.createView');
                            setTimeout(() => {
                                vscode.commands.executeCommand('utocode.views.refresh');
                            }, 2000);
                        } else {
                            await vscode.commands.executeCommand('utocode.updateConfigView');
                            setTimeout(() => {
                                jobsProvider.refresh();
                            }, 2000);
                        }
                    } else {
                        vscode.window.showInformationMessage('Cancelled by User');
                    }
                });
            }),
        );
    }

    private _onDidChangeTreeData: vscode.EventEmitter<ViewsModel | undefined> = new vscode.EventEmitter<ViewsModel | undefined>();

    readonly onDidChangeTreeData: vscode.Event<ViewsModel | ViewsModel[] | undefined> = this._onDidChangeTreeData.event;

    getTreeItem(element: ViewsModel): vscode.TreeItem {
        let icon = 'root-folder';
        if (element.name === this._view?.name) {
            icon = 'eye'; // 'root-folder-opened';
        } else if (element._class === 'org.jenkinsci.plugins.categorizedview.CategorizedJobsView') {
            icon = 'search';
        } else if (element._class === 'udson.model.MyView"') {
            icon = 'heart';
        }

        let treeItem; vscode.TreeItem;
        treeItem = {
            label: element.name,
            description: element.description,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            command: {
                command: 'utocode.showJobs',
                title: 'Show Jobs',
                arguments: [element]
            },
            contextValue: 'views',
            iconPath: new vscode.ThemeIcon(icon)
        };
        return treeItem;
    }

    getChildren(element?: ViewsModel | undefined): vscode.ProviderResult<ViewsModel[]> {
        if (element || !this.info) {
            return Promise.resolve([]);
        } else {
            return this.info.views;
        }
    }

    public get info(): JenkinsInfo | undefined {
        return this._info;
    }

    public set info(value: JenkinsInfo | undefined) {
        this._info = value;
        this.refresh();
    }

    public get executor() {
        if (!this._executor) {
            showInfoMessageWithTimeout('Server is not connected');
        }
        return this._executor;
    }

    public set executor(executor: Executor | undefined) {
        this._executor = executor;
        this.refresh();
    }

    set view(view: ViewsModel) {
        this._view = view;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

}
