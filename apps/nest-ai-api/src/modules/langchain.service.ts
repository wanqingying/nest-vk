import { Global, Injectable, OnModuleInit } from '@nestjs/common';

import { ChatOpenAI } from '@langchain/openai';

// const llm = new ChatOpenAI({
//   model: "gpt-4o-mini",
//   temperature: 0
// });

@Global()
@Injectable()
export class LangchainService implements OnModuleInit {
  private client: ChatOpenAI;
  async onModuleInit() {
    console.log('init langchain');
    this.client = new ChatOpenAI({
      model: 'gpt-4o-mini',
      temperature: 0.3,
    });
  }

  async aiChatHello(str?: string) {
    const res = await this.client.invoke([
      {
        role: 'user',
        content: str || 'hi im bob',
      },
    ]);
    return res.content;
  }
}
