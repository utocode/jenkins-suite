import { initial } from 'lodash';
import * as path from 'path';
import * as vscode from 'vscode';
import logger from '../utils/logger';

export default class JenkinsSnippet {

    private _snippets: SnippetItems | undefined;

    private snippetFilePath: string;

    private static _instance: JenkinsSnippet;

    private _initialized: boolean = false;

    private constructor(protected context: vscode.ExtensionContext) {
        const extensionPath = this.context.extensionPath;
        this.snippetFilePath = path.join(extensionPath, 'snippets', 'snippet.json');
        this.initialize();
    }

    async initialize() {
        this._snippets = await this.loadSnippet();
        this._initialized = true;
    }

    async loadSnippet() {
        const file = vscode.Uri.file(this.snippetFilePath);
        const snippetContent = (await vscode.workspace.fs.readFile(file)).toString();
        logger.debug(`snippets <${this._snippets}>`);
        return JSON.parse(snippetContent) as SnippetItems;
    }

    static getInstance(context: vscode.ExtensionContext) {
        if (!JenkinsSnippet._instance) {
            JenkinsSnippet._instance = new JenkinsSnippet(context);
        }
        return JenkinsSnippet._instance;
    }

    get(snippetName: string): SnippetItem | undefined {
        return this._snippets ? this._snippets[snippetName] : undefined;
    }

    get snippets() {
        return this._snippets;
    }

    async getSnippets(): Promise<SnippetItem[]> {
        if (!this._initialized) {
            await this.initialize();
        }
        if (!this._snippets) {
            return [];
        }
        return Object.values(this._snippets);
    }

    public set initialized(value: boolean) {
        this._initialized = value;
    }

}

type SnippetItems = {
    [key: string]: SnippetItem
};

export interface SnippetItem {
    prefix: string
    body: string[]
    description: string
    hidden?: boolean
    when?: string
}
