const fs = require('fs');
const { execSync } = require('child_process');
const { predict } = require('./lgbm_regression_predictor_v2.js');

/**
 * 测试生成的LightGBM预测函数
 */
async function testPredictor() {
  const sample1 = {
    super_offer_title: 'Solitaire Tile',
    offer_id: 1666347,
    is_ios: 1,
    user_active_days: 3,
    user_gender: 0,
    user_age: 30,
    user_state: 'California',
    is_preference_beauty: 1,
    is_preference_women_fashion: 1,
    is_preference_kitchen: 0,
    is_preference_men_fashion: 0,
    is_preference_gadgets: 0,
    is_preference_home: 0,
    is_preference_personal_care: 0,
    is_preference_kids: 0,
    is_preference_sports: 1,
    is_preference_pets: 0,
    is_preference_household: 0,
    is_preference_grocery: 0,
  };
  // 1. 准备测试数据（应与训练模型的特征格式一致）
  const testSamples = new Array(100).fill(sample1).map((s, i) => {
    return { ...s };
  });

  console.log('正在测试Node.js预测函数...');
  const tStart = performance.now();
  const jsPredictions = testSamples.map((sample) => {
    const features = transformFeatures(sample);
    // console.log('features', features);
    return predict(features);
  });

  console.log(
    `- Node.js预测回归任务结果: ${jsPredictions[0].toFixed(6)} (耗时: ${(performance.now() - tStart).toFixed(2)}ms)`,
  );
}

/**
 * 转换特征格式以匹配模型要求
 */
function transformFeatures(rawSample) {
  return {
    super_offer_id: rawSample.super_offer_title
      ? (crc32(rawSample.super_offer_title) >>> 0) % 1000
      : 0,
    offer_id_mod: rawSample.offer_id
      ? (crc32(String(rawSample.offer_id)) >>> 0) % 1000
      : 0,
    is_ios: rawSample.is_ios,
    user_active_days: rawSample.user_active_days,
    user_gender: rawSample.user_gender,
    user_age: rawSample.user_age,

    user_state_id: rawSample.user_state
      ? (crc32(rawSample.user_state) >>> 0) % 1000
      : 0,

    is_preference_beauty: rawSample.is_preference_beauty,
    is_preference_women_fashion: rawSample.is_preference_women_fashion,
    is_preference_kitchen: rawSample.is_preference_kitchen,
    is_preference_men_fashion: rawSample.is_preference_men_fashion,
    is_preference_gadgets: rawSample.is_preference_gadgets,
    is_preference_home: rawSample.is_preference_home,
    is_preference_personal_care: rawSample.is_preference_personal_care,
    is_preference_kids: rawSample.is_preference_kids,
    is_preference_sports: rawSample.is_preference_sports,
    is_preference_pets: rawSample.is_preference_pets,
    is_preference_household: rawSample.is_preference_household,
    is_preference_grocery: rawSample.is_preference_grocery,
  };
}

/**
 * 计算字符串的CRC32值（模拟Python中的zlib.crc32）
 */
function crc32(input) {
  // 1. 统一输入为字符串（与Python的str(s)一致）
  const str = typeof input === 'string' ? input : String(input);

  // 2. 转为UTF-8编码的Buffer（与Python的s.encode('utf-8')一致）
  const buffer = Buffer.from(str, 'utf-8');

  // 3. 预定义CRC32多项式表（标准CRC32算法，与zlib一致）
  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[i] = c;
    }
    return table;
  })();

  // 4. 计算CRC32（与zlib算法一致）
  let crc = 0xffffffff; // 初始值，与zlib一致
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }

  // 5. 取反并转为带符号32位整数（与Python zlib.crc32结果完全对齐）
  crc = ~crc; // 取反，符合zlib标准
  // 转换为带符号32位整数（模拟Python的int类型）
  return crc | 0; // 关键：通过位运算转为32位带符号整数
}

// 运行测试
testPredictor().catch(console.error);
