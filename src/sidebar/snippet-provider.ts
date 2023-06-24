import * as vscode from 'vscode';
import JenkinsConfiguration from '../config/settings';
import JenkinsSnippet, { SnippetItem } from '../snippet/snippet';
import { printEditorWithNew } from '../utils/editor';

export class SnippetProvider implements vscode.TreeDataProvider<SnippetItem> {

    private readonly jenkinsSnippet: JenkinsSnippet;

    constructor(protected context: vscode.ExtensionContext) {
        context.subscriptions.push(
            vscode.commands.registerCommand('utocode.generateCode', (snippetItem: SnippetItem) => {
                this.generateCode(snippetItem);
            }),
            vscode.commands.registerCommand('utocode.snippets.refresh', () => {
                this.refresh();
            }),
        );
        this.jenkinsSnippet = JenkinsSnippet.getInstance(context);
    }

    private _onDidChangeTreeData: vscode.EventEmitter<SnippetItem | undefined> = new vscode.EventEmitter<SnippetItem | undefined>();

    readonly onDidChangeTreeData: vscode.Event<SnippetItem | SnippetItem[] | undefined> = this._onDidChangeTreeData.event;

    async getTreeItem(element: SnippetItem): Promise<vscode.TreeItem> {
        console.log(`snippet::treeItem <${element}>`);
        let treeItem; vscode.TreeItem;
        treeItem = {
            label: element.prefix.toUpperCase(),
            collapsibleState: vscode.TreeItemCollapsibleState.None,
            // command: {
            //     command: 'utocode.generateCode',
            //     title: 'Generate Code',
            //     arguments: [element]
            // },
            contextValue: 'snippet',
            iconPath: new vscode.ThemeIcon('symbol-enum'),
            tooltip: element.description
        };
        return treeItem;
    }

    async getChildren(element?: SnippetItem): Promise<SnippetItem[]> {
        console.log(`snippet::children <${element}>`);
        if (!this.jenkinsSnippet) {
            return [];
        }
        const items = await this.jenkinsSnippet.getSnippets();
        return items.filter(item => {
            const when = item.when ? JenkinsConfiguration.getPropertyAsBoolean(item.when) : true;
            const flag = item.hidden ? !item.hidden : true;
            return when && flag;
        });
    }

    generateCode(snippetItem: SnippetItem) {
        let text: string;
        if (snippetItem) {
            text = snippetItem.body.join('\n');
            printEditorWithNew(text);
        }
    }

    // toggleVisibility(): void {
    //     vscode.commands.executeCommand('workbench.view.extension.utocode.views.snippets.collapse');
    // }

    refresh(): void {
        this.jenkinsSnippet.initialized = false;
        this._onDidChangeTreeData.fire(undefined);
    }

}
