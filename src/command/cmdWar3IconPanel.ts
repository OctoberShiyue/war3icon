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
import { dirExists } from '../utils/pathUtils';


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

	//获取配置文件
	let config_list = vscode.workspace.getConfiguration("war3icon").get<string>('FramekeyValuePairs');
	let config_res = vscode.workspace.getConfiguration("war3icon").get('rscPath');

	async function toBlp(frameindex: number, pngPath: string, filename: string,is_remove_file:boolean=false) {
		let framelist = [];
		if (config_list) {
			for (const [key, value] of Object.entries(config_list)) {
				let path = value.replaceAll("${插件路径}", __dirname.replaceAll("\\", "/") + "/../..");
				framelist.push(path.split("#"));
			}
		}
		let framedata = framelist[frameindex - 1];
		let rootPath = getRootPath();
		dirExists(rootPath + `/${config_res}/ReplaceableTextures/CommandButtons`);
		dirExists(rootPath + `/${config_res}/ReplaceableTextures/PassiveButtons`);
		dirExists(rootPath + `/${config_res}/ReplaceableTextures/CommandButtonsDisabled`);
		let btn_name = filename.substring(0, filename.length - 4);
		let btn_png_path = mergeImages(pngPath, framedata[0], rootPath + `/${config_res}/ReplaceableTextures/CommandButtons/BTN` + btn_name + ".png");
		blp2Image(btn_png_path, btn_png_path.substring(0,btn_png_path.length-4) + ".blp", 'blp');
		fs.unlink(btn_png_path, () => { });

		let pasbtn_png_path = mergeImages(pngPath, framedata[2], rootPath + `/${config_res}/ReplaceableTextures/PassiveButtons/PASBTN` + btn_name + ".png");
		blp2Image(pasbtn_png_path, pasbtn_png_path.substring(0,pasbtn_png_path.length-4) + ".blp", 'blp');
		fs.unlink(pasbtn_png_path, () => { });

		let disbtn_png_path = mergeImages(pngPath, framedata[1], rootPath + `/${config_res}/ReplaceableTextures/CommandButtonsDisabled/DISBTN` + btn_name + ".png");
		blp2Image(disbtn_png_path, disbtn_png_path.substring(0,disbtn_png_path.length-4) + ".blp", 'blp');
		fs.unlink(disbtn_png_path, () => { });

		if (is_remove_file) {
			fs.unlink(pngPath, () => { });
		}
	}

	let datalist: any[] = [];
	let last_value: string = "";
	async function update_html_data(value: string = "", page: number = 1) {
		if (last_value !== value) {
			datalist = [];
		}
		last_value = value;
		// 页面内容
		panel.webview.html = await getWebviewContent(panel.webview, context.extensionUri, "war3Icon", html => {
			const response = axios.get("http://war3.newxd.cn/api/demo/getImagerList?limit=5&like=" + value + "&page=" + page, {
				headers: {
					'Content-Type': 'application/json',
				}
			});
			response.then(async response => {
				let rootPath = getRootPath();
				datalist[page - 1] = response.data.data.data;
				let replaceText = "";
				for (let index = 0; index < datalist.length; index++) {
					const element = datalist[index];
					if (element) {
						for (let index = 0; index < element.length; index++) {
							const element2 = element[index];
							let url = "http://war3.newxd.cn" + element2.url;
							let filename:string = element2.filename;
							let pngPath = rootPath + `/${config_res}/ReplaceableTextures/CommandButtons/BTN` + filename.substring(0,filename.length-4)+".blp";
							// console.log(pngPath,filename,fs.existsSync(pngPath));
							
							replaceText += `\t\t\t\t\t\t<div class="item-texture-icon"  id = "items" data-src='` + url + `' alt='${filename}' style="background-image: url('` + url + `');" onclick="filter(this,'${filename}')"><div class="image-with-background-checkbox" id='exisfile' style="${fs.existsSync(pngPath)? "" : "display: none;"}" ></div></div>\n`;
						}
					}
				}
				console.log("更新数据", value, page, response.data.data.last_page);

				panel.webview.postMessage({ type: 'updateitems', text: replaceText, last_page: response.data.data.last_page });
			});

			if (config_list) {
				let replaceText = "";
				let replaceTextStyle = "";
				let id = 0;
				for (const [key, value] of Object.entries(config_list)) {
					id++;
					let path = value.replaceAll("${插件路径}", __dirname.replaceAll("\\", "/") + "/../..");
					let pathlist = path.split("#");
					let images64list: string[] = [];
					pathlist.forEach(element => {
						const fileData = fs.readFileSync(element);
						// 转换为Base64
						const base64Data = "data:image/png;base64," + fileData.toString('base64');
						images64list.push(base64Data);
					});
					replaceTextStyle = replaceTextStyle + `
					.image-with-background${id}::after {
						content: "";
						position: absolute;
						top: 0;
						left: 0;
						width: 100%;
						height: 100%;
						z-index: 2; /* 背景层级更高 */
						background-image: url('${images64list[0]}');
						background-size: cover; /* 根据需要调整 */
						pointer-events: none; /* 确保伪元素不会影响用户操作 */
					}
					`;
					replaceText = replaceText + `<option value="${id}">${key}</option>`;
				}
				html = html.replace("__替换__", replaceText);
				html = html.replace("/*__style__*/", replaceTextStyle);
			}
			return html;
		});

	}
	update_html_data("");

	// 监听消息
	panel.webview.onDidReceiveMessage(async (message: { type: string, text: string, page: number, filename: string, frameindex: number }) => {
		console.log(message);

		const type = message.type;
		const text = message.text;
		const page = message.page;
		const frameindex = message.frameindex;

		switch (type) {
			case "update_html_data":	// 复制技能名
				update_html_data(text, page);
				panel.webview.postMessage({ type: 'updateitemsfull' });
				return;
			case "down_file_to_blp":	// 下载文件，并转成blp
				let rootPath = getRootPath();
				let pngPath = rootPath + `/${config_res}/ReplaceableTextures/CommandButtons/` + message.filename;
				downHttpFile(text, pngPath, function (code: number) {
					if (code === 1) {
						toBlp(frameindex, pngPath, message.filename,true);
						vscode.window.showInformationMessage(message.filename + `导入成功`);
					}
				});
				// console.log(text,message.filename);
				return;
			case "impor_png_data":
				const options = {
					canSelectMany: true, // 允许多选
					openLabel: 'Select',
					filters: {
						'Text files': ['png'],
						'All files': ['*']
					}
				};
				vscode.window.showOpenDialog(options).then(fileUris => {
					if (fileUris && fileUris.length > 0) {
						fileUris.forEach(uri => {
							const fileName = path.basename(uri.fsPath);
							console.log('Selected file:', uri.fsPath, fileName);
							let pngPath = uri.fsPath;
							toBlp(frameindex, pngPath, fileName);
						});
						vscode.window.showInformationMessage(`批量导入成功`);
					} else {
						console.log('No files selected');
					}
				});
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

//剩下：
/**
 * 按下按钮，打开文件对话框，可以选定自定义的png，进行blp转换
 * btn,pas,dis框框自定义替换，可以多方案呢配置
 */