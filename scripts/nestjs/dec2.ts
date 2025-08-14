// 类装饰器定义
function ClassLogger(target: any) {
  console.log(`类装饰器被应用到: ${target.name}`);
  // 可以在这里修改类的原型或添加属性
  target.prototype.createdAt = new Date();
}

// 方法装饰器定义
function MethodLogger(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  console.log(`方法装饰器被应用到: ${target.constructor.name}.${propertyName}`);
  
  const originalMethod = descriptor.value;
  
  // 替换原方法，添加日志功能
  descriptor.value = function (...args: any[]) {
    console.log(`调用方法: ${propertyName}, 参数:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`方法执行完成: ${propertyName}, 返回值:`, result);
    return result;
  };
  
  return descriptor;
}

// 使用装饰器
@ClassLogger
class UserService {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  @MethodLogger
  getName(): string {
    return this.name;
  }

  @MethodLogger
  setName(newName: string): void {
    this.name = newName;
  }

  @MethodLogger
  greet(message: string): string {
    return `${message}, 我是 ${this.name}`;
  }
}

// 测试使用
const user = new UserService("张三");
console.log('创建时间:', (user as any).createdAt);

user.getName();
user.setName("李四");
user.greet("你好");