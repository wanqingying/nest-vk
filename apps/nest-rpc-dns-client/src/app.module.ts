import { Module, OnModuleInit } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HealthModule } from './api/health/health.module';
import path from 'node:path';
import { credentials } from '@grpc/grpc-js';

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
        {
          name: 'GRPC_HERO',
          useFactory: async () => {
            return {
              transport: Transport.GRPC,
              options: {
                url: `dns:///rpc-s-dns:3006`,
                package: ['hero'],
                credentials: credentials.createInsecure(),
                protoPath: [path.join(PROTO_DIR, 'hero.proto')],
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
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule implements OnModuleInit {
  async onModuleInit() {}
}
