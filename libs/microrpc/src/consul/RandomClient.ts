import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RandomClientService {
  private clients: ClientProxy[];

  constructor(
    @Inject('MATH_SERVICE_0') private mathService0: ClientProxy,
    @Inject('MATH_SERVICE_1') private mathService1: ClientProxy,
    // ... add more clients as needed
  ) {
    this.clients = [this.mathService0, this.mathService1 /*, add more clients here */];
  }

  getRandomClient(): ClientProxy {
    const randomIndex = Math.floor(Math.random() * this.clients.length);
    return this.clients[randomIndex];
  }
}