export class ViewerSampleEvent {
  public constructor(data: ViewerSampleEvent) {
    Object.assign(this, data);
  }
  public userId!: string;
  public feedId?: string;
  public userInfo!: SampleUserInfo;
  public traceId!: string; // service trace id
  public retrieverName!: string;
  public retrieverInfo!: SampleRetrieverInfo;
  public postInfo!: SamplePostInfo[]; // posts list
  public dt!: string; // datetime
  public event_timestamp?: any; // extra data need by event-store
  public event_user_id?: string; // extra data need by event-store
}

export class SamplePostInfo {
  public constructor(data: SamplePostInfo) {
    Object.assign(this, data);
  }
  public postId!: string;
  public rnInRetriever!: number; //rank index in retriever
  public rnInRanking!: number; // index in ranking
  public rnInReRanking!: number; // index in re-ranking
  public rnInMerge?: number; // index in merge
  public rnInFinal?: number; // index in final
  public isPassFilter!: number; // 0: not pass, 1: pass
  public isPassMerge!: number; // 0: not pass, 1: pass
  public isPassRank!: number; // 0: not pass, 1: pass
  public isPassReRank!: number; // 0: not pass, 1: pass
  public isFinal!: number; // 0: not send, 1: send to user
  public rankingScore?: number; // ranking score
  public retriever_score?: number; // score is -1 if not exist
  public feed_tag?: 'feed' | 'upfront_cache'; // tag extra data
}
export class StorePostInfo extends SamplePostInfo {
  public constructor(data: SamplePostInfo) {
    super(data);
  }
  public retrieverName!: string;
}

export type UpdatePostInfo = Partial<StorePostInfo> & {
  postId: string;
  retrieverName: string;
};

export class SampleUserInfo {
  public constructor(data: SampleUserInfo) {
    Object.assign(this, data);
  }
  public userId!: string; // duplicate of ViewerSampleEvent.userId
}
export class SampleRetrieverInfo {
  public constructor(data: SampleRetrieverInfo) {
    Object.assign(this, data);
  }
  public retrieverName!: string;
  // todo other fields in furture
}

export interface SampleCache {
  correlationId: string;
  userId: string;
  feedId?: string;
  enabled: string; // 'true' | 'false' sample collect enabled
  //posts: Record<retrievalName-postId, StorePostInfo>
  posts: Record<string, StorePostInfo>;
}

export class SampleConfig {
  public constructor(data: SampleConfig) {
    Object.assign(this, data);
  }
  public sampleRate!: number; // sample rate 0-1000
  public whiteList!: string[]; // white list force enable
  public ttl?: number = 5 * 60 * 1000; // memory-cache ttl
  public serviceName!: string;
  public brokers!: string[]; // kafka brokers
  public disableForLocalRun!: boolean; // disable for local run
}

export const TOPIC_SAMPLE_EVENT = 'event_recommendation_sample_2';
