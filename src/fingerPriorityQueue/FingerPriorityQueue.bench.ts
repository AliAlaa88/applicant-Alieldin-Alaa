/**
 * Deno bench suite for `FingerPriorityQueue`. **You write this file.**
 *
 * Model it after `src/fingerTree/FingerTree.bench.ts`. At minimum:
 *   - benchmark `push` and `pop` for sizes 1 000, 10 000, 100 000;
 *   - compare against a baseline (a sorted `Array` PQ is fine);
 *   - mark the FingerPriorityQueue benches `baseline: true` within each group
 *     so Deno reports the relative speed-up;
 *   - seed your random data so runs are reproducible (`Math.random()` ≠ science).
 *
 * Run with:  `deno task benchmark:fingerPriorityQueue`
 */

import * as Order from "effect/Order";
import * as O from "effect/Option";
import { empty, fromArray, pop, push } from "./FingerPriorityQueue.ts";
import type {
  FingerPriorityQueue,
  Prioritized,
} from "../internal/fingerPriorityQueue/FingerPriorityQueue.ts";

const numberOrder = Order.number;
const emptyPrio = -Infinity;
const sizes = [1_000, 10_000, 100_000];

const seed = (s: number) => {
  let t = s;
  return () => {
    t ^= t << 13;
    t ^= t >> 17;
    t ^= t << 5;
    return (t >>> 0) / 0xffffffff;
  };
};

type Item = Prioritized<number, number>;

const arrayPush = (arr: Item[], item: number, priority: number): Item[] => {
  const next = [...arr, { priority, item }];
  next.sort((a, b) => a.priority - b.priority); // ascending; highest at end
  return next;
};

const arrayPop = (arr: Item[]): [Item, Item[]] | undefined => {
  if (arr.length === 0) return undefined;
  const next = arr.slice();
  const top = next.pop()!;
  return [top, next];
};

type TestData = {
  queue: FingerPriorityQueue<number, number>;
  queueMinus1: FingerPriorityQueue<number, number>;
  items: Item[];
  itemsMinus1: Item[];
};

const generateTestData = (size: number): TestData => {
  const items: Item[] = Array.from({ length: size }, (_, i) => ({
    priority: Math.floor(seed(42)() * size),
    item: i,
  }));
  const itemsMinus1 = items.slice(0, size - 1);
  return {
    queue: fromArray(items, numberOrder, emptyPrio),
    queueMinus1: fromArray(itemsMinus1, numberOrder, emptyPrio),
    items,
    itemsMinus1,
  };
};

const testData = new Map<number, TestData>();
for (const size of sizes) {
  testData.set(size, generateTestData(size));
}

for (const size of sizes) {
  const data = testData.get(size)!;
  const lastItem = data.items[size - 1];
  Deno.bench({
    name: `FingerPriorityQueue::empty ${size}`,
    group: `empty_${size}`,
    baseline: true,
    fn: () => {
      empty(numberOrder, emptyPrio);
    },
  });

  Deno.bench({
    name: `FingerPriorityQueue::fromArray ${size}`,
    group: `fromArray_${size}`,
    baseline: true,
    fn: () => {
      fromArray(data.items, numberOrder, emptyPrio);
    },
  });

  Deno.bench({
    name: `FingerPriorityQueue::push ${size}`,
    group: `push_${size}`,
    baseline: true,
    fn: () => {
      push(data.queueMinus1, lastItem.item, lastItem.priority);
    },
  });

  Deno.bench({
    name: `FingerPriorityQueue::pop ${size}`,
    group: `pop_${size}`,
    baseline: true,
    fn: () => {
      O.getOrThrow(pop(data.queue));
    },
  });

  Deno.bench({
    name: `Array::push ${size}`,
    group: `push_${size}`,
    fn: () => {
      arrayPush(data.itemsMinus1, lastItem.item, lastItem.priority);
    },
  });

  Deno.bench({
    name: `Array::pop ${size}`,
    group: `pop_${size}`,
    fn: () => {
      arrayPop(data.items);
    },
  });
}
