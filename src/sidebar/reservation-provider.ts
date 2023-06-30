import FormData from 'form-data';
import * as vscode from 'vscode';
import { Executor } from '../api/executor';
import JenkinsConfiguration from '../config/settings';
import { ReservationJobModel, ReservationScheduler } from '../svc/reservation';
import { JobsModel } from '../types/model';
import { showInfoMessageWithTimeout } from '../ui/ui';
import { getLocalDate } from '../utils/datetime';
import { getParameterDefinition } from '../utils/util';

export class ReservationProvider implements vscode.TreeDataProvider<ReservationJobModel> {

    private _executor: Executor | undefined;

    private reservationScheduler: ReservationScheduler;

    private _order: boolean = true;

    private _onDidChangeTreeData: vscode.EventEmitter<ReservationJobModel | undefined> = new vscode.EventEmitter<ReservationJobModel | undefined>();

    readonly onDidChangeTreeData: vscode.Event<ReservationJobModel | ReservationJobModel[] | undefined> = this._onDidChangeTreeData.event;

    constructor(protected context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.commands.registerCommand('utocode.cancelReservation', async (reservationJobModel: ReservationJobModel) => {
                this.cancelReservation(reservationJobModel);
            }),
            vscode.commands.registerCommand('utocode.reservation.refresh', () => {
                this.refresh();
            }),
            vscode.commands.registerCommand('utocode.reservation.sort', () => {
                this.order = !this.order;
                this.refresh();
            }),
        );
        this.reservationScheduler = new ReservationScheduler(this);
    }

    async getTreeItem(element: ReservationJobModel): Promise<vscode.TreeItem> {
        // console.log(`reservation::treeItem <${element}>`);
        let treeItem: vscode.TreeItem = {
            label: `(${getLocalDate(element.runTime)}) ${element.jobModel.name}`,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            contextValue: 'reservation',
            iconPath: new vscode.ThemeIcon('watch'),
            tooltip: this.getToolTip(element)
        };
        return treeItem;
    }

    getToolTip(element: ReservationJobModel): string | vscode.MarkdownString | undefined {
        const text = new vscode.MarkdownString();
        text.appendMarkdown(`### Job:\n`);
        text.appendMarkdown(`* name: ${element.jobModel.fullDisplayName}\n`);
        return text;
    }

    async getChildren(element?: ReservationJobModel): Promise<ReservationJobModel[]> {
        if (!this._executor) {
            return [];
        }

        const models = this.reservationScheduler.reservationModel.slice();
        if (this.order) {
            return models;
        } else {
            return models.sort((a, b) => b.runTime - a.runTime);
        }
    }

    public async addReservation(job: JobsModel) {
        let delayInMinutesStr = await vscode.window.showInputBox({
            prompt: 'Enter number [3 ~ 99]',
            value: '5'
        });
        if (!delayInMinutesStr) {
            return;
        }

        const delayInMinutes = Number.parseInt(delayInMinutesStr);
        const jobParams = getParameterDefinition(job.jobDetail ?? undefined);
        const formData = new FormData();
        let flag: boolean = true;
        if (jobParams && jobParams.length > 0) {
            for (let param of jobParams[0].parameterDefinitions) {
                await vscode.window.showInputBox({
                    prompt: 'Enter "' + param.description ?? '' + '"',
                    value: param.defaultParameterValue.value
                }).then((val) => {
                    if (val) {
                        formData.append(param.name, val);
                    } else {
                        flag = false;
                    }
                });
            }
        }
        if (!flag) {
            showInfoMessageWithTimeout('Cancelled by user');
        }

        this.reservationScheduler.scheduleAction(job, delayInMinutes, formData);
        this.refresh();
    }

    public async cancelReservation(reservationModel: ReservationJobModel) {
        this.reservationScheduler.cancelAction(reservationModel);
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
        this.reservationScheduler.executor = executor;
        this.refresh();
    }


    public get order(): boolean {
        return this._order;
    }

    public set order(order: boolean) {
        this._order = order;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

}
