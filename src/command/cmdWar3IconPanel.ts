import * as vscode from 'vscode';
import * as fs from 'fs';
import { Uri } from "vscode";
import * as path from 'path';
import { exec } from 'child_process';
import axios from 'axios';
import { getWebviewContent } from '../utils/getWebViewContent';
import { blp2Image, mergeImages } from './helper/blp2img';
import { getRootPath } from "../utils/getRootPath";
import { downHttpFile } from "../utils/fileUtils";


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

	let datalist: any[] = [];
	let last_value: string = "";
	async function update_html_data(value: string = "", page: number = 1) {
		if (last_value !== value) {
			datalist = [];
		}
		last_value = value;
		// 页面内容
		panel.webview.html = await getWebviewContent(panel.webview, context.extensionUri, "war3Icon", html => {
			const response = axios.get("http://war3.newxd.cn/api/demo/getImagerList?limit=200&like=" + value + "&page=" + page, {
				headers: {
					'Content-Type': 'application/json',
				}
			});
			response.then(async response => {
				datalist[page - 1] = response.data.data.data;
				let replaceText = "";
				for (let index = 0; index < datalist.length; index++) {
					const element = datalist[index];
					if (element) {
						for (let index = 0; index < element.length; index++) {
							const element2 = element[index];
							let url = "http://war3.newxd.cn" + element2.url;
							let filename = element2.filename;
							replaceText += `\t\t\t\t\t\t<img class="item-texture-icon" id = "items" src=` + url + ` alt='${filename}' onclick="filter(this,'${filename}')">\n`;
						}
					}
				}
				console.log("更新数据", value, page, response.data.data.last_page);

				panel.webview.postMessage({ type: 'updateitems', text: replaceText, last_page: response.data.data.last_page });
			});
			return html;
		});

	}
	update_html_data("");

	// 监听消息
	panel.webview.onDidReceiveMessage(async (message: { type: string, text: string, page: number, filename: string }) => {
		console.log(message);

		const type = message.type;
		const text = message.text;
		const page = message.page;

		switch (type) {
			case "update_html_data":	// 复制技能名
				update_html_data(text, page);
				panel.webview.postMessage({ type: 'updateitemsfull' });
				return;
			case "down_file_to_blp":	// 下载文件，并转成blp
				let rootPath = getRootPath();
				let pngPath = rootPath + "/resource/ReplaceableTextures/CommandButtons/" + message.filename;
				downHttpFile(text, pngPath, function (code: number) {
					if (code === 1) {
						let btn_name = message.filename.substring(0, message.filename.length - 4);
						let btn_png_path = mergeImages(pngPath, __dirname + "/../../images/bm_btn.png", rootPath + "/resource/ReplaceableTextures/CommandButtons/BTN" + btn_name + ".png");
						blp2Image(btn_png_path, btn_png_path.substring(-4) + ".blp", 'blp');
						fs.unlink(btn_png_path, () => { });

						let pasbtn_png_path = mergeImages(pngPath, __dirname + "/../../images/bm_pas.png", rootPath + "/resource/ReplaceableTextures/PassiveButtons/PASBTN" + btn_name + ".png");
						blp2Image(pasbtn_png_path, pasbtn_png_path.substring(-4) + ".blp", 'blp');
						fs.unlink(pasbtn_png_path, () => { });

						let disbtn_png_path = mergeImages(pngPath, __dirname + "/../../images/bm_dis.png", rootPath + "/resource/ReplaceableTextures/CommandButtonsDisabled/DISBTN" + btn_name + ".png");
						blp2Image(disbtn_png_path, disbtn_png_path.substring(-4) + ".blp", 'blp');
						fs.unlink(disbtn_png_path, () => { });

						fs.unlink(pngPath, () => { });
						vscode.window.showInformationMessage(message.filename + `下载完成`);
					}
				});
				// console.log(text,message.filename);
				return;

		}

	}, null, context.subscriptions);
	// 销毁处理
	panel.onDidDispose(() => {

	}, null, context.subscriptions);

	//宿主项目路径
	console.log("宿主项目路径：", getRootPath());

	// blp2Image("C:\\Users\\oob\\Desktop\\65c19b8260cba5d706b5b10d066a759b.png", distPath.fsPath, 'png');
	// blp2Image("C:\\Users\\oob\\Desktop\\65c19b8260cba5d706b5b10d066a759b.png", "C:\\Users\\oob\\Desktop\\65c19b8260cba5d706b5b10d066a759b.blp", 'blp');
}