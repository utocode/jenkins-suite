import * as vscode from 'vscode';
import { BuildsProvider } from './sidebar/builds-provider';
import { ConnectionProvider } from './sidebar/connection-provider';
import { JobsProvider } from './sidebar/jobs-provider';
import { NotifyProvider } from './sidebar/notify-provider';
import { SnippetProvider } from './sidebar/snippet-provider';
import { ViewsProvider } from './sidebar/views-provider';
import { showInfoMessageWithTimeout } from './ui/ui';
import { getMessageL10n, translateMessage } from './utils/vsc';
import { vscExtension } from './vsc-ns';

export async function activate(context: vscode.ExtensionContext) {
	vscExtension.context = context;
	const title = getMessageL10n('Hello');
	console.log(`title <${title}>`);

	const buildsProvider = new BuildsProvider(context);
	const jobsProvider = new JobsProvider(context, buildsProvider);
	const viewsProvider = new ViewsProvider(context, jobsProvider);
	const notifyProvider = new NotifyProvider(context);

	const snippetProvider = new SnippetProvider(context);
	const connectionProvider = new ConnectionProvider(context, viewsProvider, jobsProvider, buildsProvider, notifyProvider);

	vscode.window.registerTreeDataProvider("utocode.views.views", viewsProvider);
	vscode.window.registerTreeDataProvider("utocode.views.jobs", jobsProvider);
	vscode.window.registerTreeDataProvider("utocode.views.builds", buildsProvider);
	vscode.window.registerTreeDataProvider("utocode.views.notify", notifyProvider);
	vscode.window.registerTreeDataProvider("utocode.views.snippets", snippetProvider);
	vscode.window.registerTreeDataProvider("utocode.views.connection", connectionProvider);

	context.subscriptions.push(
		// vscode.window.createTreeView('utocode.views.snippetsView', { treeDataProvider: snippetProvider }),
		// vscode.commands.registerCommand('utocode.views.snippets.toggleTreeView', () => {
		// 	snippetProvider.toggleVisibility();
		// }),
		vscode.commands.registerCommand('utocode.helloWorld', async () => {
			// const hello = translateMessage('Bye');
			// console.log(hello);

			showInfoMessageWithTimeout('Hello, Jenkins Suite!');
			await connectionProvider.executeCommand('checkJobName', 'test11');
		}),
		vscode.commands.registerCommand("utocode.welcome", () => {
			vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `utocode.jenkinssuite#utocode.welcome`, false);
		}),
	);
}

export function deactivate() {
}
