import { SingleService } from './single.service';
import { ModuleRef } from '@nestjs/core';

export class SingleClsTest {
  private readonly singleService: SingleService;
  constructor(private readonly ref: ModuleRef) {
    this.singleService = this.ref.get(SingleService);
  }

  public test() {
    const result = this.singleService.testSingle();
    console.log('SingleClsTest Result:', result);
  }
}
