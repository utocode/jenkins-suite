import * as vscode from 'vscode';
import { BuildsProvider } from './sidebar/builds-provider';
import { ConnectionProvider } from './sidebar/connection-provider';
import { JobsProvider } from './sidebar/jobs-provider';
import { NotifyProvider } from './sidebar/notify-provider';
import { ReservationProvider } from './sidebar/reservation-provider';
import { SnippetProvider } from './sidebar/snippet-provider';
import { ViewsProvider } from './sidebar/views-provider';
import { showInfoMessageWithTimeout } from './ui/ui';
import { vscExtension } from './vsc-ns';

export async function activate(context: vscode.ExtensionContext) {
	vscExtension.context = context;

	const buildsProvider = new BuildsProvider(context);
	const reservationProvider = new ReservationProvider(context);
	const jobsProvider = new JobsProvider(context, buildsProvider, reservationProvider);
	const viewsProvider = new ViewsProvider(context, jobsProvider);
	const notifyProvider = new NotifyProvider(context);
	const connectionProvider = new ConnectionProvider(context, viewsProvider, jobsProvider, buildsProvider, reservationProvider, notifyProvider);

	vscode.window.registerTreeDataProvider("utocode.views.views", viewsProvider);
	vscode.window.registerTreeDataProvider("utocode.views.jobs", jobsProvider);
	vscode.window.registerTreeDataProvider("utocode.views.builds", buildsProvider);
	vscode.window.registerTreeDataProvider("utocode.views.notify", notifyProvider);
	vscode.window.registerTreeDataProvider("utocode.views.connection", connectionProvider);

	const snippetProvider = new SnippetProvider(context);

	vscode.window.registerTreeDataProvider("utocode.views.reservation", reservationProvider);
	vscode.window.registerTreeDataProvider("utocode.views.snippets", snippetProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('utocode.helloWorld', async () => {
			showInfoMessageWithTimeout(vscode.l10n.t('Hello, Jenkins Suite'));
			await connectionProvider.executeCommand('checkJobName', 'test11');
		}),
		vscode.commands.registerCommand("utocode.welcome", () => {
			vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `utocode.jenkinssuite#utocode.welcome`, false);
		}),
	);
}

export function deactivate() {
}
