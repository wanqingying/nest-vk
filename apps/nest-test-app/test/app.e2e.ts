import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NestTestAppModule } from '../src/app.module';
import { Server } from 'http';

describe('NestTestAppController (e2e)', () => {
  let app: INestApplication<Server>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NestTestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('health', () => {
    return request(app.getHttpServer()).get('/health').expect(200).expect('ok');
  });
  it('health/test', () => {
    return request(app.getHttpServer()).get('/health/test').expect(200);
  });
});
