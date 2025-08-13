import {
  AvroField,
  AvroSchema,
  AvroBaseDto,
  avtd,
} from './avro.schema';

@AvroSchema({
  namespace: 'flip_personalization_recommendations_recorder',
  name: 'UserInfo',
})
export class UserInfo extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  user_id: string;

  constructor(data?: Partial<UserInfo>) {
    super(data);
    Object.assign(this, data);
  }
}

@AvroSchema({
  namespace: 'flip_personalization_recommendations_recorder',
  name: 'RetrieverInfo',
})
export class RetrieverInfo extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  retriever_name: string;

  constructor(data?: Partial<RetrieverInfo>) {
    super(data);
    Object.assign(this, data);
  }
}

@AvroSchema({
  namespace: 'flip_personalization_recommendations_recorder',
  name: 'PostInfo',
})
export class PostInfo extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  post_id: string;

  @AvroField({ type: avtd.types.int })
  rn_in_retriever: number;

  @AvroField({ type: avtd.types.int })
  rn_in_ranking: number;

  @AvroField({ type: avtd.types.int })
  rn_in_re_ranking: number;

  @AvroField({ 
    type: avtd.types.int,
    optional: true,
    default: -1
  })
  rn_in_merge?: number;

  @AvroField({ 
    type: avtd.types.int,
    optional: true,
    default: -1
  })
  rn_in_final?: number;

  @AvroField({ type: avtd.types.int })
  is_pass_filter: number;

  @AvroField({ type: avtd.types.int })
  is_pass_merge: number;

  @AvroField({ type: avtd.types.int })
  is_pass_rank: number;

  @AvroField({ type: avtd.types.int })
  is_pass_re_rank: number;

  @AvroField({ type: avtd.types.int })
  is_final: number;

  @AvroField({ type: avtd.types.float })
  ranking_score: number;

  @AvroField({ 
    type: avtd.types.float,
    optional: true,
    default: null
  })
  retriever_score?: number;

  constructor(data?: Partial<PostInfo>) {
    super(data);
    Object.assign(this, data);
  }
}

@AvroSchema({
  namespace: 'flip_personalization_recommendations_recorder',
  name: 'P13nSample',
})
export class P13nSample extends AvroBaseDto {
  @AvroField({ type: avtd.types.string })
  user_id: string;

  @AvroField({ type: UserInfo })
  user_info: UserInfo;

  @AvroField({ type: avtd.types.string })
  retriever_name: string;

  @AvroField({ type: RetrieverInfo })
  retriever_info: RetrieverInfo;

  @AvroField({
    type: avtd.types.array,
    items: PostInfo,
  })
  post_info: PostInfo[];

  @AvroField({ type: avtd.types.string })
  trace_id: string;

  @AvroField({ type: avtd.types.string })
  dt: string;

  @AvroField({ 
    type: avtd.types.string,
    optional: true,
    default: ""
  })
  feed_id?: string;

  @AvroField({ 
    type: avtd.types.string,
    optional: true,
    default: null
  })
  event_user_id?: string;

  @AvroField({ 
    type: avtd.types.long,
    default: 0
  })
  event_timestamp: number;

  constructor(data?: Partial<P13nSample>) {
    super(data);
    Object.assign(this, data);
  }
}

// 示例用法
export const p13nSampleInstance = new P13nSample({
  user_id: "user123",
  user_info: new UserInfo({ user_id: "user123" }),
  retriever_name: "content_based_retriever",
  retriever_info: new RetrieverInfo({ retriever_name: "content_based_retriever" }),
  post_info: [
    new PostInfo({
      post_id: "post456",
      rn_in_retriever: 1,
      rn_in_ranking: 2,
      rn_in_re_ranking: 1,
      rn_in_merge: 1,
      rn_in_final: 1,
      is_pass_filter: 1,
      is_pass_merge: 1,
      is_pass_rank: 1,
      is_pass_re_rank: 1,
      is_final: 1,
      ranking_score: 0.85,
      retriever_score: 0.75
    })
  ],
  trace_id: "trace789",
  dt: "2024-01-01",
  feed_id: "feed001",
  event_user_id: "user123",
  event_timestamp: Date.now()
});

// 生成Schema
export const p13nSampleSchema = p13nSampleInstance.getSchema();
// console.log('P13nSample Schema:', JSON.stringify(p13nSampleSchema, null, 2));

