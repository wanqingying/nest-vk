import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from 'apps/nest-rpc-client/src/app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import {
  ConsulClient,
  ConsulServiceNode,
} from '@libs/microrpc/modules/consul/client';
import { HealthModule } from './api/health/health.module';
import path from 'node:path';
import {credentials} from "@grpc/grpc-js"

// const PROTO_DIR = path.join(process.cwd(), process.env.PROTO_DIR);
const PROTO_DIR = path.resolve(process.cwd(), 'libs/microrpc/src/protos');
const serviceConfig = {
  loadBalancingConfig: [{ round_robin: {} }],
};

@Module({
  imports: [
    ClientsModule.registerAsync({
      isGlobal: true,
      clients: [
        // {
        //   name: 'GRPC_HERO',
        //   useFactory: async () => {
        //     const targets: ConsulServiceNode[] =
        //       ConsulClient.getServiceClient('nest-grpc-server').getPassNodes();
        //     console.log('init register targets', targets);
        //     return {
        //       transport: Transport.GRPC,
        //       options: {
        //         url: `ipv4:${targets
        //           .map((t) => {
        //             return `${t.host}:${t.port}`;
        //           })
        //           .join(',')}`,
        //         package: ['hero'],
        //         protoPath: [
        //           // hero
        //           path.join(PROTO_DIR, 'hero.proto'),
        //         ],
        //         channelOptions: {
        //           'grpc.service_config': JSON.stringify(serviceConfig),
        //         },
        //       },
        //     };
        //   },
        // },
        {
          name: 'GRPC_HERO',
          useFactory: async () => {
            // const targets: ConsulServiceNode[] =
            //   ConsulClient.getServiceClient('nest-grpc-server').getPassNodes();
            // console.log('init register targets', targets);
            return {
              transport: Transport.GRPC,
              options: {
                url: `dns:///rpc-s-consul:3006`,
                package: ['hero'],
                credentials: credentials.createInsecure(),
                protoPath: [
                  // hero
                  path.join(PROTO_DIR, 'hero.proto'),
                ],
                channelOptions: {
                  'grpc.service_config': JSON.stringify(serviceConfig),
                },
              },
            };
          },
        },
      ],
    }),
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {}
}
