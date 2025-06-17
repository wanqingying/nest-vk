const zeroEks = require('0x');
const path = require('path');

//   const { collectOnly, visualizeOnly, writeTicks, treeDebug, mapFrames, visualizeCpuProfile, collectDelay } = args
async function capture() {
  const opts = {
    argv: [path.join(__dirname, 'rcs.js'), '--my-flag', '"value for my flag"'],
    // workingDir: __dirname,
    // visualizeOnly: 'false',
    // treeDebug: 'true',
    visualizeCpuProfile: true,
  };

  try {
    const file = await zeroEks(opts);
    console.log(`火焰图已生成: ${file}`);
    console.log(`请使用浏览器打开: file://${path.resolve(file)}`);
  } catch (e) {
    console.error('生成火焰图时出错:', e);
  }
}

capture();
