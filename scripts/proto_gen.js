const { execSync, exec } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const dotenv = require('dotenv');
const { status } = require('@grpc/grpc-js');
dotenv.config();

const base_path = path.resolve(process.cwd(), 'libs/microrpc/src/protos');
// const PROTO_PATH = path.join(process.cwd(), process.env.PROTO_PATH);
console.log('PROTO_PATH:', base_path);
const OUT_DIR = path.join(base_path, './gen');

const command = `
  npx grpc_tools_node_protoc \
  --js_out=import_style=commonjs,binary:${OUT_DIR} \
  --grpc_out=${OUT_DIR} \
  --plugin=protoc-gen-grpc=$(which grpc_tools_node_protoc_plugin) \
  --ts_out=${OUT_DIR} \
  --plugin=protoc-gen-ts=$(which protoc-gen-ts) \
  -I ${base_path} ${base_path}/*.proto
`;

const gen_js = `pbjs -t static-module -w es6 -o output.js --es6 hero.proto  --no-encode --no-decode --no-delimited`;
const gen_ts = 'pbts -o output.d.ts output.js';

// execSync(command, { stdio: 'inherit', cwd: process.cwd() });
console.log('gRPC generated successfully');

let out_js_files=[];
let out_ts_files=[];

async function generate_file(fileName) {
  const name = fileName.replace('.proto', '');
  const out_name = path.join(OUT_DIR, name);
  const file_name = path.join(base_path, fileName);
  const gen_js = `pbjs -t static-module -w commonjs -o ${out_name}.js ${file_name}  --no-encode --no-decode --no-delimited`;
  const gen_ts = `pbts -o ${out_name}.d.ts ${out_name}.js`;
  execSync(gen_js, { stdio: 'inherit', cwd: process.cwd() });
  execSync(gen_ts, { stdio: 'inherit', cwd: process.cwd() });
  out_js_files.push(`${out_name}.js`);
  out_ts_files.push(`${out_name}.d.ts`);
}

async function generate_protos() {
  // find all .proto files in the PROTO_PATH directory
  const protoFiles = fs
    .readdirSync(base_path)
    .filter((file) => file.endsWith('.proto'));

  for (const file of protoFiles) {
    console.log(`Generating files for ${file}...`);
    await generate_file(file);
  }
  console.log('All proto files generated successfully.');
  console.log('Generated js files:');
  console.log(out_js_files.join('\n'));
  console.log('Generated ts files:');
  console.log(out_ts_files.join('\n'));
}
generate_protos().catch(console.error)
