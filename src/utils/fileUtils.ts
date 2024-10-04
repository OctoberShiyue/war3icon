import * as fs from 'fs';
import * as https from 'http';

export function downHttpFile(url: string, fileName: string, callback: Function) {
	const outputPath = fileName;
	const file = fs.createWriteStream(outputPath);
	https.get(url, (response) => {
		response.pipe(file);
		file.on('finish', () => {
			file.close();
			callback(1);
			// vscode.window.showInformationMessage(`文件已下载到 ${outputPath}`);
		});
	}).on('error', (err) => {
		fs.unlink(outputPath, () => { });
		callback(0);
		// vscode.window.showErrorMessage(`下载失败: ${err.message}`);
	});
}