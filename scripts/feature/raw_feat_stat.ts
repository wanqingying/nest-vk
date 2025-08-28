export const raw_feat_base_1 = {
  featureName: 'user_tier',
  resourceId: '67f346b363da1df1e40dc8e5',
  featureType: 'string',
  featureValue: '0',
};
export const raw_feat_stat_1 = {
  featureName: 'stat_fea',
  resourceId: '67f346b363da1df1e40dc8e5',
  featureType: 'json',
  featureValue: {
    all_all: {
      comment_click_30d: 1,
    },
    // old map stat features
    // 'user_age_bin_47+': {
    //   comment_click_30d: 1,
    //   view_30d: 12,
    //   watch_time_30d: 947.3340000000001,
    // },
    // change to plain kv {dimkey}_{featureName}
    ['user_age_bin_47+_comment_click_30d']: 1, // match: {user_age_bin}_comment_click_30d
    ['user_age_bin_47+_view_30d']: 12, // match {user_age_bin}_view_30d
    ['user_age_bin_47+_watch_time_30d']: 947.3340000000001, // match {user_age_bin}_watch_time_30d
  },
};
//stat dimkey handler
const dimHandle = {
  user_age_bin: (dto: any) => {
    // pass user+post+creater+metrics to calculate dimval
    return '47+';
  },
};
// redis store data in pb
const struc = {
  // user id
  key: '67f346b363da1df1e40dc8e5',
  val: {
    ['user_tier']: 0, // 非统计特征
    ['user_age_bin_47+_comment_click_30d']: 1,
    ['user_age_bin_47+_view_30d']: 12,
    ['user_age_bin_47+_watch_time_30d']: 947.3340000000001,
  },
};

// pass feat {dimkey}_{featureName}: featureVal
