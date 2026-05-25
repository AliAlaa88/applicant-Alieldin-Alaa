/**
 * `FingerPriorityQueue<P, A>` — a max-priority queue built on top of a
 * measured `FingerTree`, where the monoidal annotation is the priority and
 * `pop` is implemented via `split` against the tree's annotation.
 *
 * 👉 You implement this file. See {@link ../../TASK.md TASK.md} §3.2 for the
 * required public API.
 *
 * Hints:
 *   - Use {@link "@monoids".getPriorityMonoid} to derive the `Measured` instance
 *     from the user-supplied `Order<P>`.
 *   - `peek` / `pop` should `split` on the tree at the maximum priority
 *     (which is the tree's `annotation`). Equal priorities must yield FIFO order.
 *   - The class must implement `Pipeable` and `Inspectable` (Effect interfaces).
 */
import * as O from "effect/Option";
import type { Order } from "effect/Order";

import * as FT from "../fingerTree/FingerTree.ts";
import { getPriorityMonoid } from "../utils/monoids.ts";
import {
  type FingerPriorityQueue,
  FingerPriorityQueueImpl,
  type Prioritized,
} from "../internal/fingerPriorityQueue/FingerPriorityQueue.ts";
// const NOT_IMPLEMENTED = (name: string): never => {
//   throw new Error(
//     `FingerPriorityQueue.${name} is not implemented yet. See TASK.md §3.2.`,
//   );
// };

/**
 * Creates an empty priority queue.
 *
 * @complexity O(1)
 */
export const empty = <P, A>(
  _order: Order<P>,
  _emptyPriority: P,
): FingerPriorityQueue<P, A> =>
  new FingerPriorityQueueImpl(
    FT.empty(getPriorityMonoid<P, Prioritized<P, A>>(_order, _emptyPriority)),
    _order,
    0,
  );

/**
 * Creates a priority queue from an array of items.
 *
 * @complexity O(n)
 */
export const fromArray = <P, A>(
  _xs: ReadonlyArray<Prioritized<P, A>>,
  _order: Order<P>,
  _emptyPriority: P,
): FingerPriorityQueue<P, A> =>
  new FingerPriorityQueueImpl(
    FT.fromArray(
      _xs,
      getPriorityMonoid<P, Prioritized<P, A>>(_order, _emptyPriority),
    ),
    _order,
    _xs.length,
  );

/**
 * Adds an item to the queue.
 *
 * @complexity O(1) amortized
 */
export const push = <P, A>(
  _q: FingerPriorityQueue<P, A>,
  _item: A,
  _priority: P,
): FingerPriorityQueue<P, A> =>
  new FingerPriorityQueueImpl(
    FT.append(_q.tree, { priority: _priority, item: _item }),
    _q.order,
    _q.size + 1,
  );

/**
 * Returns the highest priority item with removing it.
 *
 * @complexity O(log n)
 */
export const pop = <P, A>(
  _q: FingerPriorityQueue<P, A>,
): O.Option<[Prioritized<P, A>, FingerPriorityQueue<P, A>]> =>
  O.map(
    FT.split(
      (v) => _q.order(v, _q.tree.annotation) >= 0,
      _q.tree.m.empty,
      _q.tree,
    ),
    (s) => [
      s.value,
      new FingerPriorityQueueImpl(
        FT.concat(s.left, s.right),
        _q.order,
        _q.size - 1,
      ),
    ],
  );

/**
 * Returns the highest priority item without removing it.
 *
 * @complexity O(log n)
 */
export const peek = <P, A>(
  _q: FingerPriorityQueue<P, A>,
): O.Option<Prioritized<P, A>> =>
  O.map(
    FT.split(
      (v) => _q.order(v, _q.tree.annotation) >= 0,
      _q.tree.m.empty,
      _q.tree,
    ),
    (s) => s.value,
  );

/**
 * Returns the current number of elements in the queue.
 *
 * @complexity O(1)
 */
export const size = <P, A>(_q: FingerPriorityQueue<P, A>): number => _q.size;
