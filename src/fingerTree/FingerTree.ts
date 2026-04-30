/**
 * `FingerTree<V, A>` — Hinze & Paterson 2-3 finger tree.
 *
 * 👉 You implement this file. See {@link ../../TASK.md TASK.md} §3.1 for the
 * required public API (every name imported by `FingerTree.test.ts` and
 * `FingerTree.bench.ts` must be exported from here).
 *
 * Read freely:
 *   - `src/internal/fingerTree/**` — type IDs, `Affix` / `Node` algebra, predicates.
 *     Import the *types* and *predicates* (`isEmpty`, `isSingle`, `isDeep`).
 *     **Do not** copy the algorithms (`pushLeft`, `pushRight`, `viewLeft`,
 *     `viewRight`, `app3`, `splitTree`, …) — we will diff.
 *   - `src/utils/monoids.ts` (importable as `@monoids`).
 *   - `src/utils/trampoline.ts` (importable as `@trampoline`) — wrap recursive
 *     functions with `Trampoline.trampoline` and chain with `Trampoline.flatMap`.
 *
 * Reference paper: Hinze & Paterson, *Finger Trees: A Simple General-Purpose
 * Data Structure*, JFP 16(2), 2006.
 * https://www.staff.city.ac.uk/~ross/papers/FingerTree.pdf
 */
import * as O from "effect/Option";
import type {
  FingerTree as FT,
  Split as Sp,
} from "../internal/fingerTree/FingerTree.ts";
import type { Measured } from "@monoids";

const NOT_IMPLEMENTED = (name: string): never => {
  throw new Error(
    `FingerTree.${name} is not implemented yet. See TASK.md §3.1 and Hinze & Paterson §3.`,
  );
};

// Re-export the type so consumers can `import type { FingerTree } from "./FingerTree.ts"`.
export type FingerTree<V, A> = FT<V, A>;
export type Split<V, A> = Sp<V, A>;

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------
export const empty = <V, A>(_m: Measured<A, V>): FingerTree<V, A> =>
  NOT_IMPLEMENTED("empty");
export const single = <V, A>(_m: Measured<A, V>, _value: A): FingerTree<V, A> =>
  NOT_IMPLEMENTED("single");
export const fromArray = <V, A>(
  _xs: ReadonlyArray<A>,
  _m: Measured<A, V>,
): FingerTree<V, A> => NOT_IMPLEMENTED("fromArray");

// ---------------------------------------------------------------------------
// Cons / Snoc / Views
// ---------------------------------------------------------------------------
export const prepend = <V, A>(_t: FingerTree<V, A>, _x: A): FingerTree<V, A> =>
  NOT_IMPLEMENTED("prepend");
export const append = <V, A>(_t: FingerTree<V, A>, _x: A): FingerTree<V, A> =>
  NOT_IMPLEMENTED("append");

export const head = <V, A>(_t: FingerTree<V, A>): O.Option<A> =>
  NOT_IMPLEMENTED("head");
export const last = <V, A>(_t: FingerTree<V, A>): O.Option<A> =>
  NOT_IMPLEMENTED("last");
export const tail = <V, A>(_t: FingerTree<V, A>): O.Option<FingerTree<V, A>> =>
  NOT_IMPLEMENTED("tail");
export const init = <V, A>(_t: FingerTree<V, A>): O.Option<FingerTree<V, A>> =>
  NOT_IMPLEMENTED("init");

// ---------------------------------------------------------------------------
// Concat & Split  (the two operations that justify finger trees)
// ---------------------------------------------------------------------------
export const concat = <V, A>(
  _l: FingerTree<V, A>,
  _r: FingerTree<V, A>,
): FingerTree<V, A> => NOT_IMPLEMENTED("concat");

export const split = <V, A>(
  _predicate: (v: V) => boolean,
  _start: V,
  _t: FingerTree<V, A>,
): O.Option<Split<V, A>> => NOT_IMPLEMENTED("split");

// ---------------------------------------------------------------------------
// Higher-order traversals
// ---------------------------------------------------------------------------
export const map = <V, A, B>(
  _t: FingerTree<V, A>,
  _f: (a: A) => B,
  _m: Measured<B, V>,
): FingerTree<V, B> => NOT_IMPLEMENTED("map");

export const foldl = <V, A, B>(
  _f: (acc: B, a: A) => B,
  _init: B,
  _t: FingerTree<V, A>,
): B => NOT_IMPLEMENTED("foldl");

export const foldr = <V, A, B>(
  _f: (a: A, acc: B) => B,
  _init: B,
  _t: FingerTree<V, A>,
): B => NOT_IMPLEMENTED("foldr");
