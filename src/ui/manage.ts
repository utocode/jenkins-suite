import * as vscode from 'vscode';
import JenkinsConfiguration, { JenkinsServer } from "../config/settings";
import { ConnectionProvider } from '../sidebar/connection-provider';
import { JobsProvider } from '../sidebar/jobs-provider';
import { JobModelType, JobsModel, ModelQuickPick } from '../types/model';
import { showInfoMessageWithTimeout } from "./ui";

export async function switchConnection(context: vscode.ExtensionContext, connectionProvider: ConnectionProvider) {
    const servers = JenkinsConfiguration.servers;
    if (!servers) {
        showInfoMessageWithTimeout(vscode.l10n.t("Server is not exists"));
        return;
    }

    const items: ModelQuickPick<JenkinsServer>[] = [];
    for (const [name, server] of servers) {
        items.push({
            label: `$(device-desktop) ${name}`,
            detail: server.description,
            model: server
        });
    }

    await vscode.window.showQuickPick(items, {
        placeHolder: vscode.l10n.t("Select to switch server")
    }).then(async (selectedItem) => {
        if (selectedItem) {
            connectionProvider.connect(selectedItem.model!);
        }
    });
}

export async function runJobAll(jobsProvider: JobsProvider, jobAll: boolean = true) {
    const jobs = await jobsProvider.getJobsWithView();
    if (!jobs || jobs.length === 0) {
        showInfoMessageWithTimeout('Jobs is not exists');
        return;
    }

    const items: ModelQuickPick<JobsModel>[] = [];
    if (jobAll) {
        const jobTypes = [JobModelType.freeStyleProject.toString(), JobModelType.workflowJob.toString(), JobModelType.workflowMultiBranchProject.toString()];
        let idx = 0;
        for (const job of jobs) {
            if (!jobTypes.includes(job._class) || !job.jobDetail?.buildable) {
                continue;
            }
            if (idx % 5 === 0) {
                items.push({
                    label: '',
                    kind: vscode.QuickPickItemKind.Separator
                });
            }
            items.push({
                label: job.name,
                description: job.jobDetail?.description ? job.jobDetail?.description : job.jobDetail?.displayName,
                model: job
            });
            idx++;
        }
        items.push({
            label: '',
            kind: vscode.QuickPickItemKind.Separator
        });
    }

    for (const job of jobs) {
        if (job._class !== JobModelType.folder.toString()) {
            continue;
        }

        const folderJobsModel: JobsModel[] | undefined = await jobsProvider.getJobsWithFolder(job);
        if (folderJobsModel) {
            for (let job1 of folderJobsModel) {
                items.push({
                    label: job1.name,
                    description: job1.jobDetail?.description ? job1.jobDetail?.description : job1.name,
                    detail: 'Folder: ' + job.name,
                    model: job1
                });
            }
        }
        items.push({
            label: '',
            kind: vscode.QuickPickItemKind.Separator
        });
    }

    await vscode.window.showQuickPick(items, {
        canPickMany: false
    }).then(async (selectedItem) => {
        if (selectedItem) {
            vscode.commands.executeCommand('utocode.buildJob', selectedItem.model);
        }
    });
}
