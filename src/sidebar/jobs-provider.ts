import * as vscode from 'vscode';
import { Executor } from '../api/executor';
import JenkinsConfiguration from '../config/settings';
import { BaseJobModel, BuildStatus, BuildsModel, JobModelType, JobParamDefinition, JobsModel, ModelQuickPick, ViewsModel, WsTalkMessage } from '../types/model';
import { getJobParamDefinitions } from '../types/model-util';
import { runJobAll } from '../ui/manage';
import { openLinkBrowser, showInfoMessageWithTimeout } from '../ui/ui';
import { getSelectionText, printEditorWithNew } from '../utils/editor';
import logger from '../utils/logger';
import { getParameterDefinition, inferFileExtension, invokeSnippet } from '../utils/util';
import { notifyMessageWithTimeout, showErrorMessage } from '../utils/vsc';
import { FlowDefinition, parseXml } from '../utils/xml';
import { BuildsProvider } from './builds-provider';
import { ReservationProvider } from './reservation-provider';

export class JobsProvider implements vscode.TreeDataProvider<JobsModel> {

    private _view!: ViewsModel;

    private _executor: Executor | undefined;

    private _onDidChangeTreeData: vscode.EventEmitter<JobsModel | undefined> = new vscode.EventEmitter<JobsModel | undefined>();

    readonly onDidChangeTreeData: vscode.Event<JobsModel | JobsModel[] | undefined> = this._onDidChangeTreeData.event;

    constructor(protected context: vscode.ExtensionContext, private readonly buildsProvider: BuildsProvider, private readonly reservationProvider: ReservationProvider) {
        this.registerContext();
    }

