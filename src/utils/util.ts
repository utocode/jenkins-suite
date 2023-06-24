import * as path from 'path';
import * as vscode from 'vscode';
import { SnippetItem } from '../snippet/snippet';
import { BuildsModel, JobProperty } from "../types/model";

export function getParameterDefinition(build: BuildsModel | undefined): JobProperty[] {
    if (build) {
        return build.property.filter(val => val._class === 'hudson.model.ParametersDefinitionProperty');
    } else {
        return [];
    }
}

export async function invokeSnippet(context: vscode.ExtensionContext, snippetName: string): Promise<SnippetItem> {
    const extensionPath = context.extensionPath;
    const snippetFilePath = path.join(extensionPath, 'snippets', 'snippet.json');
    const snippetContent = await vscode.workspace.fs.readFile(vscode.Uri.file(snippetFilePath));
    const snippetText = snippetContent.toString();
    const snippets = JSON.parse(snippetText);

    return new Promise<SnippetItem>((resolve, reject) => {
        resolve(snippets[snippetName]);
    });
}

export function toArray<T>(obj: T | T[]): T[] {
    if (obj instanceof Array) {
        return obj;
    } else {
        return [obj];
    }
}

export function inferFileExtension(content: string): string | null {
    const fileExtensionMapping = {
        'xml': /<\?xml.*\?>/i,
        'json': /^\s*\{.*\}\s*$/,
        'csv': /^.+$/
    };

    for (const [extension, pattern] of Object.entries(fileExtensionMapping)) {
        if (pattern.test(content)) {
            return extension;
        }
    }
    return null;
}

