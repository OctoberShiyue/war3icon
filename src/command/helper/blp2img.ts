import * as fs from 'fs';

let binding;
//https://github.com/zhangyuanwei/node-images/blob/b5ae11309de47de4948bbee5060fccaedb19d8e8/index.js#L53
// 简单的做了 win 和 darwin 判断
if (process.platform.startsWith("win")) {
    binding = eval("require")("../../../bind/win32-x64-binding.node");
} else if (process.platform.startsWith("darwin")) {
    // ! 编译的 M1 binding.node 进行 png 转换时崩溃; 先预加载就可以对 png 进行转换了。
    eval("require")("../../../bind/darwin-arm64-binding-prepare.node");
    binding = eval("require")("../../../bind/darwin-arm64-binding.node");
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const { Image, TYPE_PNG, TYPE_JPEG, TYPE_BLP } = binding;

export function blp2Image(blpPath: string, distPath: string, type: 'png' | 'jpg' | 'blp' = 'png') {
    const img = new Image();
    const buf = fs.readFileSync(blpPath);
    img.loadFromBuffer(buf, 0, buf.length);
    if (type === 'png') {
        fs.writeFileSync(distPath, img.toBuffer(TYPE_PNG));
    } else if (type === 'blp') {
        fs.writeFileSync(distPath, img.toBuffer(TYPE_BLP));
    } else {
        fs.writeFileSync(distPath, img.toBuffer(TYPE_JPEG));
    }

}

export function mergeImages(imagePath1: string, imagePath2: string, outputPath: string) {
    const img1 = new Image();
    const buf1 = fs.readFileSync(imagePath1);
    img1.loadFromBuffer(buf1, 0, buf1.length);
    const img2 = new Image();
    const buf2 = fs.readFileSync(imagePath2);
    img2.loadFromBuffer(buf2, 0, buf2.length);
    const img3 = new Image();
    img3.loadFromBuffer(buf1, 0, buf1.length);
    img3.drawImage(img2,0,0);
    fs.writeFileSync(outputPath, img3.toBuffer(TYPE_PNG));
}