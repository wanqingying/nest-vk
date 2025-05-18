
export async function batchFn(
  fns: (() => Promise<any>)[],
  _limit: number = 50,
) {
  const results: any[] = [];
  let running = 0;
  const tasks = Array.from(fns);
  const limit = Math.min(_limit, fns.length);

  return new Promise((resolve) => {
    function run() {
      while (running < limit && tasks.length) {
        const index = fns.length - tasks.length;
        const fn = tasks.shift();
        running++;
        fn()
          .then((res) => {
            results[index] = res;
          })
          .finally(() => {
            running--;
            if (tasks.length === 0 && running === 0) {
              resolve(results);
            } else {
              run();
            }
          });
      }
      if (tasks.length === 0 && running === 0) {
        resolve(results);
      }
    }

    run();
  });
}
