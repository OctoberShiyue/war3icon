import * as vscode from 'vscode';
import * as fs from 'fs';
import { Uri } from "vscode";
import * as path from 'path';
import { exec } from 'child_process';
import { getWebviewContent } from '../utils/getWebViewContent';

export async function war3IconPanel(context: vscode.ExtensionContext) {
	// 创建一个Webview视图
	const panel = vscode.window.createWebviewPanel(
		'war3IconPanel', // viewType
		"war3图标", // 视图标题
		vscode.ViewColumn.One, // 显示在编辑器的哪个部位
		{
			enableScripts: true, // 启用JS，默认禁用
			retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
		}
	);

	// 页面内容
	panel.webview.html = await getWebviewContent(panel.webview, context.extensionUri, "war3Icon", html => {
		return html;
	});

	// 监听消息
	panel.webview.onDidReceiveMessage(async (message: { type: string, text: string; }) => {
		
	}, null, context.subscriptions);
	// 销毁处理
	panel.onDidDispose(() => {

	}, null, context.subscriptions);
}