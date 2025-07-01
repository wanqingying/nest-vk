import { Injectable } from '@nestjs/common';

@Injectable()
export class HeroService {
  create(createHeroDto: any) {
    return 'This action adds a new hero';
  }

  findAll() {
    return `This action returns all hero`;
  }

  findOne(id: number) {
    return `This action returns a #${id} hero`;
  }

  update(id: number, updateHeroDto: any) {
    return `This action updates a #${id} hero`;
  }

  remove(id: number) {
    return `This action removes a #${id} hero`;
  }
}
