import 'reflect-metadata';

// 参数转换装饰器
function transform(transformFn: (value: any) => any) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    const existingTransforms =
      Reflect.getMetadata('transforms', target, propertyKey) || new Map();
    existingTransforms.set(parameterIndex, transformFn);
    Reflect.defineMetadata(
      'transforms',
      existingTransforms,
      target,
      propertyKey,
    );
  };
}
const StatSigSymbol = Symbol('StatsigConfig');

interface InjectConfig {
  index: number;
  getStatMeta: (...args: any[]) => GetStatConfig;
}

function StatSigConfig(getUser: Function) {
  return function (
    target: any,
    propertyKey: string | symbol,
    parameterIndex: number,
  ) {
    Reflect.defineMetadata(
      StatSigSymbol,
      { index: parameterIndex, getUser },
      target,
      propertyKey,
    );
  };
}

interface GetStatConfig {
  layers: string[];
  userId: string;
}

// 方法装饰器，执行转换
function transformMethod(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const transforms =
      Reflect.getMetadata('transforms', target, propertyKey) || new Map();

    // 转换参数
    for (const [index, transformFn] of transforms) {
      args[index] = transformFn(args[index]);
    }

    return originalMethod.apply(this, args);
  };
}

async function getConfig(meta: GetStatConfig) {
  return Promise.resolve({
    layers: meta.layers,
    userId: meta.userId,
    version: 'v1',
  });
}

function AutoStatsigConfig(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;
  descriptor.value = async function (...args: any[]) {
    const statsigConfig: InjectConfig = Reflect.getMetadata(
      StatSigSymbol,
      target,
      propertyKey,
    );
    if (statsigConfig) {
      const { index, getStatMeta } = statsigConfig;
      const meta = getStatMeta(...args);
      const config = await getConfig(meta);
      args[index] = config;
    }

    return originalMethod.apply(this, args);
  };
}

class DataService {
  @transformMethod
  processData(
    @transform((value: string) => value.toUpperCase()) name: string,
    @transform((value: string) => parseInt(value)) ageStr: string,
    @transform((value: string) => JSON.parse(value)) jsonData: string,
    @StatSigConfig((user) => ({
      userId: user,
    }))
    config?: any,
  ) {
    console.log('config processData', config);
    return {
      name,
      age: ageStr,
      data: jsonData,
    };
  }
}

// 使用示例
const service = new DataService();
const result = service.processData('john doe', '30', '{"key": "value"}');
console.log(result);
