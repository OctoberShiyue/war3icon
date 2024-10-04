// Script run within the webview itself.
const vscode = acquireVsCodeApi();

let now_page = 1;
let now_value;
let is_update;

function updateScroll() {
	// 获取页面滚动的高度
	var scrollTop = $(window).scrollTop();
	// 获取窗口高度
	var windowHeight = $(window).height();
	// 获取文档的总高度
	var documentHeight = $(document).height();
	// 判断是否滚动到底部
	if (scrollTop + windowHeight >= documentHeight - 20 && Date.now() - timestamp >= 100 && !is_update) {
		timestamp = Date.now();
		now_page = now_page + 1;
		updateData(now_value, now_page);
	}
}

function updateData(value, page = 1) {
	now_value = value;
	now_page = page;
	is_update = true;
	vscode.postMessage({
		type: 'update_html_data',
		text: value,
		page: page
	});
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

function filter(btn,filename) {
	vscode.postMessage({
		type: 'down_file_to_blp',
		text: btn.src,
		filename:filename,
	});
}

document.oncontextmenu = function (event) {
	event.preventDefault();
};
window.addEventListener('message', event => {
	const message = event.data; // 消息数据
	if (message.type === 'updateitems') {
		$("#texture-content").html(message.text);
		now_page = Math.min(now_page, message.last_page);
	}
	if (message.type === 'updateitemsfull') {
		is_update = null;
		console.log("重置");
	}
});
let timestamp = Date.now();
$(window).on('scroll', function () {
	updateScroll();
});

$(window).on('wheel', function(event) {
	if (event.originalEvent.deltaY > 0) {
		updateScroll();
	}
});

$(document).ready(function() {
	$('#importButton').hover(
		function() {
			$('#tooltip').show();
		}, 
		function() {
			$('#tooltip').hide();
		}
	);

	$('#importButton').click(function() {
		vscode.postMessage({
			type: 'impor_png_data',
		});
	});
});