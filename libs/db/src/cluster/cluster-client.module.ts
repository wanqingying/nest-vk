import { DynamicModule, InjectionToken, Module } from '@nestjs/common';

import {
  ClusterLegacyConfig,
  RedisClusterLegacyService,
} from './cluster-client-legacy.service';
import { RedisClusterService, ClusterConfig } from './cluster-client.service';
import { NestLogger } from '@libs/utils';

export interface ClusterManyConfig {
  name: InjectionToken;
  config: ClusterConfig;
}

@Module({})
export class RedisClusterModule {
  public static forRoot(config: ClusterConfig): DynamicModule {
    return {
      module: RedisClusterModule,
      global: config.global ?? true,
      providers: [
        RedisClusterService,
        RedisClusterLegacyService,
        {
          provide: ClusterLegacyConfig,
          useValue: new ClusterLegacyConfig(config),
        },
        {
          provide: ClusterConfig,
          useValue: new ClusterConfig(config),
        },
        {
          provide: NestLogger,
          useValue: new NestLogger('RedisClusterModule'),
        },
      ],
      exports: [RedisClusterService],
    };
  }
  public static forFeature(
    configs: ClusterManyConfig[],
    global = true,
  ): DynamicModule {
    const providers = configs
      .map(({ name, config }) => {
        return [
          {
            provide: name,
            useFactory: (): RedisClusterService => {
              const configInstance = new ClusterConfig({
                name: getNameString(name),
                ...config,
              });
              return new RedisClusterService(
                configInstance,
                new NestLogger(`RedisClusterModule:${String(name)}`),
              );
            },
          },
        ];
      })
      .flat();

    return {
      module: RedisClusterModule,
      global: global,
      providers,
      exports: providers.map((p) => p.provide),
    };
  }
}

function getNameString(name: InjectionToken): string {
  if (typeof name === 'string') return name;
  if (typeof name === 'symbol') return name.description ?? String(name);
  return String(name);
}

export { RedisClusterService };
