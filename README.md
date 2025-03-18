## todo
1. .env config
2. start consul server: docker-compose up
3. npm install
4. npm run build:s
5. npm run build:c
6. npm run start:s1
7. npm run start:s2
8. npm run start:c

pb
pbjs -t static-module -w commonjs -o hero.js hero.proto
pbts -o hero.d.ts hero.js

### protobuf
// generate pb file
npm install -g protobufjs protobufjs-cli
// generate grpc pb file
npm install -g grpc-tools
grpc_tools_node_protoc --js_out=import_style=commonjs,binary:./gen/ --grpc_out=grpc_js:./gen/ ./hero.proto

npm install -g ts-protoc-gen
grpc_tools_node_protoc \
  --plugin=protoc-gen-ts=$(which protoc-gen-ts) \
  --js_out=import_style=commonjs,binary:./gen/ \
  --ts_out=grpc_js:./gen/ \
  hero.proto

npm install -g grpc_tools_node_protoc_ts
grpc_tools_node_protoc \
  --plugin=protoc-gen-ts=$(which protoc-gen-ts) \
  --plugin=protoc-gen-grpc=$(which grpc_tools_node_protoc_ts) \
  --js_out=import_style=commonjs,binary:./gen/ \
  --ts_out=grpc_js:./gen/ \
  --grpc_out=grpc_js:./gen/ \
hero.proto