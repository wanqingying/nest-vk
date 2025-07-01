// import './instrument';
import dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

console.log('process env' ,process.env.NODE_ENV);
const port= process.env.PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port).then(()=>{
    console.log(`app listen on ${port} port`);
  })
}
bootstrap();
