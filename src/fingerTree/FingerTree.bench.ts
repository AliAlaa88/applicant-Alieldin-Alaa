import type { FingerTree } from "../internal/fingerTree/FingerTree.ts";
import type { Measured } from "@monoids";
import {
  append,
  concat,
  empty,
  foldl,
  foldr,
  fromArray,
  head,
  init,
  last,
  map,
  prepend,
  single,
  split,
  tail,
} from "./FingerTree.ts";
import { Array as Arr } from "effect";
const sizeMonoid: Measured<number, number> = {
  empty: 0,
  measure: () => 1,
  combine: (a, b) => a + b,
  combineAll: () => {
    throw new Error("Not implemented");
  },
  combineMany: () => {
    throw new Error("Not implemented");
  },
};

const sizes = [1_000, 10_000, 100_000];

type TestData = {
  tree: FingerTree<number, number>;
  treeMinus1: FingerTree<number, number>;
  leftTree: FingerTree<number, number>;
  rightTree: FingerTree<number, number>;
  array: number[];
  arrayMinus1: number[];
  leftArray: number[];
  rightArray: number[];
};

const generateTestData = (size: number): TestData => {
  const array = Arr.makeBy(size, (i) => i);
  const arrayMinus1 = Arr.makeBy(size - 1, (i) => i);
  const leftArray = array.slice(0, Math.floor(size / 2));
  const rightArray = array.slice(Math.floor(size / 2));

  return {
    tree: fromArray(array, sizeMonoid),
    treeMinus1: fromArray(arrayMinus1, sizeMonoid),
    leftTree: fromArray(leftArray, sizeMonoid),
    rightTree: fromArray(rightArray, sizeMonoid),
    array,
    arrayMinus1,
    leftArray,
    rightArray,
  };
};

const testData = new Map<number, TestData>();
for (const size of sizes) {
  testData.set(size, generateTestData(size));
}

for (const size of sizes) {
  const data = testData.get(size)!;
  const splitPredicate = (v: number) => v > size / 2;
  Deno.bench({
    name: `FingerTree::empty ${size}`,
    group: `empty_${size}`,
    baseline: true,
    fn: () => {
      empty(sizeMonoid);
    },
  });

  Deno.bench({
    name: `FingerTree::single ${size}`,
    group: `single_${size}`,
    baseline: true,
    fn: () => {
      single(sizeMonoid, 0);
    },
  });

  Deno.bench({
    name: `FingerTree::fromArray ${size}`,
    group: `fromArray_${size}`,
    baseline: true,
    fn: () => {
      fromArray(data.array, sizeMonoid);
    },
  });

  Deno.bench({
    name: `FingerTree::prepend ${size}`,
    group: `prepend_${size}`,
    baseline: true,
    fn: () => {
      prepend(data.treeMinus1, size - 1);
    },
  });

  Deno.bench({
    name: `FingerTree::append ${size}`,
    group: `append_${size}`,
    baseline: true,
    fn: () => {
      append(data.treeMinus1, size - 1);
    },
  });

  Deno.bench({
    name: `FingerTree::head ${size}`,
    group: `head_${size}`,
    baseline: true,
    fn: () => {
      head(data.tree);
    },
  });

  Deno.bench({
    name: `FingerTree::last ${size}`,
    group: `last_${size}`,
    baseline: true,
    fn: () => {
      last(data.tree);
    },
  });

  Deno.bench({
    name: `FingerTree::tail ${size}`,
    group: `tail_${size}`,
    baseline: true,
    fn: () => {
      tail(data.tree);
    },
  });

  Deno.bench({
    name: `FingerTree::init ${size}`,
    group: `init_${size}`,
    baseline: true,
    fn: () => {
      init(data.tree);
    },
  });

  Deno.bench({
    name: `FingerTree::concat ${size}`,
    group: `concat_${size}`,
    baseline: true,
    fn: () => {
      concat(data.leftTree, data.rightTree);
    },
  });

  Deno.bench({
    name: `FingerTree::map ${size}`,
    group: `map_${size}`,
    baseline: true,
    fn: () => {
      map(data.tree, (x) => x * 2, sizeMonoid);
    },
  });

  Deno.bench({
    name: `FingerTree::foldl ${size}`,
    group: `foldl_${size}`,
    baseline: true,
    fn: () => {
      foldl((acc, x) => acc + x, 0, data.tree);
    },
  });

  Deno.bench({
    name: `FingerTree::foldr ${size}`,
    group: `foldr_${size}`,
    baseline: true,
    fn: () => {
      foldr((x, acc) => acc + x, 0, data.tree);
    },
  });

  Deno.bench({
    name: `FingerTree::split ${size}`,
    group: `split_${size}`,
    baseline: true,
    fn: () => {
      split(splitPredicate, 0, data.tree);
    },
  });

  Deno.bench({
    name: `Array::prepend ${size}`,
    group: `prepend_${size}`,
    fn: () => {
      [size - 1, ...data.arrayMinus1];
    },
  });

  Deno.bench({
    name: `Array::append ${size}`,
    group: `append_${size}`,
    fn: () => {
      [...data.arrayMinus1, size - 1];
    },
  });

  Deno.bench({
    name: `Array::head ${size}`,
    group: `head_${size}`,
    fn: () => {
      data.array[0];
    },
  });

  Deno.bench({
    name: `Array::last ${size}`,
    group: `last_${size}`,
    fn: () => {
      data.array[data.array.length - 1];
    },
  });

  Deno.bench({
    name: `Array::tail ${size}`,
    group: `tail_${size}`,
    fn: () => {
      data.array.slice(1);
    },
  });

  Deno.bench({
    name: `Array::init ${size}`,
    group: `init_${size}`,
    fn: () => {
      data.array.slice(0, -1);
    },
  });

  Deno.bench({
    name: `Array::concat ${size}`,
    group: `concat_${size}`,
    fn: () => {
      [...data.leftArray, ...data.rightArray];
    },
  });

  Deno.bench({
    name: `Array::map ${size}`,
    group: `map_${size}`,
    fn: () => {
      data.array.map((x) => x * 2);
    },
  });

  Deno.bench({
    name: `Array::reduce ${size}`,
    group: `foldl_${size}`,
    fn: () => {
      data.array.reduce((acc, x) => acc + x, 0);
    },
  });
}
