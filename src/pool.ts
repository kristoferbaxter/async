import { cpus } from 'os';

const resolved = Promise.resolve();

export async function pool<R, T>(
  items: Array<R>,
  iteratorFn: (item: R, items: Array<R>) => T,
  concurrency: number = cpus().length,
): Promise<Array<Awaited<T>>> {
  const itemsLength: number = items.length;
  const returnable: Array<Promise<T>> = [];
  const executing: Array<Promise<T>> = [];

  for (const item of items) {
    const promise: Promise<T> = resolved.then(() => iteratorFn(item, items));
    returnable.push(promise);

    if (concurrency <= itemsLength) {
      const execute: any = promise.then(() => executing.splice(executing.indexOf(execute), 1));
      executing.push(execute);
      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }
  }

  return Promise.all(returnable);
}