    registerContext() {
        this.context.subscriptions.push(
            vscode.commands.registerCommand('utocode.jobs.refresh', () => {
                this.refresh();
            }),
            vscode.commands.registerCommand('utocode.openLinkJob', (job: JobsModel) => {
                openLinkBrowser(job.url);
            }),
            vscode.commands.registerCommand('utocode.withJob', async () => {
                if (!this.executor?.initialized()) {
                    return;
                }

                const items: vscode.QuickPickItem[] = [
                    { label: 'Update', description: 'Update the existing Job' },
                    { label: 'Create', description: 'Create a job with a new name' },
                ];
                await vscode.window.showQuickPick(items, {
                    placeHolder: vscode.l10n.t("Select the command you want to execute")
                }).then(async (selectedItem) => {
                    if (!selectedItem) {
                        return;
                    }
                    if (selectedItem.label === 'Create') {
                        vscode.commands.executeCommand('utocode.createJob');
                    } else if (selectedItem.label === 'Update') {
                        vscode.commands.executeCommand('utocode.updateConfigJob');
                    }

                    setTimeout(() => {
                        vscode.commands.executeCommand('utocode.jobs.refresh');
                    }, 2200);
                });
            }),
            vscode.commands.registerCommand('utocode.updateConfigJob', async () => {
                const text = getSelectionText();
                // console.log(`text <${text}>`);
                if (!text) {
                    showInfoMessageWithTimeout(vscode.l10n.t('Job Data is not exist'));
                    return;
                }

                let jobs = this.buildsProvider.jobs;
                if (!jobs?.name) {
                    const allJobs = await this.getJobsWithView();
                    const items: ModelQuickPick<JobsModel>[] = [];
                    allJobs.forEach(job => {
                        items.push({
                            label: job.name,
                            description: job.description,
                            detail: job.fullName,
                            model: job
                        });
                    });

                    await vscode.window.showQuickPick(items, {
                        placeHolder: vscode.l10n.t("Select the command you want to execute")
                    }).then(async (selectedItem) => {
                        if (selectedItem) {
                            this.buildsProvider.jobs = selectedItem.model!;
                        }
                    });
                }

                if (!jobs?.name) {
                    vscode.window.showErrorMessage('Select running job');
                    return;
                }
                const mesg = await this.executor?.updateJobConfig(jobs.name, text);
                console.log(`result <${mesg}>`);
            }),
            vscode.commands.registerCommand('utocode.generateJobCode', async () => {
                if (!this.executor?.initialized()) {
                    return;
                }

                const items: vscode.QuickPickItem[] = [
                    { label: 'Pipeline', description: 'Generate Pipeline Job' },
                    { label: 'FreeStyle', description: 'Generate FreeStyle Job' },
                ];
                await vscode.window.showQuickPick(items, {
                    placeHolder: vscode.l10n.t("Select to generate Job Code")
                }).then(async (selectedItem) => {
                    if (!selectedItem) {
                        return;
                    }

                    const snippetItem = await invokeSnippet(this.context, `c_job_${selectedItem.label}`.toUpperCase());
                    printEditorWithNew(snippetItem.body.join('\n'));

                    setTimeout(() => {
                        showInfoMessageWithTimeout(vscode.l10n.t('If you want to modify the xml data and apply it to the server, run "Create Job"or "Update Config Job" (Shift + Alt + Enter)'), 12000);
                    }, 1000);
                });
            }),
            vscode.commands.registerCommand('utocode.createJob', async () => {
                this.createJob();
            }),
            vscode.commands.registerCommand('utocode.createFolder', async () => {
                const mesg = await this.executor?.createFolder(this.view.name);
                console.log(`result <${mesg}>`);
                setTimeout(() => {
                    vscode.commands.executeCommand('utocode.jobs.refresh');
                }, 1500);
            }),
            vscode.commands.registerCommand('utocode.switchJob', async (job: JobsModel) => {
                const allJobs = await this.getJobsWithView();
                const items: ModelQuickPick<JobsModel>[] = [];
                allJobs.filter(job => job._class !== JobModelType.folder.toString()).forEach(job => {
                    items.push({
                        label: (job._class === JobModelType.freeStyleProject ? "$(terminal) " : "$(tasklist) ") + job.name,
                        description: job.jobDetail?.description,
                        model: job
                    });
                });

                await vscode.window.showQuickPick(items, {
                    placeHolder: vscode.l10n.t("Select to switch only job")
                }).then(async (selectedItem) => {
                    if (selectedItem) {
                        this.buildsProvider.jobs = selectedItem.model!;
                    }
                });
            }),
            vscode.commands.registerCommand('utocode.getConfigJob', async (job: JobsModel) => {
                const text = await this.executor?.getConfigJob(job);
                console.log(`text <${text}>`);
                printEditorWithNew(text);
            }),
            vscode.commands.registerCommand('utocode.addReservation', async (job: JobsModel) => {
                this.reservationProvider.addReservation(job);
            }),
            vscode.commands.registerCommand('utocode.runAddReservation', async () => {
                const allJobs = await this.getJobsWithView();
                const items: ModelQuickPick<JobsModel>[] = [];
                allJobs.filter(job => job._class !== JobModelType.folder.toString()).forEach(job => {
                    items.push({
                        label: (job._class === JobModelType.freeStyleProject ? "$(terminal) " : "$(tasklist) ") + job.name,
                        description: job.jobDetail?.description,
                        model: job
                    });
                });

                await vscode.window.showQuickPick(items, {
                    placeHolder: vscode.l10n.t("Select to switch only job")
                }).then(async (selectedItem) => {
                    if (selectedItem) {
                        this.reservationProvider.addReservation(selectedItem.model!);
                    }
                });
            }),
            vscode.commands.registerCommand('utocode.buildJob', async (job: JobsModel) => {
                const mesg = await this.executor?.buildJobWithParameter(job, JenkinsConfiguration.buildDelay);
                console.log(`buildJob <${mesg}>`);
                setTimeout(() => {
                    notifyMessageWithTimeout(mesg);
                    this.buildsProvider.jobs = job;
                }, 3300);
            }),
            vscode.commands.registerCommand('utocode.deleteJob', async (job: JobsModel) => {
                let mesg = await this.executor?.deleteJob(job);
                // console.log(`deleteJob <${mesg}>`);
                if (mesg && !mesg.startsWith("Request failed")) {
                    mesg = `Success to delete job <${job.name}>`;
                }
                setTimeout(() => {
                    notifyMessageWithTimeout(mesg);
                    this.buildsProvider.jobs = undefined;
                    this.refresh();
                }, 3300);
            }),
            vscode.commands.registerCommand('utocode.enabledJob', async (job: JobsModel) => {
                const mesg = await this.executor?.enabledJob(job);
                this.refresh();
            }),
            vscode.commands.registerCommand('utocode.disabledJob', async (job: JobsModel) => {
                const mesg = await this.executor?.enabledJob(job, false);
                this.refresh();
            }),
            vscode.commands.registerCommand('utocode.runJob', async () => {
                runJobAll(this);
            }),
            vscode.commands.registerCommand('utocode.runFolderJob', async () => {
                runJobAll(this, false);
            }),
            vscode.commands.registerCommand('utocode.withJobLog', async (build: BuildStatus) => {
                openLinkBrowser(build.url + 'console');
            }),
            vscode.commands.registerCommand('utocode.getJobHistory', async (message: WsTalkMessage) => {
                const text = await this.executor?.getJobLog(message.url, message.number);
                console.log(`text <${text}>`);
                printEditorWithNew(text);
            }),
            vscode.commands.registerCommand('utocode.withJobHistory', async (message: WsTalkMessage) => {
                openLinkBrowser(`${message.url}${message.number}/console`);
            }),
            vscode.commands.registerCommand('utocode.updateConfigView', async () => {
                const view = this.view;
                if (!view.name) {
                    vscode.window.showErrorMessage('Choices view');
                    return;
                }
                const text = getSelectionText();
                console.log(`text <${text}>`);
                if (text) {
                    const mesg = await this.executor?.updateConfigView(view.name, text);
                    console.log(`result <${mesg}>`);
                }
            }),
            vscode.commands.registerCommand('utocode.validateJenkins', async () => {
                let content = getSelectionText();

                if (inferFileExtension(content) === 'xml') {
                    const xmlData: FlowDefinition = parseXml(content);
                    const script = xmlData["flow-definition"].definition.script._text;
                    // console.log(script);
                    content = script;
                }

                const text = await this.executor?.validateJenkinsfile(content);
                console.log(`text <${text}>`);
                if (!text) {
                    return;
                }
                if (text.startsWith('Jenkinsfile successfully validated')) {
                    showInfoMessageWithTimeout(vscode.l10n.t(text));
                } else {
                    logger.error(`validate <${text}>`);
                    showErrorMessage(text);
                }
            }),
        );
    }

