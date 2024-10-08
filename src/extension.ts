// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { info, log } from 'console';
import * as vscode from 'vscode';
import { war3IconPanel } from './command/cmdWar3IconPanel';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "war3icon" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('war3icon.items', () => war3IconPanel(context)));
}

// This method is called when your extension is deactivated
export function deactivate() {}
