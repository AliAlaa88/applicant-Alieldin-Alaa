/**
 * `FingerTreeIterator<V, A>` — a left-to-right iterator over a `FingerTree`.
 *
 * 👉 You implement this file. The internal `FingerTree` impl classes already
 * call `new FingerTreeIterator(this)` from their `Symbol.iterator` method —
 * once you ship this, every tree becomes iterable via `for...of` and
 * `[...tree]` automatically.
 *
 * Implementation hint: this is a one-screen exercise once `head` and `tail`
 * are working. Each `next()` call returns `head(current)` and advances
 * `current` to `tail(current)`; you're done when the tree is empty. No
 * recursion, no internal-AST walking — just chain your own public viewing
 * primitives. (You may, of course, choose a different strategy — but this is
 * the one we're optimising for in the spec.)
 *
 * The interface to satisfy:
 *
 *   - `next(): IteratorResult<A>` — yields the next element from the left.
 *   - `[Symbol.iterator]()` — returns `this` (an iterator that is also
 *     `Iterable` is the convention for `IterableIterator`).
 */
import * as O from "effect/Option";
import { type FingerTree, head, tail } from "./FingerTree.ts";

export class FingerTreeIterator<V, A> implements IterableIterator<A> {
  private current: FingerTree<V, A>;

  constructor(_tree: FingerTree<V, A>) {
    this.current = _tree;
  }

  next(): IteratorResult<A> {
    const h = head(this.current);
    
    if (O.isNone(h)) {
      return { value: undefined, done: true };
    }

    const t = tail(this.current);
    if (O.isSome(t)) {
      this.current = t.value;
    }

    return { value: h.value, done: false };
  }

  [Symbol.iterator](): IterableIterator<A> {
    return this;
  }
}
