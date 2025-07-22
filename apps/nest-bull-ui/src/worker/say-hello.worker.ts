import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Q_NNAME_1 } from '@libs/shared/src/bull.const';

@Processor(Q_NNAME_1)
export class SayHelloWorker extends WorkerHost {
  private readonly logger = new Logger(SayHelloWorker.name);

  private async timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}`);

    console.log(`Job data:`, job.data);
    console.log(`Job opts:`, job.opts);
    // await this.timeout(30);
    // // update progress to 50
    // job.updateProgress(50);
    // await this.timeout(1000);

    for (let i = 0; i < 10; i++) {
      await this.timeout(1000);
      job.updateProgress((i + 1) * 10);
      this.logger.log(`Job ${job.id} progress: ${(i + 1) * 10}%`);
    }

    return Promise.resolve(1);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${err.message}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job, progress: number) {
    this.logger.log(`Job ${job.id} progress: ${progress}%`);
  }
}
