import { Controller, Get, Query, Sse, MessageEvent } from '@nestjs/common';
import { ChatService } from './chat.service';
import { interval, map, Observable, from } from 'rxjs';

@Controller('chat')
export class ChatController {
  constructor(
    // service
    private readonly chatService: ChatService,
  ) {}

  @Get('/hello')
  async getHello(@Query() q: any) {
    return this.chatService.aiChatHelloV2(q?.txt || 'hello');
  }
  // @Sse('sse')
  // sse(): Observable<MessageEvent> {
  //   let i = 0;
  //   return interval(1000).pipe(
  //     map((_) => {
  //       i++;
  //       return { data: { hello: 'world-' + i } } as MessageEvent;
  //     }),
  //   );
  // }
  @Sse('/sse-chat')
  async getHelloV2(@Query() q: any): Promise<Observable<MessageEvent>> {
    const p = await this.chatService.aiChatHelloV3(
      q?.txt || 'how to learn nodejs?',
    );

    return from(p).pipe(
      map((chunk) => {
        // console.log('data stream ', v);
        return {
          data: chunk?.choices[0]?.delta?.content || '',
        } as MessageEvent;
      }),
    );
  }
}
