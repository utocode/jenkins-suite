import * as vscode from 'vscode';
import JenkinsConfiguration from '../config/settings';
import { CauseParameter, WsTalkMessage } from '../types/model';
import { getLocalDate } from '../utils/datetime';

export class NotifyProvider implements vscode.TreeDataProvider<WsTalkMessage> {

    private _notifies: WsTalkMessage[] = [];

    constructor(protected context: vscode.ExtensionContext) {
    }

    private _onDidChangeTreeData: vscode.EventEmitter<WsTalkMessage | undefined> = new vscode.EventEmitter<WsTalkMessage | undefined>();

    readonly onDidChangeTreeData: vscode.Event<WsTalkMessage | WsTalkMessage[] | undefined> = this._onDidChangeTreeData.event;

    async getTreeItem(element: WsTalkMessage): Promise<vscode.TreeItem> {
        console.log(`notify::treeItem <${element}>`);
        let treeItem; vscode.TreeItem;
        treeItem = {
            label: `[${getLocalDate(element.timestamp)}] ${element.job} #${element.number} (${element.duration})`,
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            // command: {
            //     command: 'utocode.showBuilds',
            //     title: 'Show Builds',
            //     arguments: [element]
            // },
            contextValue: 'notify',
            iconPath: this.context.asAbsolutePath(`resources/job/${element.iconColor.replace('_anime', '')}.png`),
            tooltip: this.getToolTip(element)
        };
        return treeItem;
    }

    getToolTip(element: WsTalkMessage) {
        const results: string[] = [];
        // const paramAction: JobParameter[] | undefined = element.parameterAction?.parameters;
        // if (paramAction) {
        //     results.push('Parameters: ');
        //     paramAction.map(param => results.push(`  ${param.name}: [${param.value}]`));
        // }
        const builds: any | undefined = element.builds;
        results.push('Parameters: ');
        if (builds) {
            const entries = Object.entries(builds);
            for (let [key, val] of entries) {
                results.push(`  ${key}: [${val}]`);
            }
        } else {
            results.push('  - None');
        }
        const causeAction: CauseParameter[] | undefined = element.causeAction.causes;
        if (causeAction) {
            if (results.length > 0) {
                results.push('');
            }
            causeAction.forEach(param => results.push(param.shortDescription));
        }
        results.push(`duration: ${element.duration}`);
        results.push(`date: ${element.timestamp}`);
        return results.join('\n');
    }

    async getChildren(element?: WsTalkMessage): Promise<WsTalkMessage[]> {
        console.log(`notify::children <${element}>`);
        return this._notifies;
    }

    insert(element: WsTalkMessage) {
        if (this._notifies.length >= JenkinsConfiguration.limitHistory) {
            this._notifies.pop();
        }
        this._notifies.unshift(element);
        this.refresh();
    }

    clear() {
        this._notifies = [];
        this.refresh();
    }

    refresh(): void {
        this._onDidChangeTreeData.fire(undefined);
    }

}
