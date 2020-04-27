import * as assert from 'assert';
import { pool } from '../../src/pool';

export const tests: Map<string, () => Promise<void>> = new Map([
  [
    'runs as many promises in parallel as specified by concurrency',
    async function () {
      const results: Array<number> = [];
      const timeout = (item: number) =>
        new Promise((resolve) =>
          setTimeout(() => {
            results.push(item);
            resolve();
          }, item),
        );
      await pool([100, 500, 300, 200], timeout, 2);

      assert.deepEqual(results, [100, 300, 500, 200]);
    },
  ],
  [
    'runs all promises in parallel when concurrency is larger than necessary',
    async function () {
      const results: Array<number> = [];
      const timeout = (item: number) =>
        new Promise((resolve) =>
          setTimeout(() => {
            results.push(item);
            resolve();
          }, item),
        );
      await pool([100, 500, 300, 200], timeout, 5);
      assert.deepEqual(results, [100, 200, 300, 500]);
    },
  ],
  [
    'rejects on error (but does not leave unhandled rejections)',
    async function () {
      const timeout = () => Promise.reject();
      assert.rejects(pool([100, 500, 300, 200], timeout, 5));
    },
  ],
]);
