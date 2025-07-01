import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  create(createHealthDto: any) {
    return 'This action adds a new health';
  }

  findAll() {
    return `This action returns all health`;
  }

  findOne(id: number) {
    return `This action returns a #${id} health`;
  }

  update(id: number, updateHealthDto: any) {
    return `This action updates a #${id} health`;
  }

  remove(id: number) {
    return `This action removes a #${id} health`;
  }
}
