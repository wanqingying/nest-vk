import { Injectable } from '@nestjs/common';
import { AService } from '../modulea/a.service';

@Injectable()
export class BService {
  constructor(private readonly aService: AService) {}

  useAService() {
    return this.aService.getHello();
  }
}