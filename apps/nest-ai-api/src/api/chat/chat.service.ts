import { Injectable, OnModuleInit } from '@nestjs/common';
import OpenAI from 'openai';

// const client = new OpenAI({
//   apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
// });
//
// async function main() {
//   const chatCompletion = await client.chat.completions.create({
//     messages: [{ role: 'user', content: 'Say this is a test' }],
//     model: 'gpt-3.5-turbo',
//   });
// }

// main();

@Injectable()
export class ChatService implements OnModuleInit {
  private client: OpenAI;
  async onModuleInit() {
    this.client = new OpenAI({
      apiKey: 'sk-Jg800f045160f131efd4e26ddbcb0b7cd5d90b0028aT6CVy', // This is the default and can be omitted
      baseURL: 'https://api.gptsapi.net/v1',
      fetch: (u, init) => {
        // console.log('fetching', u, init);
        return fetch(u, init);
      },
    });
  }

  public async aiChatHello() {
    const chatCompletion = await this.client.chat.completions
      .create({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'gpt-4o-mini',
      })
      .catch((e) => {
        console.log('chat error');
        console.error(e);
        throw e;
      });
    return chatCompletion;
  }
  public async aiChatHelloV2(query: string) {
    const chatCompletion = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }],
      response_format: { type: 'text' },
    });
    return chatCompletion.choices[0].message.content;
  }
  public async aiChatHelloV3(query: string) {
    return this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: query }],
      response_format: { type: 'text' },
      stream: true,
    });
  }
}
