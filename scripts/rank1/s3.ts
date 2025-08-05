import {
  S3Client,
  GetObjectCommand,
  ListObjectsV2Request,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { Readable } from 'node:stream';

dotenv.config();

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

export class GameCashRankingConfig {
  // ranking model js file place in s3 folder
  public s3FolderUrl: string;
  public s3Region: string;
  public s3AccessKeyId: string;
  public s3SecretAccessKey: string;
  public s3SessionToken: string;
  public s3SyncFilesSeconds: number;
  public baseDir: string;
}

export class S3BucketSyncFolder {
  private static instance: S3BucketSyncFolder | null = null;
  public static getInstance(config: GameCashRankingConfig): S3BucketSyncFolder {
    if (!S3BucketSyncFolder.instance) {
      S3BucketSyncFolder.instance = new S3BucketSyncFolder(config);
    }
    return S3BucketSyncFolder.instance;
  }

  private readonly config: GameCashRankingConfig;
  private constructor(config: GameCashRankingConfig) {
    this.config = config;
  }
  private s3: S3Client;
  public async init(): Promise<void> {
    this.s3 = new S3Client({
      region: this.config.s3Region,
      credentials: {
        accessKeyId: this.config.s3AccessKeyId,
        secretAccessKey: this.config.s3SecretAccessKey,
        sessionToken: this.config.s3SessionToken,
      },
    });
    await this.downloadFolderFromS3();
    this.startSync();
  }
  private timer: any;
  public startSync() {
    this.timer = setInterval(async () => {
      try {
        await this.downloadFolderFromS3();
      } catch (error) {
        console.error('Error during S3 folder sync:', error);
      }
    }, this.config.s3SyncFilesSeconds * 1000);
  }
  public stopSync() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async getS3File(
    bucketName: string,
    fileName: string,
  ): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
    const response = await this.s3.send(command);
    return response.Body as Readable;
  }

  public async getS3StreamFromUrl(url: string): Promise<Readable> {
    const urlParts = url.replace('s3://', '').split('/');
    const bucketName = urlParts[0];
    const fileName = urlParts.slice(1).join('/');

    const stream = await this.getS3File(String(bucketName), String(fileName));
    if (!stream) {
      throw new Error('file not found');
    }
    return stream;
  }

  public async pipeStreamToFile(
    stream: Readable,
    file: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(file);
      stream.pipe(fileStream);
      fileStream.on('finish', () => resolve(true));
      fileStream.on('error', (error: Error) => reject(error));
    });
  }

  public async downloadFolderFromS3(): Promise<void> {
    const folder = this.config.s3FolderUrl;
    const urlParts = folder.replace('s3://', '').split('/');
    const bucketName = urlParts[0];
    const prefix = urlParts.slice(1).join('/');
    const baseDir = this.config.baseDir;
    try {
      const stat = fs.statSync(path.resolve(baseDir, prefix));
      if (!stat.isDirectory()) throw new Error('not a directory');
    } catch (_) {
      fs.mkdirSync(path.resolve(baseDir, prefix), { recursive: true });
    }
    const existFiles = fs
      .readdirSync(path.resolve(baseDir, prefix))
      .map((f) => path.parse(f).base);
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });
    const response = await s3Client.send(command);
    const contents = response.Contents || [];
    for (const item of contents) {
      if (item.Key) {
        const key = item.Key;
        if (!key.endsWith('.js')) continue;
        const fName = path.parse(key).base;
        if (existFiles.includes(fName)) {
          console.log(`File ${fName} already exists, skipping...`);
          continue;
        }
        const stream = await this.getS3StreamFromUrl(
          `s3://${bucketName}/${key}`,
        );
        await this.pipeStreamToFile(stream, path.resolve(baseDir, key));
      }
    }
  }
}

async function main2() {
  try {
    const s3Sync = S3BucketSyncFolder.getInstance({
      s3FolderUrl: 's3://flip-ml-test/game-cash-ranking/',
      s3Region: 'us-west-2',
      s3AccessKeyId: aws_access_key_id,
      s3SecretAccessKey: aws_secret_access_key,
      s3SessionToken: aws_session_token,
      baseDir: path.resolve(__dirname, './s3bucket'),
      s3SyncFilesSeconds: 60,
    });
    await s3Sync.init();
  } catch (error) {
    console.error('主函数执行失败:', error);
  }
}

// 如果直接运行此文件，则执行 main 函数
if (require.main === module) {
  main2();
}

// module.exports = { getS3FileContent };
