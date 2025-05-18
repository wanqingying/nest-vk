import { strict as assert } from 'assert';
import { batchFn } from './batchfn';

async function testBatchFn() {
  console.log('开始测试 batchFn 函数...');

  // 测试1: 验证结果顺序是否正确
  console.log('测试1: 验证结果顺序');
  {
    const delays = [100, 50, 150, 30, 80];
    const fns = delays.map(
      (delay, index) => () =>
        new Promise((resolve) => setTimeout(() => resolve(index), delay)),
    );

    const results = await batchFn(fns, 2);
    assert.deepEqual(results, [0, 1, 2, 3, 4], '结果顺序应与输入顺序一致');
    console.log('✓ 测试1通过: 结果顺序正确');
  }

  // 测试2: 验证并发限制
  console.log('测试2: 验证并发限制');
  {
    let maxConcurrent = 0;
    let currentConcurrent = 0;
    const totalTasks = 20;
    const limit = 5;

    const fns = Array(totalTasks)
      .fill(null)
      .map((_, index) => () => {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);

        return new Promise((resolve) => {
          setTimeout(
            () => {
              currentConcurrent--;
              resolve(index);
            },
            20 + Math.random() * 30,
          );
        });
      });

    await batchFn(fns, limit);
    assert.ok(
      maxConcurrent <= limit,
      `并发数应不超过限制(${limit})，实际最大并发: ${maxConcurrent}`,
    );
    console.log(
      `✓ 测试2通过: 并发限制有效，最大并发: ${maxConcurrent}/${limit}`,
    );
  }

  // 测试4: 空数组处理
  console.log('测试4: 空数组处理');
  {
    console.log('444');
    const results = await batchFn([], 5);
    console.log('results', results);
    assert.deepEqual(results, [], '空数组输入应返回空数组');
    console.log('✓ 测试4通过: 空数组处理正常');
  }

  // 测试5: 验证任务完成释放并发槽位
  console.log('测试5: 验证任务完成释放并发槽位');
  {
    const executionOrder: number[] = [];
    const t1 = Date.now();
    const tasks = Array(10)
      .fill(null)
      .map((_, i) => () => {
        return new Promise<number>((resolve) => {
          // 第一批任务延迟更长，确保第二批任务能在它们完成前启动
          const delay = i < 3 ? 1000 : 10;
          setTimeout(() => {
            console.log('执行任务', i, Date.now() - t1);
            executionOrder.push(i);
            resolve(i);
          }, delay);
        });
      });

    await batchFn(tasks, 4);

    // 验证前几个任务完成后，后续任务能继续进行
    const firstThree = executionOrder.slice(0, 3);
    console.log('firstThree', firstThree);
    assert.ok(
      !firstThree.every((num) => num < 3),
      '应该有后续任务在前三个任务完成之前执行',
    );
    console.log('✓ 测试5通过: 任务完成正确释放并发槽位');
  }

  console.log('所有测试通过! batchFn 函数工作正常。');
}

// 执行测试
testBatchFn().catch((error) => {
  console.error('测试失败:', error);
  process.exit(1);
});
