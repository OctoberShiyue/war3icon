// Script run within the webview itself.
const vscode = acquireVsCodeApi();
window.addEventListener("load", function () {
	updateData("");
});

function updateData(value) {
	console.log(value);
	const content = document.getElementById("texture-content");
	content.innerHTML = value;
}

function checkEnter(event) {
	const filter = document.getElementById("filter");
	if (event.keyCode === 13) { // 检查 Enter 键
		let filterWord = filter.value;
		updateData(filterWord);
	}
}

function toggleType(btn) {
	let allBtn = document.querySelectorAll('.texture-type');
	const filter = document.getElementById("filter");
	for (const iterator of allBtn) {
		iterator.className = 'texture-type';
	}
	btn.className = 'texture-type selected';
	filter.value = btn.value;
	updateData(btn.value);
}
document.oncontextmenu = function (event) {
	event.preventDefault();
};