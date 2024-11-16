import { Controller, Query, Sse, Res } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';
import { ChatService } from './chat.service';

const b = {
  id: 'chatcmpl-AKpcfk4IWxUQxumg5fpRBl5BremNd',
  object: 'chat.completion.chunk',
  created: 1729528361,
  model: 'gpt-4o-mini-2024-07-18',
  system_fingerprint: 'fp_e2bde53e6e',
  choices: [
    {
      index: 0,
      delta: { content: ')' },
      logprobs: null,
      finish_reason: null,
    },
  ],
  usage: null,
};
const b2 = {
  id: 'chatcmpl-AKpkD7PG7g2ygWrUfZM8wWfBCaJ6Y',
  object: 'chat.completion.chunk',
  created: 1729528829,
  model: 'gpt-4o-mini-2024-07-18',
  system_fingerprint: 'fp_482c22a7bc',
  choices: [],
  usage: {
    prompt_tokens: 22,
    completion_tokens: 159,
    total_tokens: 181,
    prompt_tokens_details: { cached_tokens: 0 },
    completion_tokens_details: { reasoning_tokens: 0 },
  },
};

type ChatCompletion = typeof b | typeof b2;

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {
    console.log('init 5');
  }

  async getHello(@Query() q: any) {
    return this.chatService.aiChatHelloV2(q?.txt || 'hello');
  }

  @Sse('/sse-chat')
  getHelloV2(@Query() q: any, @Res() res: Response): Observable<MessageEvent> {
    console.log('sse-chat', q);
    return new Observable((subscriber) => {
      const start_ms = Date.now();
      let first_chunk_ms = 0;
      let last_chunk_ms = 0;
      this.chatService
        .aiChatHelloV3(
          q?.content ||
            '写一个markdown ,内容是关于后端程序员职业发展的，多于200个字符串',
        )
        .then(async (stream) => {
          for await (const chunk of stream) {
            const txt = chunk.choices[0]?.delta?.content || '';
            // console.log('next', chunk.choices[0]?.delta?.content || '');
            // console.log('data', chunk);
            subscriber.next(txt);
            if (txt && first_chunk_ms === 0) {
              first_chunk_ms = Date.now() - start_ms;
            }
          }
          last_chunk_ms = Date.now() - start_ms;
          console.log(
            `first_chunk_ms: ${first_chunk_ms} last_chunk_ms: ${last_chunk_ms}`,
          );
          // subscriber.unsubscribe();
          subscriber.next('SSE_END_OF_STREAM');
          subscriber.complete();
          res.end();
        })
        .catch((error) => {
          // console.log('errror xxx');
          subscriber.error(error);
          res.end();
        });
    }).pipe(
      map(
        (data) =>
          ({
            type: 'message',
            data: data,
          }) as MessageEvent,
      ),
    );
  }
}
