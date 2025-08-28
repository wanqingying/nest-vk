import dumpobj from './pb.json';
import dumpobj2 from './pb2.json';
import dumpobj3 from './pb3.json';
import dumpobj4 from './pb3.json';
import * as protobuf from 'protobufjs';
import path from 'node:path';
// import fs from 'node:fs';

const pb_idl = path.join(__dirname, './feature_v1.proto');

const keys = Object.keys(dumpobj);
console.log(keys);
console.log(dumpobj['feature_dump_pb'].length);
// const feature_dump_base64_str = dumpobj['feature_dump_pb'];

async function parseFeatureDump(feature_dump_base64_str: string) {
  try {
    // 加载proto文件
    const root = await protobuf.load(pb_idl);

    // 获取消息类型（需要根据实际proto文件中的消息名称调整）
    const FeatureDump = root.lookupType('BatchFeatureDump'); // 请根据proto文件中的实际消息名称调整

    // 将base64字符串解码为Buffer
    const buffer = Buffer.from(feature_dump_base64_str, 'base64');

    // 解析protobuf数据
    const message = FeatureDump.decode(buffer);
    const object = FeatureDump.toObject(message, {
      longs: String,
      enums: String,
      bytes: String,
    });
    // fs.writeFileSync(
    //   path.join(__dirname, 'feature_dump_parsed.json'),
    //   JSON.stringify(object, null, 2),
    // );
    console.log('instance len ', object.featureInstance.length);

    // console.log('解析后的特征数据:', JSON.stringify(object, null, 2));
  } catch (error) {
    console.error('解析失败:', error);
  }
}

parseFeatureDump(dumpobj['feature_dump_pb']);
parseFeatureDump(dumpobj2['feature_dump_pb']);
parseFeatureDump(dumpobj3['feature_dump_pb']);
parseFeatureDump(dumpobj4['feature_dump_pb']);
