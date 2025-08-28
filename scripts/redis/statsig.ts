import { Statsig, StatsigUser } from '@statsig/statsig-node-core';

async function test() {
  const statsig = new Statsig(
    'secret-hUJTYztfNngOGPacvlvBHG45NeSQo6Lv1SYWtx542Vj',
    { environment: 'staging' },
  );
  await statsig.initialize();

  const dc = statsig
    .getDynamicConfig(
      StatsigUser.withUserID('sys'),
      'game-cash-cpi-install-bonus',
    )
    .getValue('install_bonus_multiplier', -1);
  console.log('config=', dc);
}
test();

//[Running] ts-node "/Users/qingyingwanflip/gitlab/qingying/nest-vk/scripts/redis/statsig.ts"
// config= 0.3
