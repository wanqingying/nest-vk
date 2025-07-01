import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MathService } from './math.service';

@Controller()
export class MathController {
  constructor(private readonly mathService: MathService) {}

  @MessagePattern('createMath')
  create(@Payload() createMathDto: any) {
    return this.mathService.create(createMathDto);
  }

  @MessagePattern('findAllMath')
  findAll() {
    return this.mathService.findAll();
  }

  @MessagePattern('findOneMath')
  findOne(@Payload() id: number) {
    return this.mathService.findOne(id);
  }

  @MessagePattern('updateMath')
  update(@Payload() updateMathDto: any) {
    return this.mathService.update(updateMathDto.id, updateMathDto);
  }

  @MessagePattern('removeMath')
  remove(@Payload() id: number) {
    return this.mathService.remove(id);
  }
}
