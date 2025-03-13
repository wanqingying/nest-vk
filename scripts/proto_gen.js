const { execSync } = require('node:child_process');
const path = require('path');

// const PROTO_PATH = path.resolve(process.cwd(), 'libs/microrpc/src/protos'); 
const PROTO_PATH = 'D:\Users\wanqingying\IdeaProjects\chrome-extension-ai-nest\libs\microrpc\src\protos'
const OUT_DIR = 'D:\Users\wanqingying\IdeaProjects\chrome-extension-ai-nest\libs\microrpc\src\protos\types';
console.log('PROTO_PATH:', PROTO_PATH);
const command = `
  npx grpc_tools_node_protoc \
  --js_out=import_style=commonjs,binary:${OUT_DIR} \
  --grpc_out=${OUT_DIR} \
  --plugin=protoc-gen-grpc=$(which grpc_tools_node_protoc_plugin) \
  --ts_out=${OUT_DIR} \
  --plugin=protoc-gen-ts=$(which protoc-gen-ts) \
  -I ${PROTO_PATH} ${PROTO_PATH}/*.proto
`;

execSync(command, { stdio: 'inherit', cwd: process.cwd() });
console.log('gRPC 类型文件生成完毕');