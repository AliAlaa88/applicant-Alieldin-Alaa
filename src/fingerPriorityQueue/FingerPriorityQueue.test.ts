/**
 * Vitest suite for `FingerPriorityQueue`. **You write this file.**
 *
 * Model it after `src/fingerTree/FingerTree.test.ts`. Cover at minimum:
 *   - empty / fromArray / push / pop / peek / size;
 *   - max-priority queue and min-priority queue (reverse the `Order<P>`);
 *   - FIFO order among equal priorities;
 *   - immutability (popping does not mutate the source);
 *   - `pop` on an empty queue returns `Option.none`;
 *   - large-scale (≥ 5 000 elements) reinsertion does not lose elements;
 *   - `Inspectable` surface (`toJSON`, `toString`, `[NodeInspectSymbol]`, `pipe`).
 *
 * Coverage target (per `vitest.config.ts`): ≥ 90 % lines / 75 % branches.
 */
import { describe, expect, it } from "vitest";
import {
  empty,
  fromArray,
  peek,
  pop,
  push,
  size,
} from "./FingerPriorityQueue.ts";
import * as Order from "effect/Order";
import * as O from "effect/Option";

const numberOrder = Order.number;
const emptyPrio = -Infinity;

describe("FingerPriorityQueue", () => {
  describe("empty", () => {
    it("should create an empty queue", () => {
      const q = empty(numberOrder, emptyPrio);
      expect(size(q)).toBe(0);
      expect(O.isNone(peek(q))).toBe(true);
    });
  });

  describe("fromArray", () => {
    it("should build a queue from an array of prioritized items", () => {
      const items = [
        { priority: 2, item: "B" },
        { priority: 3, item: "C" },
        { priority: 1, item: "A" },
      ];
      const q = fromArray(items, numberOrder, emptyPrio);
      expect(size(q)).toBe(3);
      expect(O.getOrThrow(peek(q)).item).toBe("C");
    });
  });

  describe("push / peek", () => {
    it("should return the item with the highest priority", () => {
      let q = empty<number, string>(numberOrder, emptyPrio);
      q = push(q, "low", 1);
      q = push(q, "high", 10);
      q = push(q, "mid", 5);

      const top = O.getOrThrow(peek(q));
      expect(top.item).toBe("high");
      expect(top.priority).toBe(10);
    });

    it("should handle pushing elements with the same priority", () => {
      let q = empty<number, string>(numberOrder, emptyPrio);
      q = push(q, "a", 5);
      q = push(q, "b", 5);
      expect(size(q)).toBe(2);
      expect(O.getOrThrow(peek(q)).priority).toBe(5);
    });
  });

  describe("pop", () => {
    it("should return the value and a new queue", () => {
      const q1 = fromArray(
        [{ priority: 10, item: "A" }, { priority: 5, item: "B" }],
        numberOrder,
        emptyPrio,
      );

      const [val, q2] = O.getOrThrow(pop(q1));

      expect(val.item).toBe("A");
      expect(size(q2)).toBe(1);
      expect(size(q1)).toBe(2);
    });

    it("should return the oldest item first when priorities are equal", () => {
      let q = empty<number, string>(numberOrder, emptyPrio);
      q = push(q, "first", 10);
      q = push(q, "second", 10);
      q = push(q, "third", 10);

      const [v1, q1] = O.getOrThrow(pop(q));
      const [v2, q2] = O.getOrThrow(pop(q1));
      const [v3] = O.getOrThrow(pop(q2));

      expect(v1.item).toBe("first");
      expect(v2.item).toBe("second");
      expect(v3.item).toBe("third");
    });

    it("should return O.none when popping an empty queue", () => {
      const q = empty(numberOrder, emptyPrio);
      expect(O.isNone(pop(q))).toBe(true);
    });
  });
});
