import { inspect } from 'node:util';
//   @HttpWrap()
//   @Get()
//   test() {
// 	const t1 = Date.now();
// 	for (let i = 0; i < 100000; i++) {
// 	  this.array.push('empty_str_' + i);
// 	}
// 	let ik = 0;
// 	for (let i = 0; i < 10000000; i++) {
// 	  ik += 1;
// 	}
// 	countTest(1, { method: 'get', path: 'health' });
// 	return Date.now() - t1;
//   }

export function HttpWrap(): MethodDecorator {
  return (
    _target: object,
    _key: string,
    descriptor: TypedPropertyDescriptor<any>,
  ): any => {
    console.log('target  ', inspect(_target, true, 3));
    console.log('key ', _key);
    const original = descriptor.value! as Function;
    descriptor.value = function (this: any, ...args: any[]) {
      const res = original.apply(this, args);
      return res + 'ok';
    };
    Reflect.getMetadataKeys(original).forEach((key) => {
      const value = Reflect.getMetadata(key, original);
      console.log('copy metadata', key, value);
      Reflect.defineMetadata(key, value, descriptor.value);
    });
    return descriptor;
  };
}
