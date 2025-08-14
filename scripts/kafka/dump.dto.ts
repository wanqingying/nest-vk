import {
  AvroBaseDto,
  AvroField,
  AvroSchema,
  avtd,
} from './feature-dump/avro/avro.schema';
import path from 'node:path';
import fs from 'node:fs';
import { isEqual } from 'lodash';

// import { DUMP_TOPIC } from '../help';
import 'reflect-metadata';

export const DUMP_TOPIC = 'dump_test_3';

const types = avtd.types;
@AvroSchema({
  namespace: 'game_cash',
  name: 'DumpRankItem',
})
export class RankItemDto extends AvroBaseDto {
  public constructor(data: Omit<RankItemDto, 'getSchema'>) {
    super();
    Object.assign(this, data);
  }

  @AvroField({
    type: types.string,
  })
  public game_id!: string;

  @AvroField({
    type: types.string,
  })
  public name!: string;

  // @AvroField({
  //   type: types.long,
  // })
  // public item_title!: number;

  @AvroField({
    type: types.map,
    values: [types.float],
  })
  public scores!: Record<string, number>;

  @AvroField({
    type: types.map,
    values: [types.float],
  })
  public pas_features!: Record<string, number>;

  @AvroField({
    type: types.map,
    values: [types.string],
  })
  public raw_features!: Record<string, string>;

  @AvroField({
    type: types.int,
  })
  public rank_model_index!: number;

  @AvroField({
    type: types.int,
  })
  public rank_offer_index!: number;

  @AvroField({
    type: types.int,
  })
  public rank_merge_index!: number;
}

@AvroSchema({
  namespace: 'game_cash',
  name: 'GameCashRankingDumpDto',
  topic: DUMP_TOPIC,
  doc: 'Game cash ranking dump features and metadata',
})
export class GameCashRankingDumpDto extends AvroBaseDto {
  public constructor(data: Omit<GameCashRankingDumpDto, 'getSchema'>) {
    super();
    Object.assign(this, data);
  }

  @AvroField({
    type: types.string,
  })
  public event_user_id!: string;

  @AvroField({
    type: types.long,
  })
  public event_timestamp!: number;

  @AvroField({
    type: types.string,
  })
  public request_id!: string;

  @AvroField({
    type: types.string,
  })
  public event_id!: string;

  @AvroField({
    type: types.array,
    items: RankItemDto,
  })
  public rank_top_items!: RankItemDto[];

  @AvroField({
    type: types.string,
  })
  public layer_config_json!: string;
}

// {
//   "event_user_id": "66ab4a056995cd5ed6b7bc75",
//   "event_timestamp": 1755170489395,
//   "request_id": "test-v1",
//   "event_id": "452714c6-296d-46cf-979c-f920a7421cc8",
//   "rank_top_items": [
//     {
//       "game_id": "game-offer-1",
//       "scores": {
//         "pred_install_rate": 0,
//         "pred_regression": 0,
//         "final_score": 0,
//         "merge_score": 1
//       },
//       "pas_features": {},
//       "raw_features": {},
//       "rank_model_index": 1,
//       "rank_offer_index": 1,
//       "rank_merge_index": 1
//     }
//   ],
//   "layer_config_json": "{\"models\":[{\"feature_group_name\":\"ranking-features-group-v2\",\"name\":\"pred_install_rate\",\"s3_model_file\":\"s3://flip-ml-test/game-cash-ranking/lgbm_predictor_0812.js\"},{\"feature_group_name\":\"ranking-features-group-v2\",\"name\":\"pred_regression\",\"s3_model_file\":\"s3://flip-ml-test/game-cash-ranking/lgbm_regression_predictor_0812.js\"}],\"rank_expression\":\" const offer_score = 1 - (offer_index - 1) / (offer_count);return offer_score + scores.final_score;\",\"ranking_strategy\":\"p13n-v2\",\"score_expression\":\"const score = 0;  const is_editoral_game = feat.is_editoral_game||0;   return score + is_editoral_game * 10 ; \"}"
// }

export const dumpTestInstance2 = new GameCashRankingDumpDto({
  event_user_id: 'user456',
  event_timestamp: Date.now(),
  request_id: 'test-v2',
  event_id: '452714c6-296d-46cf-979c-f920a7421cc8',
  rank_top_items: [
    new RankItemDto({
      game_id: 'game-offer-2',
      name: 'Game 456',
      scores: { feature1: 0.9, feature2: 0.8 },
      pas_features: {},
      raw_features: { feature1: 'raw1', feature2: 'raw2' },
      rank_model_index: 1,
      rank_offer_index: 1,
      rank_merge_index: 1,
    }),
  ],
  layer_config_json: JSON.stringify({ layer: 'test' }),
});

export const dumpTestInstance1 = new GameCashRankingDumpDto({
  event_user_id: 'user123',
  event_timestamp: Date.now(),
  request_id: 'req-123',
  event_id: 'event-123',
  rank_top_items: [
    new RankItemDto({
      game_id: 'game-123',
      name: 'Game 123',
      scores: { feature1: 0.9, feature2: 0.8 },
      pas_features: { feature1: 0.7, feature2: 0.6 },
      raw_features: { feature1: 'raw1', feature2: 'raw2' },
      rank_model_index: 1,
      rank_offer_index: 2,
      rank_merge_index: 3,
    }),
  ],
  layer_config_json: JSON.stringify({ layer: 'test' }),
});

// ...existing code...

export const dumpTestInstance3 = new GameCashRankingDumpDto({
  event_user_id: '66ab4a056995cd5ed6b7bc75',
  event_timestamp: 1755170489395,
  request_id: 'test-v1',
  event_id: '452714c6-296d-46cf-979c-f920a7421cc8',
  rank_top_items: [
    new RankItemDto({
      game_id: 'game-offer-1',
      name: 'Game Offer 1',
      scores: {
        pred_install_rate: 0,
        pred_regression: 0,
        final_score: 0,
        merge_score: 1,
      },
      pas_features: {},
      raw_features: {},
      rank_model_index: 1,
      rank_offer_index: 1,
      rank_merge_index: 1,
    }),
  ],
  layer_config_json: JSON.stringify({
    models: [
      {
        feature_group_name: 'ranking-features-group-v2',
        name: 'pred_install_rate',
        s3_model_file:
          's3://flip-ml-test/game-cash-ranking/lgbm_predictor_0812.js',
      },
      {
        feature_group_name: 'ranking-features-group-v2',
        name: 'pred_regression',
        s3_model_file:
          's3://flip-ml-test/game-cash-ranking/lgbm_regression_predictor_0812.js',
      },
    ],
    rank_expression:
      ' const offer_score = 1 - (offer_index - 1) / (offer_count);return offer_score + scores.final_score;',
    ranking_strategy: 'p13n-v2',
    score_expression:
      'const score = 0;  const is_editoral_game = feat.is_editoral_game||0;   return score + is_editoral_game * 10 ; ',
  }),
});

fs.writeFileSync(
  path.join(__dirname, 'dump_test_instances3.json'),
  JSON.stringify(dumpTestInstance3, null, 2),
);
