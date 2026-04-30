import { describe, expect, it } from "vitest";
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
import type { Measured } from "@monoids";
import { Option } from "effect";
import {
  isDeep,
  isEmpty,
  isSingle,
} from "../internal/fingerTree/FingerTree.ts";
const sumMeasured: Measured<number, number> = {
  empty: 0,
  combine: (a, b) => a + b,
  measure: (a) => a,
  combineAll: function (): number {
    throw new Error("Function not implemented.");
  },
  combineMany: function (): number {
    throw new Error("Function not implemented.");
  },
};

describe("FingerTree", () => {
  describe("empty", () => {
    it("should create an empty tree", () => {
      const tree = empty(sumMeasured);
      expect(isEmpty(tree)).toBe(true);
      expect(tree.toList()).toEqual([]);
    });
  });

  describe("single", () => {
    it("should create a single-element tree", () => {
      const tree = single(sumMeasured, 42);
      expect(isSingle(tree)).toBe(true);
      expect(tree.toList()).toEqual([42]);
    });
  });

  describe("prepend", () => {
    it("should prepend to an empty tree", () => {
      const tree = prepend(empty(sumMeasured), 1);
      expect(isSingle(tree)).toBe(true);
      expect(tree.toList()).toEqual([1]);
    });

    it("should prepend to a single tree", () => {
      const tree = prepend(single<number, number>(sumMeasured, 2), 1);
      expect(isDeep(tree)).toBe(true);
      expect(tree.toList()).toEqual([1, 2]);
    });

    it("should prepend multiple elements", () => {
      let tree = empty(sumMeasured);
      tree = prepend(tree, 3);
      tree = prepend(tree, 2);
      tree = prepend(tree, 1);
      expect(tree.toList()).toEqual([1, 2, 3]);
    });
  });

  describe("append", () => {
    it("should append to an empty tree", () => {
      const tree = append(empty(sumMeasured), 1);
      expect(isSingle(tree)).toBe(true);
      expect(tree.toList()).toEqual([1]);
    });

    it("should append to a single tree", () => {
      const tree = append(single<number, number>(sumMeasured, 1), 2);
      expect(isDeep(tree)).toBe(true);
      expect(tree.toList()).toEqual([1, 2]);
    });

    it("should append multiple elements", () => {
      let tree = empty(sumMeasured);
      tree = append(tree, 1);
      tree = append(tree, 2);
      tree = append(tree, 3);
      expect(tree.toList()).toEqual([1, 2, 3]);
    });
  });

  describe("concat", () => {
    it("should concatenate two empty trees", () => {
      const tree = concat(empty(sumMeasured), empty(sumMeasured));
      expect(isEmpty(tree)).toBe(true);
    });

    it("should concatenate empty and non-empty trees", () => {
      const tree = concat(
        empty(sumMeasured),
        single<number, number>(sumMeasured, 1),
      );
      expect(tree.toList()).toEqual([1]);
    });

    it("should concatenate two non-empty trees", () => {
      const tree1 = fromArray([1, 2, 3], sumMeasured);
      const tree2 = fromArray([3, 4], sumMeasured);
      const result = concat(tree1, tree2);
      expect(result.toList()).toEqual([1, 2, 3, 3, 4]);
    });

    it("should concatenate trees with affixes that sum to length 7", () => {
      let tree1 = empty(sumMeasured);
      for (let i = 1; i <= 5; i++) tree1 = append(tree1, i);
      let tree2 = empty(sumMeasured);
      for (let i = 6; i <= 10; i++) tree2 = append(tree2, i);
      const result = concat(tree1, tree2);
      expect(result.toList()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it("should concatenate two large trees (500 elements each)", () => {
      const leftArray = Array.from({ length: 500 }, (_, i) => i);
      const rightArray = Array.from({ length: 500 }, (_, i) => i + 500);
      const tree1 = fromArray(leftArray, sumMeasured);
      const tree2 = fromArray(rightArray, sumMeasured);
      const result = concat(tree1, tree2);
      expect(result.toList()).toEqual([...leftArray, ...rightArray]);
    });

    it("should concatenate with middle elements of length 7", () => {
      const tree1 = fromArray([1, 2], sumMeasured);
      const tree2 = fromArray([4, 5], sumMeasured);
      const mid = [3, 3, 3, 3, 3];
      const result = concat(tree1, tree2, mid);
      expect(result.toList()).toEqual([1, 2, 3, 3, 3, 3, 3, 4, 5]);
    });
  });

  describe("split", () => {
    it("should split at accumulated measure", () => {
      const tree = fromArray([1, 2, 3], sumMeasured);
      const splitResult = split((v) => v >= 3, 0, tree);
      expect(splitResult.pipe(Option.getOrThrow).left.toList()).toEqual([1]);
      expect(splitResult.pipe(Option.getOrThrow).value).toBe(2);
      expect(splitResult.pipe(Option.getOrThrow).right.toList()).toEqual([3]);
    });

    it("should split at end of prefix in a deep tree", () => {
      const tree = fromArray([1, 2, 3, 4, 5], sumMeasured); // Becomes deep with >4 elements
      const splitResult = split((v) => v > 10, 0, tree); // Sum = 15, split after prefix
      expect(splitResult.pipe(Option.getOrThrow).left.toList()).toEqual([
        1,
        2,
        3,
        4,
      ]);
      expect(splitResult.pipe(Option.getOrThrow).value).toBe(5);
      expect(splitResult.pipe(Option.getOrThrow).right.toList()).toEqual([]);
    });

    it("should split large tree at accumulated sum > 500", () => {
      const array = Array.from({ length: 1000 }, (_, i) => i); // 0 to 999
      const tree = fromArray(array, sumMeasured);
      const splitResult = split((v) => v > 500, 0, tree);
      const sumBefore = splitResult.pipe(Option.getOrThrow).left.toList()
        .reduce(
          (a, b) => a + b,
          0,
        );
      expect(sumBefore).toBeLessThanOrEqual(500);
      expect(sumBefore + splitResult.pipe(Option.getOrThrow).value)
        .toBeGreaterThan(500);
    });

    it("should split at beginning of suffix in a deep tree", () => {
      const tree = fromArray([1, 2, 3, 4, 5], sumMeasured);
      const splitResult = split((v) => v > 1, 0, tree); // Split after 1
      expect(splitResult.pipe(Option.getOrThrow).left.toList()).toEqual([1]);
      expect(splitResult.pipe(Option.getOrThrow).value).toBe(2);
      expect(splitResult.pipe(Option.getOrThrow).right.toList()).toEqual([
        3,
        4,
        5,
      ]);
    });

    it("should handle repeated splits without losing elements", () => {
      const tree = fromArray([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], sumMeasured);
      let currentTree = tree;
      const allElements = [];

      for (let threshold = 1; threshold <= 10; threshold += 2) {
        const splitResult = split((v) => v >= threshold, 0, currentTree);
        if (Option.isNone(splitResult)) break;
        const result = splitResult.value;
        allElements.push(...result.left.toList(), result.value);
        currentTree = result.right;
      }

      allElements.push(...currentTree.toList());
      allElements.sort((a, b) => a - b);
      expect(allElements).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
  });

  describe("map", () => {
    it("should map elements", () => {
      const tree = fromArray([1, 2, 3], sumMeasured);
      const mapped = map(tree, (x) => x * 2, sumMeasured);
      expect(mapped.toList()).toEqual([2, 4, 6]);
    });
  });

  describe("folding", () => {
    it("should fold right", () => {
      const tree = fromArray([1, 2, 3], sumMeasured);
      const result = foldr((a, b) => a - b, 0, tree);
      expect(result).toBe(1 - (2 - (3 - 0))); // 1 - (2 -3) = 1 - (-1) = 2
    });

    it("should fold left", () => {
      const tree = fromArray([1, 2, 3], sumMeasured);
      const result = foldl((a, b) => a - b, 0, tree);
      expect(result).toBe(((0 - 1) - 2) - 3); // -6
    });
  });

  describe("head", () => {
    it("returns None on empty", () => {
      expect(Option.isNone(head(empty(sumMeasured)))).toBe(true);
    });
    it("returns the only value of a single tree", () => {
      expect(Option.getOrThrow(head(single(sumMeasured, 42)))).toBe(42);
    });
    it("returns the leftmost value of a deep tree", () => {
      const tree = fromArray([1, 2, 3, 4, 5, 6, 7, 8], sumMeasured);
      expect(Option.getOrThrow(head(tree))).toBe(1);
    });
  });

  describe("last", () => {
    it("returns None on empty", () => {
      expect(Option.isNone(last(empty(sumMeasured)))).toBe(true);
    });
    it("returns the only value of a single tree", () => {
      expect(Option.getOrThrow(last(single(sumMeasured, 42)))).toBe(42);
    });
    it("returns the rightmost value of a deep tree", () => {
      const tree = fromArray([1, 2, 3, 4, 5, 6, 7, 8], sumMeasured);
      expect(Option.getOrThrow(last(tree))).toBe(8);
    });
  });

  describe("tail", () => {
    it("returns None on empty", () => {
      expect(Option.isNone(tail(empty(sumMeasured)))).toBe(true);
    });
    it("returns an empty tree for a single", () => {
      const t = Option.getOrThrow(tail(single(sumMeasured, 42)));
      expect(isEmpty(t)).toBe(true);
    });
    it("drops the leftmost element of a deep tree", () => {
      const tree = fromArray([1, 2, 3, 4, 5, 6, 7, 8], sumMeasured);
      const t = Option.getOrThrow(tail(tree));
      expect(t.toList()).toEqual([2, 3, 4, 5, 6, 7, 8]);
    });
    it("repeated tails consume the whole tree", () => {
      let t: ReturnType<typeof empty<number, number>> = fromArray(
        [1, 2, 3, 4, 5],
        sumMeasured,
      );
      for (let i = 0; i < 5; i++) {
        const next = tail(t);
        expect(Option.isSome(next)).toBe(true);
        t = Option.getOrThrow(next);
      }
      expect(isEmpty(t)).toBe(true);
    });
  });

  describe("init", () => {
    it("returns None on empty", () => {
      expect(Option.isNone(init(empty(sumMeasured)))).toBe(true);
    });
    it("returns an empty tree for a single", () => {
      const t = Option.getOrThrow(init(single(sumMeasured, 42)));
      expect(isEmpty(t)).toBe(true);
    });
    it("drops the rightmost element of a deep tree", () => {
      const tree = fromArray([1, 2, 3, 4, 5, 6, 7, 8], sumMeasured);
      const t = Option.getOrThrow(init(tree));
      expect(t.toList()).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
    it("repeated inits consume the whole tree", () => {
      let t: ReturnType<typeof empty<number, number>> = fromArray(
        [1, 2, 3, 4, 5],
        sumMeasured,
      );
      for (let i = 0; i < 5; i++) {
        const next = init(t);
        expect(Option.isSome(next)).toBe(true);
        t = Option.getOrThrow(next);
      }
      expect(isEmpty(t)).toBe(true);
    });
  });
});