    async createJob() {
        const viewName = this.view?.name ?? 'all';
        console.log(`viewName <${viewName}>`);
        const text = getSelectionText();
        if (text) {
            const mesg = await this.executor?.createJob(text, viewName);
            console.log(`result <${mesg}>`);

            setTimeout(() => {
                this.refresh();
            }, 2500);
        } else {
            showInfoMessageWithTimeout(vscode.l10n.t('There is no xml data to create a job'));
        }
    }

    async getTreeItem(element: JobsModel): Promise<vscode.TreeItem> {
        console.log(`jobs::treeItem <${element?.fullName ?? element?.name}>`);
        let jobDetail: BuildsModel | undefined = element.jobDetail;
        let treeItem: vscode.TreeItem;
        if (element && element.jobParam && element.level === 100) {
            const jobParam = element.jobParam;
            treeItem = {
                label: `${jobParam.name} [${jobParam.defaultParameterValue.value}]`,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                iconPath: new vscode.ThemeIcon('file-code'),
                tooltip: this.getToolTip(element)
            };
        } else {
            if (element._class === JobModelType.freeStyleProject || element._class === JobModelType.workflowJob) {
                let icon = 'grey';
                if (jobDetail?.buildable) {
                    icon = element._class === JobModelType.workflowJob ? 'green' : 'blue';
                }
                treeItem = {
                    label: `${element.name}`,
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                    command: {
                        command: 'utocode.showBuilds',
                        title: 'Show Builds',
                        arguments: [element]
                    },
                    contextValue: jobDetail?.buildable ? 'jobs' : 'jobs_disabled',
                    // iconPath: new vscode.ThemeIcon('output-view-icon'),
                    iconPath: this.context.asAbsolutePath(`resources/job/${icon}.png`),
                    tooltip: this.makeToolTipJob(element)
                };
            } else if (element._class === JobModelType.folder) {
                treeItem = {
                    label: `<${element.jobDetail?.jobs.length}> ${element.name}`,
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                    // command: {
                    //     command: 'utocode.showBuilds',
                    //     title: 'Show Builds',
                    //     arguments: [element]
                    // },
                    contextValue: 'jobs_folder',
                    iconPath: new vscode.ThemeIcon('folder'),
                    tooltip: this.makeToolTipFolder(element)
                };
            } else if (element._class === JobModelType.workflowMultiBranchProject) {
                treeItem = {
                    label: element.name,
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                    command: {
                        command: 'utocode.showBuilds',
                        title: 'Show Builds',
                        arguments: [element]
                    },
                    contextValue: 'jobs',
                    iconPath: new vscode.ThemeIcon('symbol-enum'),
                    tooltip: element.jobDetail?.description ?? element.name
                };
            } else {
                treeItem = {
                    label: element.name,
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                    contextValue: 'jobs',
                    // iconPath: new vscode.ThemeIcon('output-view-icon'),
                    iconPath: this.context.asAbsolutePath(`resources/job/${element.color}.png`),
                    tooltip: element.jobDetail?.description ?? element.name
                };
            }
        }
        return treeItem;
    }

    async getChildren(element?: JobsModel): Promise<JobsModel[]> {
        console.log(`jobs::children <${element?.fullName ?? element?.name}>`);
        if (!this._view || !this._executor) {
            return [];
        }

        if (element) {
            // if (element._class === JobModelType.folder) {
            //     const jobs = await this.getJobsWithFolder(element);
            //     return jobs;
            // } else {
            //     return this.getJobs(element);
            // }
            return this.getJobs(element);
        } else {
            const jobs = await this.getJobsWithView();
            return jobs;
        }
    }

