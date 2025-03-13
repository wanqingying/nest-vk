
import Consul from 'consul';

// 'nest-ai-api-db9ae3384a91': {
//   ID: 'nest-ai-api-db9ae3384a91',
//   Service: 'nest-ai-api',
//   Tags: [],
//   Meta: {},
//   Port: 3004,
//   Address: 'db9ae3384a91',
//   Weights: { Passing: 1, Warning: 1 },
//   EnableTagOverride: false,
//   Datacenter: 'dc1'
// },

export interface ConsulService {
  ID: string;
  Service: string;
  Tags: string[];
  Meta: Record<string, unknown>;
  Port: number;
  Address: string;
  Weights: Record<string, number>;
  EnableTagOverride: boolean;
  Datacenter: string;
}

// @Module({
//   imports: [
// 	ClientsModule.registerAsync({
// 	  isGlobal: true,
// 	  clients: [
// 		{
// 		  imports: [],
// 		  name: 'MATH_SERVICE',
// 		  useFactory: async () => {
// 			const targetServiceName = 'nest-ai-api';
// 			const consulClient = new Consul({
// 			  host: process.env.NODE_ENV === 'dev' ? 'localhost' : 'consul',
// 			  port: 8500,
// 			});
// 			const services = await consulClient.agent.services();
// 			// consulClient.session
// 			const serviceList = Object.values(services) as ConsulService[];
// 			const list = serviceList
// 			  .filter((t) => {
// 				return t.Service === targetServiceName;
// 			  })
// 			  .map((t) => {
// 				return {
// 				  host: t.Address,
// 				  port: t.Port,
// 				};
// 			  });
// 			// services
// 			return {
// 			  transport: Transport.TCP,
// 			  options: {
// 				host: 'localhost',
// 				port: 3001,
// 			  },
// 			};
// 		  },
// 		  inject: [],
// 		},
// 	  ],
// 	}),
// 	LangchainModule,
// 	// sentry
// 	SentryModule.forRoot(),
//   ],
//   controllers: [AppController],
//   providers: [
// 	AppService,
// 	{
// 	  provide: APP_FILTER,
// 	  useClass: SentryGlobalFilter,
// 	},
//   ],
// })
// export class AppModule implements OnModuleInit {
//   async onModuleInit() {

//   }
// }

export class ConsulSingletonClient {
  private static instance: ConsulSingletonClient;
  private consulClient: Consul;
  private serviceList: ConsulService[] = [];

  private constructor() {
    this.consulClient = new Consul({
      host: process.env.NODE_ENV === 'dev' ? 'localhost' : 'consul',
      port: 8500,
    });
  }

  public static getInstance(): ConsulSingletonClient {
    if (!ConsulSingletonClient.instance) {
      ConsulSingletonClient.instance = new ConsulSingletonClient();
    }
    return ConsulSingletonClient.instance;
  }

  public async initServices() {
    const services = await this.consulClient.agent.services();
    this.serviceList = Object.values(services) as ConsulService[];
	console.log('serviceList', this.serviceList);
  }

  public getServiceList(targetServiceName: string): ConsulService[] {
    return this.serviceList.filter((t) => t.Service === targetServiceName);
  }
}
