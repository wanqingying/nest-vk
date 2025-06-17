import {
  Statsig,
  StatsigOptions,
  StatsigUser,
  ParameterStore,
} from '@statsig/statsig-node-core';

async function main() {
  // 初始化 Statsig SDK
  const statsig = new Statsig(
    'secret-hUJTYztfNngOGPacvlvBHG45NeSQo6Lv1SYWtx542Vj',
    {
      specsSyncIntervalMs: 3000,
      environment: 'production',
      serviceName: 'p13n',
    },
  );
  await statsig.initialize();

  // 创建包含自定义属性的用户对象
  const user = StatsigUser.withUserID('sys');
  user.custom = {
    sys_name: 'sys_base',
  };
  console.log('User:', user.custom);

  const ps = statsig.getParameterStore(user, 'p13n-staging');
  const psList = statsig.getParameterStoreList();
  console.log('Parameter Store List:', psList);
  const cfg = ps.getValue<string[]>('sample_whitelist', ['def']);
  statsig.logEvent(user, 'sample_whitelist', 'getValue', {
    key: 'sample_whitelist',
    value: JSON.stringify(cfg),
  });

  console.log('Parameter Store Config:', cfg);

  //   await statsig.shutdown();
  //   setInterval(() => {
  //     const user = StatsigUser.withUserID('system');

  //     const ps = statsig.getParameterStore(user, 'p13n-staging');
  //     const v = ps.getValue<string[]>('sample_whitelist', ['def']);
  //     console.log('Parameter Store Config:', v);
  //   }, 3000);

  // 记录事件（带有自定义值）
  //   statsig.logEvent(user, 'button_click', {
  //     buttonColor: 'blue',
  //     pageLocation: 'header',
  //   });

  const dc = statsig.getDynamicConfig(user, 'p13n-dynamic');
  console.log(
    `dc val ${JSON.stringify(dc.value)} , ${dc.getValue('sample_rate', 5)}`,
  );

  setInterval(() => {
    const id = Math.random().toString(36).substring(2, 15);
    const dc = statsig.getDynamicConfig(
      StatsigUser.withUserID(id),
      'rank-server-dynamic',
      {
        disableExposureLogging: false,
      },
    );
    console.log(
      `dc val ${JSON.stringify(dc.value)} , ${dc.getValue('sample_rate', 5)}`,
    );
  }, 3000);
}

main().catch(console.error);
