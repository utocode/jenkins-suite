import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export function getTempFilePath(filename: string): string {
    let workspacePath = '';
    if (vscode.workspace.workspaceFolders?.length) {
        workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        workspacePath = path.normalize(workspacePath);
    }
    const tempDir = fs.mkdtempSync(path.join(workspacePath, 'temp'));
    return path.join(tempDir, filename);
}

export function writeFileSync(content: string, tempFilePath: string) {
    fs.writeFileSync(tempFilePath, content);
}

export function openAfterConfigXml(content: string) {
    const tempFilePath = getTempFilePath('config.xml');
    writeFileSync(content, tempFilePath);
    vscode.workspace.openTextDocument(tempFilePath).then((document) => {
        vscode.window.showTextDocument(document);
    });
}
