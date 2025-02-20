import { LangchainService } from './langchain.service';
/*
https://docs.nestjs.com/modules
*/

import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [LangchainService],
  exports: [LangchainService],
})
export class LangchainModule {}