    async getJobs(element: JobsModel): Promise<JobsModel[]> {
        let jobsModel: JobsModel[] = [];
        if (!this._executor) {
            return jobsModel;
        }

        let jobDetail: BuildsModel | undefined = await this.executor?.getJob(element);
        if (jobDetail && element._class === JobModelType.folder) {
            jobsModel = await this.getJobsWithFolder(jobDetail);
            if (jobsModel) {
                jobsModel.forEach(jobs => {
                    if (!jobs.parents) {
                        jobs.parents = [];
                    }
                    jobs.parents.push(element);
                });
            }
        } else if (jobDetail) {
            const paramDefinition = getParameterDefinition(jobDetail);
            if (paramDefinition.length > 0) {
                const definitions: JobParamDefinition[] = paramDefinition[0].parameterDefinitions;
                for (let definition of definitions) {
                    const prop: JobsModel = {
                        level: 100,
                        jobParam: definition,
                        url: jobDetail.url,
                        color: jobDetail.color,
                        buildable: false,
                        fullName: jobDetail.name,
                        fullDisplayName: jobDetail.fullDisplayName,
                        healthReport: jobDetail.healthReport,
                        ...definition
                    };
                    jobsModel.push(prop);
                }
            }
        }
        return jobsModel;
    }

    makeToolTipFolder(jobModel: JobsModel) {
        const jobDetail: BuildsModel = jobModel.jobDetail!;
        const text = new vscode.MarkdownString();
        text.appendMarkdown('### Summary: \n');
        text.appendMarkdown(`${jobDetail.displayName ?? jobDetail.fullDisplayName}\n`);
        text.appendMarkdown('\n---\n');

        text.appendMarkdown(`### Jobs: \n`);
        if (jobDetail.jobs && jobDetail.jobs.length > 0) {
            for (let folderJob of jobDetail.jobs) {
                text.appendMarkdown(`* ${folderJob.name}: ${folderJob.color}\n`);
            }
        } else {
            text.appendMarkdown(' * **None**\n');
        }
        text.appendMarkdown('\n---\n');

        text.appendMarkdown(`*${jobModel.url}*\n`);
        return text;
    }

    makeToolTipJob(jobModel: JobsModel) {
        const jobDetail: BuildsModel = jobModel.jobDetail!;
        const paramAction: JobParamDefinition[] | undefined = getJobParamDefinitions(jobDetail.property);
        const text = new vscode.MarkdownString();
        text.appendMarkdown(`### Job: \n`);
        text.appendMarkdown(`* name: ${jobModel.name}\n`);
        text.appendMarkdown(`* buildable: ${jobModel.jobDetail?.buildable}\n`);
        text.appendMarkdown('\n---\n');

        text.appendMarkdown(`### Parameters: \n`);
        if (paramAction && paramAction.length > 0) {
            for (let param of paramAction) {
                text.appendMarkdown(`* ${param.name} (${param.defaultParameterValue.value}) \n`);
            }
        } else {
            text.appendMarkdown(' * **None**\n');
        }

        text.appendMarkdown('\n---\n');
        text.appendMarkdown('### Summary: \n');
        text.appendMarkdown(`${jobDetail.description ? jobDetail.description : jobDetail.fullDisplayName}\n`);
        text.appendMarkdown('\n---\n');

        text.appendMarkdown(`${jobModel.url}\n`);
        return text;
    }

    getToolTip(jobModel: JobsModel) {
        const jobParam = jobModel.jobParam!;
        const text = new vscode.MarkdownString();
        text.appendMarkdown(`### Job: \n`);
        text.appendMarkdown(`* name: ${jobModel.fullDisplayName ?? jobModel.fullName}\n`);
        text.appendMarkdown('\n---\n');

        text.appendMarkdown(`### Parameter: \n`);
        text.appendMarkdown(`* Type: _${jobParam.type.substring(0, jobParam.type.length - 'ParameterValue'.length)}_\n`);
        text.appendMarkdown(`* Default Value: *${jobParam.defaultParameterValue.value}*\n`);
        return text;
    }

    public async getJobsWithFolder(folder: BaseJobModel): Promise<JobsModel[]> {
        if (!this._executor) {
            return [];
        }

        // const foldername = folder.fullName ?? folder.name;
        const allViewModel = await this.executor?.getJobAsView(folder);
        if (allViewModel) {
            for (let job of allViewModel.jobs) {
                // let jobDetail = await this._jenkins.getJob(job.name);
                job.jobDetail = await this.executor?.getJob(job);
            }
        }
        return allViewModel ? allViewModel.jobs : [];
    }

    public async getJobsWithView(): Promise<JobsModel[]> {
        if (!this._executor) {
            return [];
        }

        const allViewModel = await this.executor?.getViewsWithDetail(this._view ? this.view.name : 'all', true);
        return allViewModel ? allViewModel.jobs : [];
    }

    get view() {
        return this._view;
    }

    set view(view: ViewsModel) {
        this._view = view;
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

    clear() {
        this._executor = undefined;
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

}
