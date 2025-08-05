import { S3Client, GetObjectCommand, ListObjectsV2Request, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { resolve } from 'path';
import fs from 'node:fs';
import { Readable } from 'node:stream';
// [140023372019_qingying.wan_ml]
const aws_access_key_id = process.env.aws_access_key_id;
const aws_secret_access_key = process.env.aws_secret_access_key;
const aws_session_token = process.env.aws_session_token;
console.log('aws_access_key_id:', aws_access_key_id);
console.log('aws_secret_access_key:', aws_secret_access_key);
console.log('aws_session_token:', aws_session_token);
// 创建 S3 客户端
const s3Client = new S3Client({
  region: 'us-west-2', // 替换为您的 AWS 区域
  credentials: {
    accessKeyId: aws_access_key_id,
    secretAccessKey: aws_secret_access_key,
    sessionToken: aws_session_token,
  },
});

// 获取 S3 文件内容的函数
async function getS3FileContent(bucketName: string, fileName: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const response = await s3Client.send(command);
    return response.Body as Readable;
  } catch (error) {
    console.error('获取文件失败:', error);
    throw error;
  }
}

async function getS3FileFromUrl(url: string): Promise<string> {
  const urlParts = url.replace('s3://', '').split('/');
  const bucketName = urlParts[0];
  const fileName = urlParts.slice(1).join('/');

  const stream = await getS3FileContent(String(bucketName), String(fileName));
  if (!stream) {
    throw new Error('文件内容为空');
  }

  // 将流转换为字符串
  return streamToString(stream);
}

async function getS3StreamFromUrl(url: string): Promise<Readable> {
  const urlParts = url.replace('s3://', '').split('/');
  const bucketName = urlParts[0];
  const fileName = urlParts.slice(1).join('/');

  const stream = await getS3FileContent(String(bucketName), String(fileName));
  if (!stream) {
    throw new Error('文件内容为空');
  }

  return stream;
}

const folder = 's3://flip-ml-test/game-cash-ranking/';
async function downloadFolderFromS3(folder: string) {
  // 1. list all files in the folder
  // 2. download each file in local ./folder

  const urlParts = folder.replace('s3://', '').split('/');
  const bucketName = urlParts[0];
  const prefix = urlParts.slice(1).join('/');
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
  });
  const response = await s3Client.send(command);
  const contents = response.Contents || [];
  for (const item of contents) {
    if (item.Key) {
      const key = item.Key;
      if (key.endsWith('.js')) {
        // const fileContent = await getS3FileFromUrl(`s3://${bucketName}/${key}`);
        // const localFilePath = resolve(__dirname, key);
        // // 确保目录存在
        // const fs = require('fs');
        // fs.mkdirSync(resolve(__dirname, prefix), { recursive: true });
        // // 写入文件
        // fs.writeFileSync(localFilePath, fileContent);
        // console.log(`下载成功: ${localFilePath}`);
        const stream = await getS3StreamFromUrl(`s3://${bucketName}/${key}`);
        const stat = fs.statSync(resolve(__dirname, prefix));
        if (!stat.isDirectory()) {
          fs.mkdirSync(resolve(__dirname, prefix), { recursive: true });
        }
        await pipeStreamToLocalFile(stream, resolve(__dirname, key));
      }
    }
  }
}

// 辅助函数：将流转换为字符串
function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', chunk => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
}

function pipeStreamToLocalFile(stream: Readable, file: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(file);
    stream.pipe(fileStream);
    fileStream.on('finish', () => resolve(true));
    fileStream.on('error', (error: Error) => reject(error));
  });
}

const s3Url = 's3://flip-ml-test/lgbm_regression_predictor.js';

// 使用示例
async function main1() {
  try {
    // const bucketName = 'flipfit-staging';
    // const fileName = 'your-file-name.txt';

    // const content = await getS3FileContent(bucketName, fileName);
    // console.log('成功获取文件内容，长度:', content.length);
    const content = await getS3FileFromUrl(s3Url);
    console.log('成功获取文件内容:', content.slice(0, 100)); // 打
  } catch (error) {
    console.error('主函数执行失败:', error);
  }
}

async function main2() {
  try {
    downloadFolderFromS3(folder);
  } catch (error) {
    console.error('主函数执行失败:', error);
  }
}

// 如果直接运行此文件，则执行 main 函数
if (require.main === module) {
  main2();
}

module.exports = { getS3FileContent };
