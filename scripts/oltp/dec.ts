import { OnModuleInit } from '@nestjs/common';

export function Metric(): MethodDecorator {
  return (
    _target: any,
    _key: string | symbol,
    descriptor: TypedPropertyDescriptor<any>,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: MetricProp, ...args: any[]) {
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

interface MetricProp {
  timeMetricTag: string;
}

class SomeService implements MetricProp {
  timeMetricTag = 'SomeServiceTimeMetricTag';
  private config = {
    delay: 200,
    name: 'sk',
  };

  @Metric()
  async getData(): Promise<string> {
    return Promise.resolve('data');
  }
}

async function main() {
  const service = new SomeService();
  const data = await service.getData();
  console.log(data);
}
main().catch(console.error);
