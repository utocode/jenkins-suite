import { resolve } from 'path';
import * as vscode from 'vscode';
import { Executor } from '../api/executor';
import JenkinsConfiguration from '../config/settings';
import { getResultColor } from '../types/jenkins-types';
import { BuildDetailStatus, BuildStatus, CauseParameter, JobParameter, JobsModel } from '../types/model';
import { getCauseAction, getParameterAction } from '../types/model-util';
import { showInfoMessageWithTimeout } from '../ui/ui';
import { formatDurationTime, getLocalDate } from '../utils/datetime';
import { getSelectionText, printEditorWithNew } from '../utils/editor';

export class BuildsProvider implements vscode.TreeDataProvider<BuildStatus> {

    private _jobs: JobsModel | undefined;

    private _executor: Executor | undefined;

    private _onDidChangeTreeData: vscode.EventEmitter<BuildStatus | undefined> = new vscode.EventEmitter<BuildStatus | undefined>();

    readonly onDidChangeTreeData: vscode.Event<BuildStatus | BuildStatus[] | undefined> = this._onDidChangeTreeData.event;

    constructor(protected context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.commands.registerCommand('utocode.showBuilds', (job: JobsModel) => {
                this.jobs = job;
            }),
            vscode.commands.registerCommand('utocode.getJobLog', async (build: BuildStatus) => {
                const job = this.jobs;
                if (!job) {
                    showInfoMessageWithTimeout(vscode.l10n.t("Jenkins is not connected"));
                    return;
                }

                const text = await this.executor?.getJobLog(job.url, build.number);
                if (text) {
                    printEditorWithNew(text, 'shellscript');
                }
            }),
            vscode.commands.registerCommand('utocode.switchBuild', async () => {
                const builds = await this.getBuilds();

                if (builds && builds.length > 0) {
                    await vscode.window.showQuickPick(builds.map<string>(v => v.number.toString()), {
                        placeHolder: vscode.l10n.t("Select to view Job Log")
                    }).then(async (selectedItem) => {
                        if (selectedItem) {
                            const text = await this.executor?.getJobLog(this.jobs!.url, parseInt(selectedItem));
                            if (text) {
                                printEditorWithNew(text, 'shellscript');
                            }
                        }
                    });
                }
            }),
        );

        const jobs: Partial<JobsModel> = {};
        this._jobs = jobs as JobsModel;
    }

    async getTreeItem(element: BuildStatus): Promise<vscode.TreeItem> {
        // console.log(`builds::treeItem <${element}>`);
        let history: BuildDetailStatus | undefined;
        if (element && this._jobs && this._executor) {
            history = await this.executor?.getBuild(this._jobs, element.number);
        }
        let treeItem: vscode.TreeItem = {
            label: `#${element.number} (${formatDurationTime(history!.duration)})`,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'builds',
            iconPath: this.context.asAbsolutePath(`resources/job/${getResultColor(history?.result)}.png`),
            tooltip: history ? this.getToolTip(history) : ''
        };
        return treeItem;
    }

    getToolTip(element: BuildDetailStatus) {
        const actions = element.actions;

        const text = new vscode.MarkdownString();
        const paramAction: JobParameter[] | undefined = getParameterAction(actions);
        text.appendMarkdown(`### Parameters: \n`);
        if (paramAction && paramAction.length > 0) {
            for (let param of paramAction) {
                text.appendMarkdown(`  * ${param.name} (${param.value}) \n`);
            }
        } else {
            text.appendMarkdown(' **None**\n');
        }
        text.appendMarkdown('\n---\n');

        const causeAction: CauseParameter[] | undefined = getCauseAction(actions);
        if (causeAction) {
            text.appendMarkdown(`### Causes: \n`);
            for (let param of causeAction) {
                text.appendMarkdown(`  * ${param.shortDescription}\n`);
            }
        }
        text.appendMarkdown('\n---\n');

        text.appendMarkdown(`**${getLocalDate(element.timestamp)}**`);
        return text;
    }

    async getChildren(element?: BuildStatus): Promise<BuildStatus[]> {
        if (!this._jobs || !this._jobs.name || !this._executor) {
            return [];
        }

        return this.getBuilds();
    }

    async getBuilds() {
        if (!this._jobs || !this._executor) {
            return [];
        }

        const buildModel = await this._executor.getJob(this._jobs);
        let builds = buildModel.builds;
        if (builds && builds.length > JenkinsConfiguration.limitBuilds) {
            builds = builds.slice(0, JenkinsConfiguration.limitBuilds);
        }
        return builds;
    }

    get jobs(): JobsModel | undefined {
        return this._jobs;
    }

    set jobs(jobs: JobsModel | undefined) {
        this._jobs = jobs;
        this.refresh();
    }

    public get executor() {
        if (!this._executor) {
            showInfoMessageWithTimeout(vscode.l10n.t('Server is not connected'));
        }
        return this._executor;
    }

    public set executor(executor: Executor | undefined) {
        this._executor = executor;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

}
