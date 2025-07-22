import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
  } from '@nestjs/common';
  import { Observable } from 'rxjs';
  import { tap } from 'rxjs/operators';
  import { trace, tracer } from '@libs/utils/src/otlp/sdk'; 
  
  @Injectable()
  export class HttpTraceInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
	  const httpContext = context.switchToHttp();
	  const request = httpContext.getRequest();
	  const response = httpContext.getResponse();

	  const method = request.method;
	  const url = request.url;
  
	  // 创建 trace span
	  return new Observable((observer) => {
		trace(`${method} ${url}`, async (span) => {
		  span.setAttribute('http.method', method);
		  span.setAttribute('http.url', url);
  
		  // 监听响应完成
		  response.on('finish', () => {
			span.setAttribute('http.status_code', response.statusCode);
			span.end();
		  });
  
		  // 继续处理请求
		  next.handle().subscribe({
			next: (value) => observer.next(value),
			error: (err) => {
			  span.setAttribute('http.error', err.message);
			  span.end();
			  observer.error(err);
			},
			complete: () => observer.complete(),
		  });
		});
	  });
	}
  }