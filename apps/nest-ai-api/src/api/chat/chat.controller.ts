import { Controller, Query, Sse, Res } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { PassThrough, pipeline, Transform } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

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
  constructor(private readonly chatService: ChatService) {}

  async getHello(@Query() q: any) {
    return this.chatService.aiChatHelloV2(q?.txt || 'hello');
  }

  @Sse('/sse-chat')
  getHelloV2(@Query() q: any): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      this.chatService
        .aiChatHelloV3(
          q?.txt ||
            'how to learn nodejs? please give a tutorial in 100 words and 5 steps.',
        )
        .then(async (stream) => {
          for await (const chunk of stream) {
            const txt = chunk.choices[0]?.delta?.content || '';
            console.log('next', chunk.choices[0]?.delta?.content || '');
            console.log('data', chunk);
            subscriber.next(txt);
          }
          // subscriber.unsubscribe();
          subscriber.next('SSE_END_OF_STREAM');
          subscriber.complete();
        })
        .catch((error) => {
          // console.log('errror xxx');
          subscriber.error(error);
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

  @Sse('/sse-chat-v2')
  getHelloV3(@Query() q: any, @Res() res: Response): Observable<void> {
    return new Observable((subscriber) => {
      const passThrough = new PassThrough();

      // 设置响应头
      // res.setHeader('Content-Type', 'text/event-stream');
      // res.setHeader('Cache-Control', 'no-cache');
      // res.setHeader('Connection', 'keep-alive');
      // res.setHeader('Access-Control-Allow-Origin', '*');
      // res.flushHeaders(); // 立即发送响应头

      // 将 PassThrough 流管道到响应
      passThrough.pipe(res);

      this.chatService
        .aiChatHelloV3(
          q?.txt ||
            'how to learn nodejs? please give a tutorial in 100 words and 5 steps.',
        )
        .then(async (stream) => {
          try {
            await pipelineAsync(
              stream,
              new Transform({
                objectMode: true,
                transform(chunk, encoding, callback) {
                  const txt = chunk.choices[0]?.delta?.content || '';
                  if (txt) {
                    this.push(`data: ${txt}\n\n`);
                  } else {
                  }
                  callback();
                },
              }),
              passThrough,
            ).then(() => {
              console.log('end of stream');
              passThrough.write('data: SSE_END_OF_STREAM\n\n');
              passThrough.end();
              subscriber.complete();
            });
            console.log('end of stream');
            // 发送 END_OF_STREAM 消息
            passThrough.write('data: SSE_END_OF_STREAM\n\n');
            passThrough.end();
            subscriber.complete();
          } catch (error) {
            passThrough.write(`data: ERROR\n\n`);
            passThrough.end();
            subscriber.error(error);
          }
        })
        .catch((error) => {
          passThrough.write(`data: ERROR\n\n`);
          passThrough.end();
          subscriber.error(error);
        });

      // 当订阅者取消订阅时，关闭 PassThrough 流
      return () => {
        passThrough.end();
      };
    });
  }
}
