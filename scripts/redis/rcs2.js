const inspector = require('inspector');

// 开启inspector并监听特定端口，允许Chrome DevTools连接
inspector.open(9229, '0.0.0.0', false);

// const ses = new inspector.Session();
// ses.connect();
// // 启动CPU采样
// ses.post('Profiler.enable', () => {
//   ses.post('Profiler.start', () => {
// 	console.log('CPU采样已启动');
//   });
// });

// 创建一些CPU密集型操作
function fibonacci(n) {
  return n < 2 ? n : fibonacci(n - 1) + fibonacci(n - 2);
}

function fibonacci2(n) {
  if (n < 2) return n;

  let a = 0,
	b = 1;
  for (let i = 2; i <= n; i++) {
	const temp = a + b;
	a = b;
	b = temp;
  }
  return b;
}

function sortv2(arr) {
  // Fisher-Yates 洗牌算法，更高效的随机化
  for (let i = arr.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function arrsort(len) {
  //   return arr.sort(() => Math.random() - 0.5);
  const arr = Array(len)
	.fill(0)
	.map((_, i) => i);

  sortv2(arr);

  return arr;
}

console.log('开始CPU密集型测试...');

// 主循环
setInterval(() => {
  const start = Date.now();
  // 计算斐波那契数
  fibonacci(36);
  console.log('斐波那契数计算完成');

  // 一些其他操作
  arrsort(2000000);
  console.log('CPU密集型测试完成 ', Date.now() - start, 'ms');
}, 1000);

// setTimeout(() => {
//   console.log('exit');
//   ses.post('Profiler.stop', (err, res) => {
// 	if (err) {
// 	  console.error('停止CPU采样时出错:', err);
// 	  return;
// 	}
// 	// 将采样结果保存到文件
// 	const profile = res.profile;
// 	const fileName = `cpu-profile-${Date.now()}.cpuprofile`;
// 	require('fs').writeFileSync(fileName, JSON.stringify(profile));
// 	console.log(`CPU采样已保存到 ${fileName}`);
// 	ses.disconnect();
// 	process.exit(0);
//   });
// }, 3500);

// 让程序保持运行
console.log('程序运行中...');
