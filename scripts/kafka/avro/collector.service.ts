import { MemoryCache, MemoryCacheManager } from '@flip/cache';
import { IContext } from '@flip/intelligence';
import { JournalClient } from '@flip/journal';
import { PersonalizationLoggerService } from '@flip/personalization-logger';
import { StatDynamicConfig, DynamicConfigNames } from '@flip/statsig';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import { Global, Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import * as util from 'node:util';
import seedrandom from 'seedrandom';

import { AsyncBatchQueue } from './batch.queue';
import {
  SampleCache,
  SampleConfig,
  SamplePostInfo,
  TOPIC_SAMPLE_EVENT,
  ViewerSampleEvent,
  UpdatePostInfo,
} from './collector.const';
import sampleSchema from './sample.avro.json';

@Global()
@Injectable()
export class CollectorService implements OnModuleDestroy {
  public queue: AsyncBatchQueue<ViewerSampleEvent>;
  public instanceId = Math.random().toString(36).substring(2, 15);
  public registry: SchemaRegistry;

  // Performance optimizations for key conversion
  private readonly camelCaseRegex = /([a-z])([A-Z])/g;
  private readonly dashDotRegex = /[-.]/g;

  // Small cache for uncommon keys (limited size to prevent memory issues)
  private readonly keyCache = new Map<string, string>();
  private readonly maxKeyCacheSize = 1000;

  // Pre-computed common conversions for ViewerSampleEvent keys
  private readonly commonKeys = new Map([
    ['userId', 'user_id'],
    ['postId', 'post_id'],
    ['feedId', 'feed_id'],
    ['traceId', 'trace_id'],
    ['retrieverName', 'retriever_name'],
    ['postInfo', 'post_info'],
    ['userInfo', 'user_info'],
    ['retrieverInfo', 'retriever_info'],
    ['rnInRetriever', 'rn_in_retriever'],
    ['rnInRanking', 'rn_in_ranking'],
    ['rnInReRanking', 'rn_in_re_ranking'],
    ['rnInMerge', 'rn_in_merge'],
    ['rnInFinal', 'rn_in_final'],
    ['isPassFilter', 'is_pass_filter'],
    ['isPassMerge', 'is_pass_merge'],
    ['isPassRank', 'is_pass_rank'],
    ['isPassReRank', 'is_pass_re_rank'],
    ['isFinal', 'is_final'],
    ['rankingScore', 'ranking_score'],
  ]);

  private cache: MemoryCache;

  public constructor(
    private readonly kafkaClient: JournalClient,
    private readonly config: SampleConfig,
    private readonly logger: PersonalizationLoggerService,
    private readonly memoryCacheManager: MemoryCacheManager,
    @Inject(DynamicConfigNames.p13n)
    private readonly statConfig: StatDynamicConfig,
  ) {
    this.cache = this.memoryCacheManager.create('sample-collector', this.config.ttl ?? 5000);

    this.queue = new AsyncBatchQueue({
      // QPS10 * 5retriver = 50/s * 5s= 250 event
      size: 250,
      interval: 5000,
      resolve: async (list: ViewerSampleEvent[]) => {
        try {
          if (list.length === 0) return;
          await this.sendBatch({ correlationId: 'async-batch-send' }, list);
        } catch (e) {
          this.logger.error('ErrorBatchInsertSample', String(e), {
            correlationId: 'CollectorService',
          });
        }
      },
    });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.queue.flush();
    this.queue.stop();
  }

  public collect(ctx: IContext): void {
    // send to kafka can handle after request
    this._collect(ctx).catch((err: Error) => {
      this.reportError(ctx, err);
    });
  }

  public async updatePosts(ctx: IContext, postList: UpdatePostInfo[]) {
    try {
      const data = await this.cache.get<SampleCache>(ctx.correlationId);
      if (data?.enabled !== 'true') return;
      const posts = data?.posts || {};
      for (const post of postList) {
        const uniqKey = `${post.retrieverName}-${post.postId}`;
        const prevObj: SamplePostInfo = posts[uniqKey] || {
          postId: post.postId,
          rnInRetriever: -1,
          rnInRanking: -1,
          rnInReRanking: -1,
          rnInMerge: -1,
          rnInFinal: -1,
          // isPassXXX: -1: init value , 0: not pass, 1: pass
          // if final result is -1, means the post did not reach this stage
          isPassFilter: 0,
          isPassMerge: 0,
          isPassRank: 0,
          isPassReRank: 0,
          isFinal: 0,
          rankingScore: 0,
          retriever_score: -1,
          feed_tag: 'feed',
        };
        posts[uniqKey] = Object.assign(prevObj, post);
      }
      this.cache.set(ctx.correlationId, { ...data, posts }, this.config.ttl);
    } catch (err: any) {
      this.reportError(ctx, err);
    }
  }

  public async entry(context: IContext, userId: string, feedId: string) {
    try {
      if (!userId || !context.correlationId) {
        this.logger.error('SampleCollectorEntryError', 'userId or correlationId is empty', {
          ...context,
        });
        return;
      }

      // Early sampling decision - avoid cache pressure for disabled entries
      const enabled = this.isEntryEnabled(userId);
      if (enabled !== 'true') {
        return;
      }

      const newEntryCache: SampleCache = {
        correlationId: context.correlationId,
        userId: userId,
        feedId: feedId,
        enabled,
        posts: {},
      };
      this.cache.set(context.correlationId, newEntryCache, this.config.ttl);
    } catch (err: any) {
      this.reportError(context, err);
    }
  }

  private async _collect(ctx: IContext): Promise<void> {
    const cacheData = this.cache.get<SampleCache>(ctx.correlationId);
    this.cache.remove(ctx.correlationId);

    if (!cacheData) return;
    if (cacheData.enabled !== 'true') return;
    const postInfo = cacheData.posts;
    const retriver2Post = Array.from(Object.values(postInfo)).reduce((res, post) => {
      if (!post.retrieverName) return res;
      const list = res[post.retrieverName] || [];
      res[post.retrieverName] = [...list, post];
      return res;
    }, {} as Record<string, SamplePostInfo[]>);
    const entries = Array.from(Object.entries(retriver2Post));
    const allEvents: ViewerSampleEvent[] = entries.map(([retrieverName, posts]) => {
      return {
        retrieverName: retrieverName,
        postInfo: posts,
        userId: cacheData.userId,
        feedId: cacheData.feedId,
        retrieverInfo: {
          retrieverName: retrieverName,
        },
        userInfo: {
          userId: cacheData.userId,
        },
        traceId: ctx.correlationId,
        dt: new Date().toISOString(),
      } as ViewerSampleEvent;
    });
    await this.queue.addList(allEvents);
  }

  private async sendBatch(ctx: IContext, data: ViewerSampleEvent[]) {
    const traceIds = data.map(t => t.traceId);
    this.logger.log('BatchSendSampleEvent', {
      ...ctx,
      traceIds: traceIds,
    });

    try {
      // encode all events to buffer
      const result = await Promise.allSettled(
        data.map(event => {
          event.postInfo = event.postInfo.slice(0, 500);
          // will auto process key like userId->user_id
          return this.process(event);
        }),
      );
      const failedEvents = result.filter(r => r.status === 'rejected') as PromiseRejectedResult[];
      const processedEvents = result
        .filter(r => r.status === 'fulfilled')
        .map((t: PromiseFulfilledResult<Buffer>) => {
          return t.value;
        })
        .filter(Boolean);
      this.logger.log('BatchSendSampleEventProcess', {
        ...ctx,
        hasEventProcessFailed: failedEvents.length > 0,
        eventsCount: data.length,
        eventsProcessedCount: processedEvents.length,
        failedReasons: failedEvents.map(r => util.inspect(r.reason)),
        traceIds: traceIds,
      });
      // todo sendBatch should pass Array{key,value} instead  of Array{value}
      // each message should have key
      await this.kafkaClient.sendBatch(TOPIC_SAMPLE_EVENT, processedEvents, ctx, {
        key: `batch-${this.instanceId}`,
      });
    } catch (err: any) {
      this.reportError(ctx, err);
    }
  }

  private isEntryEnabled(userId: string): 'true' | 'false' {
    const isDetailsUser = this.logger.areDetailsLogsEnabled({
      userId: userId,
    });
    const envWhiteList = this.config.whiteList || [];

    if (envWhiteList.includes(userId) || isDetailsUser) {
      return 'true';
    }
    // use for ml team to config in statsig
    const statWhiteList = this.statConfig.getSysValue<string[]>('sample_user_ids', []);
    if (statWhiteList && statWhiteList.includes(userId)) {
      return 'true';
    }
    const random = seedrandom(String(userId))() * 1000;
    return random < this.config.sampleRate ? 'true' : 'false';
  }

  private reportError(ctx: IContext, err: any) {
    const stack = err?.stack || 'empty-stack';
    this.logger.error('SampleCollectorInternalError', stack, {
      ...ctx,
    });
  }

  public async process(payload: ViewerSampleEvent): Promise<Buffer> {
    const schemaId = await this.getSchemaId();
    const serialized = this.serializePayload(payload);
    return this.getRegistry().encode(schemaId, serialized);
  }

  private getRegistry(): SchemaRegistry {
    // sync with https://gitlab.flipfit.io/flip/event-store-common/-/blob/master/src/services/event-store.service.ts?ref_type=heads
    if (!this.registry) {
      this.registry = new SchemaRegistry({
        host: process.env.SCHEMA_REGISTRY_URL ?? 'http://kafka-connect-schema-registry.kafka-connect:8081',
      });
    }
    return this.registry;
  }

  private _schemaId: number;
  private async getSchemaId() {
    if (!this._schemaId) {
      const res = await this.getRegistry().register(
        {
          schema: JSON.stringify(sampleSchema),
          type: SchemaType.AVRO,
        },
        {
          subject: `${TOPIC_SAMPLE_EVENT}-value`,
        },
      );
      this._schemaId = res.id;
    }
    return this._schemaId;
  }

  private serializePayload(payload: ViewerSampleEvent): any {
    payload.event_timestamp = Date.now();
    payload.event_user_id = payload.userId;
    return this.convertKeysToUnderscoreCase(payload);
  }

  private convertKeysToUnderscoreCase(obj: any): any {
    // sync with https://gitlab.flipfit.io/flip/event-store-common/-/blob/master/src/services/event-store.service.ts?ref_type=heads
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(item => this.convertKeysToUnderscoreCase(item));
      } else {
        const result: any = {};
        for (const key in obj) {
          result[this.fastKeyConversion(key)] = this.convertKeysToUnderscoreCase(obj[key]);
        }
        return result;
      }
    }
    return obj;
  }

  private fastKeyConversion(str: string): string {
    // Check pre-computed common keys first (biggest performance win)
    if (this.commonKeys.has(str)) {
      return this.commonKeys.get(str)!;
    }

    // Check cache for uncommon keys
    if (this.keyCache.has(str)) {
      return this.keyCache.get(str)!;
    }

    // Convert and cache the result
    const result = str.replace(this.camelCaseRegex, '$1_$2').replace(this.dashDotRegex, '_').toLowerCase();
    this.addToKeyCache(str, result);
    return result;
  }

  private addToKeyCache(key: string, value: string): void {
    if (this.keyCache.has(key)) return;

    if (this.keyCache.size >= this.maxKeyCacheSize) {
      // Simple FIFO: remove first entry when cache is full
      const firstKey = this.keyCache.keys().next().value;
      if (firstKey) {
        this.keyCache.delete(firstKey);
      }
    }
    this.keyCache.set(key, value);
  }
}
