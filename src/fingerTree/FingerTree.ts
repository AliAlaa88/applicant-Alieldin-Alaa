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
import {
  DeepImpl,
  EmptyImpl,
  isDeep,
  isEmpty,
  isSingle,
  SingleImpl,
  Split as SplitImpl,
} from "../internal/fingerTree/FingerTree.ts";
import type { Affix, Node } from "../internal/fingerTree/nodes.ts";
import {
  branch2,
  branch3,
  four,
  isBranch3,
  isFour,
  isOne,
  isThree,
  isTwo,
  one,
  three,
  two,
} from "../internal/fingerTree/nodes.ts";
import type { Measured } from "../utils/monoids.ts";
import { flatMap, Trampoline, trampoline } from "../utils/trampoline.ts";

// const NOT_IMPLEMENTED = (name: string): never => {
//   throw new Error(
//     `FingerTree.${name} is not implemented yet. See TASK.md §3.1 and Hinze & Paterson §3.`,
//   );
// };

// Re-export the type so consumers can `import type { FingerTree } from "./FingerTree.ts"`.
export type FingerTree<V, A> = FT<V, A>;
export type Split<V, A> = Sp<V, A>;

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

/**
 * Creates an empty FingerTree.
 *
 * @complexity O(1)
 * @cite Hinze-Paterson §3.1
 */
export const empty = <V, A>(_m: Measured<A, V>): FingerTree<V, A> =>
  new EmptyImpl(_m);

/**
 * Creates a FingerTree with a single element.
 *
 * @complexity O(1)
 * @cite Hinze-Paterson §3.1
 */
export const single = <V, A>(_m: Measured<A, V>, _value: A): FingerTree<V, A> =>
  new SingleImpl(_m, _value);

/**
 * Creates a FingerTree from a ReadonlyArray.
 *
 * @complexity O(n)
 * @cite Hinze-Paterson §3.2 (append)
 */
export const fromArray = <V, A>(
  _xs: ReadonlyArray<A>,
  _m: Measured<A, V>,
): FingerTree<V, A> => _xs.reduce((acc, x) => append(acc, x), empty(_m));

// ---------------------------------------------------------------------------
// Cons / Snoc / Views
// ---------------------------------------------------------------------------
const prependCPS = <V, A>(
  _t: FingerTree<V, A>,
  _x: A,
): Trampoline<FingerTree<V, A>> => {
  if (isEmpty<V, A>(_t)) return single(_t.m, _x);

  if (isSingle<V, A>(_t)) { // make a deep tree with one pre and one suf and empty deeper
    const p = one<V, A>(_t.m, _x);
    const s = one<V, A>(_t.m, _t.value);
    const ann = _t.m.combine(p.annotation, s.annotation);
    return new DeepImpl<V, A>(
      _t.m,
      ann,
      p,
      empty<V, Node<V, A>>({
        ..._t.m,
        measure: (node: Node<V, A>) => node.annotation,
      }),
      s,
    );
  }

  // this will be common between all upcoming cases
  const newAnno = _t.m.combine(
    _t.m.measure(_x),
    _t.annotation,
  );

  // the prefix is my focus now, either i will add an element to it or handle the full prefix case (isFour)
  const p = _t.prefix;

  if (isFour<V, A>(p)) { // if full prefix, keep the new and first elements then push the rest down the tree as a branch3
    const newPrefix = two<V, A>(_t.m, _x, p.a);
    const nodeToPushDown = branch3<V, A>(_t.m, p.b, p.c, p.d);

    return () =>
      flatMap(
        prependCPS<V, Node<V, A>>(_t.deeper, nodeToPushDown), // recursively until it finds a non full-prefix
        (newDeeper: FingerTree<V, Node<V, A>>) => {
          return new DeepImpl<V, A>(
            _t.m,
            newAnno,
            newPrefix,
            newDeeper,
            _t.suffix,
          );
        },
      );
  }

  const newPrefix = isOne<V, A>(p) // the rest of the prefix cases
    ? two<V, A>(_t.m, _x, p.a)
    : isTwo<V, A>(p)
    ? three<V, A>(_t.m, _x, p.a, p.b)
    : four<V, A>(_t.m, _x, p.a, p.b, p.c);

  return new DeepImpl<V, A>(_t.m, newAnno, newPrefix, _t.deeper, _t.suffix);
};

/**
 * Adds an element to the left end of the tree.
 *
 * @complexity O(1) amortized, O(log n) worst-case
 * @cite Hinze-Paterson §3.2
 */
export const prepend = <V, A>(
  _t: FingerTree<V, A>,
  _x: A,
): FingerTree<V, A> => trampoline(prependCPS)(_t, _x);

const appendCPS = <V, A>(
  _t: FingerTree<V, A>,
  _x: A,
): Trampoline<FingerTree<V, A>> => {
  if (isEmpty<V, A>(_t)) return single(_t.m, _x);

  if (isSingle<V, A>(_t)) { // make a deep tree with one pre and one suf and empty deeper
    const p = one<V, A>(_t.m, _t.value);
    const s = one<V, A>(_t.m, _x);
    const ann = _t.m.combine(p.annotation, s.annotation);
    return new DeepImpl<V, A>(
      _t.m,
      ann,
      p,
      empty<V, Node<V, A>>({
        ..._t.m,
        measure: (node: Node<V, A>) => node.annotation,
      }),
      s,
    );
  }

  // this will be common between all upcoming cases
  const newAnno = _t.m.combine(
    _t.annotation,
    _t.m.measure(_x),
  );

  // the suffix is my focus now, either i will add an element to it or handle the full suffix case (isFour)
  const s = _t.suffix;

  if (isFour<V, A>(s)) { // if full suffix, keep the last and new elements then push the rest down the tree as a branch3
    const newSuffix = two<V, A>(_t.m, s.d, _x);
    const nodeToPushDown = branch3<V, A>(_t.m, s.a, s.b, s.c);

    return () =>
      flatMap(
        appendCPS<V, Node<V, A>>(_t.deeper, nodeToPushDown), // recursively until it finds a non full-suffix
        (newDeeper: FingerTree<V, Node<V, A>>) => {
          return new DeepImpl<V, A>(
            _t.m,
            newAnno,
            _t.prefix,
            newDeeper,
            newSuffix,
          );
        },
      );
  }

  const newSuffix = isOne<V, A>(s) // the rest of the prefix cases
    ? two<V, A>(_t.m, s.a, _x)
    : isTwo<V, A>(s)
    ? three<V, A>(_t.m, s.a, s.b, _x)
    : four<V, A>(_t.m, s.a, s.b, s.c, _x);

  return new DeepImpl<V, A>(_t.m, newAnno, _t.prefix, _t.deeper, newSuffix);
};

/**
 * Adds an element to the right end of the tree.
 *
 * @complexity O(1) amortized, O(log n) worst-case
 * @cite Hinze-Paterson §3.2
 */
export const append = <V, A>(
  _t: FingerTree<V, A>,
  _x: A,
): FingerTree<V, A> => trampoline(appendCPS)(_t, _x);

/**
 * Returns the first element of the tree if it exists.
 *
 * @complexity O(1)
 * @cite Hinze-Paterson §3.2 (ViewL)
 */
export const head = <V, A>(_t: FingerTree<V, A>): O.Option<A> => {
  if (isEmpty<V, A>(_t)) return O.none();
  if (isSingle<V, A>(_t)) return O.some(_t.value);
  return O.some(_t.prefix.a);
};

/**
 * Returns the last element of the tree if it exists.
 *
 * @complexity O(1)
 * @cite Hinze-Paterson §3.2 (ViewR)
 */
export const last = <V, A>(_t: FingerTree<V, A>): O.Option<A> => {
  if (isEmpty<V, A>(_t)) return O.none();
  if (isSingle<V, A>(_t)) return O.some(_t.value);

  const s = _t.suffix;
  return O.some(
    isOne<V, A>(s) ? s.a : isTwo<V, A>(s) ? s.b : isThree<V, A>(s) ? s.c : s.d,
  );
};

const tailCPS = <V, A>(
  _t: FingerTree<V, A>,
): Trampoline<O.Option<FingerTree<V, A>>> => {
  if (isEmpty<V, A>(_t)) return O.none();
  if (isSingle<V, A>(_t)) return O.some(empty<V, A>(_t.m));

  // the prefix is my focus now, either i will remove an element from it or handle the one element case (isOne)
  const p = _t.prefix;

  if (isOne<V, A>(p)) { // prefix only have one element.
    if (isEmpty<V, A>(_t.deeper)) { // and the deeper is empty, I only have suffix remaining
      const s = _t.suffix;
      if (isOne<V, A>(s)) { // suffix have one element.
        return O.some(single<V, A>(_t.m, s.a)); // the whole result is a single.
      }

      // suufix have more than one element
      const newPrefix = isTwo<V, A>(s)
        ? one<V, A>(_t.m, s.a)
        : two<V, A>(_t.m, s.a, s.b);
      const newSuffix = isTwo<V, A>(s)
        ? one<V, A>(_t.m, s.b)
        : isThree<V, A>(s)
        ? one<V, A>(_t.m, s.c)
        : two<V, A>(_t.m, s.c, s.d);
      const newDeeper = empty<V, Node<V, A>>({
        ..._t.m,
        measure: (node: Node<V, A>) => node.annotation,
      });

      const newAnno = _t.m.combine(newPrefix.annotation, newSuffix.annotation);
      return O.some(
        new DeepImpl<V, A>(_t.m, newAnno, newPrefix, newDeeper, newSuffix),
      );
    }

    // prefix is one but deeper exists
    const newPrefixNode = O.getOrThrow(head(_t.deeper)); // get the head of deeper as the new prefix node.
    const newPrefix = isBranch3<V, A>(newPrefixNode)
      ? three<V, A>(_t.m, newPrefixNode.a, newPrefixNode.b, newPrefixNode.c)
      : two<V, A>(_t.m, newPrefixNode.a, newPrefixNode.b);

    return () =>
      flatMap(
        tailCPS(_t.deeper),
        (deeperTailOpt: O.Option<FingerTree<V, Node<V, A>>>) => {
          const newDeeper = O.getOrThrow(deeperTailOpt); // make the rest of deeper to be the new deeper.

          const newAnno = _t.m.combine(
            newPrefix.annotation,
            _t.m.combine(newDeeper.annotation, _t.suffix.annotation),
          );

          return O.some(
            new DeepImpl<V, A>(_t.m, newAnno, newPrefix, newDeeper, _t.suffix),
          );
        },
      );
  }

  // the easy prefix cases
  const newPrefix = isTwo<V, A>(p)
    ? one<V, A>(_t.m, p.b)
    : isThree<V, A>(p)
    ? two<V, A>(_t.m, p.b, p.c)
    : three<V, A>(_t.m, p.b, p.c, p.d);

  const newAnno = _t.m.combine(
    newPrefix.annotation,
    _t.m.combine(_t.deeper.annotation, _t.suffix.annotation),
  );

  return O.some(
    new DeepImpl<V, A>(_t.m, newAnno, newPrefix, _t.deeper, _t.suffix),
  );
};

/**
 * Returns a tree containing all elements except the first.
 *
 * @complexity O(1) amortized, O(log n) worst-case
 * @cite Hinze-Paterson §3.2 (via ViewL)
 */
export const tail = <V, A>(
  _t: FingerTree<V, A>,
): O.Option<FingerTree<V, A>> => trampoline(tailCPS)(_t);

const initCPS = <V, A>(
  _t: FingerTree<V, A>,
): Trampoline<O.Option<FingerTree<V, A>>> => {
  if (isEmpty<V, A>(_t)) return O.none();
  if (isSingle<V, A>(_t)) return O.some(empty<V, A>(_t.m));

  // the suffix is my focus now, either i will remove an element from it or handle the one element case (isOne)
  const s = _t.suffix;

  if (isOne<V, A>(s)) { // suffix only have one element.
    if (isEmpty(_t.deeper)) { // and the deeper is empty, I only have prefix remaining
      const p = _t.prefix;
      if (isOne<V, A>(p)) { // prefix have one element.
        return O.some(single(_t.m, p.a)); // the whole result is a single.
      }

      // prefix have more than one element
      const newPrefix = isTwo<V, A>(p)
        ? one<V, A>(_t.m, p.a)
        : isThree<V, A>(p)
        ? two<V, A>(_t.m, p.a, p.b)
        : two<V, A>(_t.m, p.a, p.b);
      const newSuffix = isTwo<V, A>(p)
        ? one<V, A>(_t.m, p.b)
        : isThree<V, A>(p)
        ? one<V, A>(_t.m, p.c)
        : two<V, A>(_t.m, p.c, p.d);
      const newDeeper = empty<V, Node<V, A>>({
        ..._t.m,
        measure: (node: Node<V, A>) => node.annotation,
      });

      const newAnno = _t.m.combine(
        newPrefix.annotation,
        newSuffix.annotation,
      );
      return O.some(
        new DeepImpl<V, A>(_t.m, newAnno, newPrefix, newDeeper, newSuffix),
      );
    }

    // suffix is one but deeper exists
    const newSuffixNode = O.getOrThrow(last(_t.deeper)); // get the head of deeper as the new suffix node.
    const newSuffix = isBranch3<V, A>(newSuffixNode)
      ? three<V, A>(_t.m, newSuffixNode.a, newSuffixNode.b, newSuffixNode.c)
      : two<V, A>(_t.m, newSuffixNode.a, newSuffixNode.b);

    return () =>
      flatMap(
        initCPS(_t.deeper),
        (deeperInitOpt: O.Option<FingerTree<V, Node<V, A>>>) => {
          const newDeeper = O.getOrThrow(deeperInitOpt); // make the rest of deeper to be the new deeper.
          const newAnno = _t.m.combine(
            _t.prefix.annotation,
            _t.m.combine(newDeeper.annotation, newSuffix.annotation),
          );

          return O.some(
            new DeepImpl<V, A>(_t.m, newAnno, _t.prefix, newDeeper, newSuffix),
          );
        },
      );
  }

  // the easy suffix cases
  const newSuffix = isTwo<V, A>(s)
    ? one<V, A>(_t.m, s.a)
    : isThree<V, A>(s)
    ? two<V, A>(_t.m, s.a, s.b)
    : three<V, A>(_t.m, s.a, s.b, s.c);

  const newAnno = _t.m.combine(
    _t.prefix.annotation,
    _t.m.combine(_t.deeper.annotation, newSuffix.annotation),
  );

  return O.some(
    new DeepImpl<V, A>(_t.m, newAnno, _t.prefix, _t.deeper, newSuffix),
  );
};

/**
 * Returns a tree containing all elements except the last.
 *
 * @complexity O(1) amortized, O(log n) worst-case
 * @cite Hinze-Paterson §3.2 (via ViewR)
 */
export const init = <V, A>(
  _t: FingerTree<V, A>,
): O.Option<FingerTree<V, A>> => trampoline(initCPS)(_t);

// ---------------------------------------------------------------------------
// Concat & Split  (the two operations that justify finger trees)
// ---------------------------------------------------------------------------
const makeNodes = <V, A>(m: Measured<A, V>, elements: A[]): Node<V, A>[] => {
  if (elements.length === 2) {
    return [branch2<V, A>(m, elements[0], elements[1])];
  }
  if (elements.length === 3) {
    return [branch3<V, A>(m, elements[0], elements[1], elements[2])];
  }
  if (elements.length === 4) {
    return [
      branch2<V, A>(m, elements[0], elements[1]),
      branch2<V, A>(m, elements[2], elements[3]),
    ];
  }
  return [
    branch3<V, A>(m, elements[0], elements[1], elements[2]),
    ...makeNodes(m, elements.slice(3)),
  ];
};

const app3CPS = <V, A>(
  _l: FingerTree<V, A>,
  _ts: A[],
  _r: FingerTree<V, A>,
): Trampoline<FingerTree<V, A>> => {
  // these cases returns a raw value which tells trampoline to stop bouncing and return the result.
  if (isEmpty<V, A>(_l)) {
    return _ts.reduceRight<FingerTree<V, A>>(
      (acc, x) => prepend<V, A>(acc, x),
      _r,
    );
  }
  if (isEmpty<V, A>(_r)) {
    return _ts.reduce<FingerTree<V, A>>((acc, x) => append<V, A>(acc, x), _l);
  }
  if (isSingle<V, A>(_l)) {
    return prepend(
      _ts.reduceRight<FingerTree<V, A>>((acc, x) => prepend<V, A>(acc, x), _r),
      _l.value,
    );
  }
  if (isSingle<V, A>(_r)) {
    return append(
      _ts.reduce<FingerTree<V, A>>((acc, x) => append<V, A>(acc, x), _l),
      _r.value,
    );
  }

  const nodes: Node<V, A>[] = makeNodes(_l.m, [
    ..._l.suffix.toList(),
    ..._ts,
    ..._r.prefix.toList(),
  ]);

  return () =>
    flatMap( // because non-tail recursive app3CPS
      app3CPS(_l.deeper, nodes, _r.deeper), // trampoline on the deeper parts with the new nodes in the middle
      (newDeeper: FingerTree<V, Node<V, A>>) => { // continue after getting the new deeper result
        const newAnno = _l.m.combine(
          _l.prefix.annotation,
          _l.m.combine(newDeeper.annotation, _r.suffix.annotation),
        );
        return new DeepImpl<V, A>(
          _l.m,
          newAnno,
          _l.prefix,
          newDeeper,
          _r.suffix,
        );
      },
    );
};

/**
 * Concatenates two FingerTrees.
 *
 * @complexity O(log(min(n1, n2)))
 * @cite Hinze-Paterson §3.3
 */
export const concat = <V, A>(
  _l: FingerTree<V, A>,
  _r: FingerTree<V, A>,
  _mid: A[] = [],
): FingerTree<V, A> => trampoline(app3CPS)(_l, _mid, _r);

const deepL = <V, A>(
  m: Measured<A, V>,
  prefixArray: A[],
  deeper: FingerTree<V, Node<V, A>>,
  suffix: Affix<V, A>,
): FingerTree<V, A> => {
  // If the prefix is empty, we must pull a node up from the deeper
  if (prefixArray.length === 0) {
    // If deeper is also empty, build a tree from the suffix.
    if (isEmpty<V, Node<V, A>>(deeper)) return fromArray(suffix.toList(), m);

    // get the head of the deeper as the new prefix, and the rest as the new deeper.
    const headNode = O.getOrThrow(head(deeper));
    const newDeeper = O.getOrThrow(tail(deeper));
    const newPrefix = isBranch3<V, A>(headNode)
      ? three<V, A>(m, headNode.a, headNode.b, headNode.c)
      : two<V, A>(m, headNode.a, headNode.b);

    const newAnno = m.combine(
      newPrefix.annotation,
      m.combine(newDeeper.annotation, suffix.annotation),
    );
    return new DeepImpl<V, A>(m, newAnno, newPrefix, newDeeper, suffix);
  }

  // Normal case
  const newPrefix = prefixArray.length === 1
    ? one(m, prefixArray[0])
    : prefixArray.length === 2
    ? two(m, prefixArray[0], prefixArray[1])
    : prefixArray.length === 3
    ? three(m, prefixArray[0], prefixArray[1], prefixArray[2])
    : four(m, prefixArray[0], prefixArray[1], prefixArray[2], prefixArray[3]);

  const newAnno = m.combine(
    newPrefix.annotation,
    m.combine(deeper.annotation, suffix.annotation),
  );
  return new DeepImpl<V, A>(m, newAnno, newPrefix, deeper, suffix);
};

const deepR = <V, A>(
  m: Measured<A, V>,
  prefix: Affix<V, A>,
  deeper: FingerTree<V, Node<V, A>>,
  suffixArray: A[],
): FingerTree<V, A> => {
  // If the suffix is empty, we must pull a node up from the deeper
  if (suffixArray.length === 0) {
    // If deeper is also empty, build a tree from just the prefix.
    if (isEmpty<V, Node<V, A>>(deeper)) return fromArray(prefix.toList(), m);

    // get the last of the deeper as the new suffix, and the rest as the new deeper.
    const lastNode = O.getOrThrow(last(deeper));
    const newDeeper = O.getOrThrow(init(deeper));
    const newSuffix = isBranch3<V, A>(lastNode)
      ? three<V, A>(m, lastNode.a, lastNode.b, lastNode.c)
      : two<V, A>(m, lastNode.a, lastNode.b);

    const newAnno = m.combine(
      prefix.annotation,
      m.combine(newDeeper.annotation, newSuffix.annotation),
    );
    return new DeepImpl<V, A>(m, newAnno, prefix, newDeeper, newSuffix);
  }

  // Normal case
  const newSuffix = suffixArray.length === 1
    ? one(m, suffixArray[0])
    : suffixArray.length === 2
    ? two(m, suffixArray[0], suffixArray[1])
    : suffixArray.length === 3
    ? three(m, suffixArray[0], suffixArray[1], suffixArray[2])
    : four(m, suffixArray[0], suffixArray[1], suffixArray[2], suffixArray[3]);

  const newAnno = m.combine(
    prefix.annotation,
    m.combine(deeper.annotation, newSuffix.annotation),
  );
  return new DeepImpl<V, A>(m, newAnno, prefix, deeper, newSuffix);
};

const splitDigit = <V, A>(
  m: Measured<A, V>,
  p: (v: V) => boolean,
  i: V,
  arr: readonly A[],
): { left: A[]; value: A; right: A[] } => {
  // if only one element, it is the split point.
  if (arr.length === 1) return { left: [], value: arr[0], right: [] };

  const a = arr[0];
  const ar = arr.slice(1);

  // calc the measure up to the current element.
  const iMeasure = m.combine(i, m.measure(a));

  // if the accumulated measure satisfies the predicate, split right here.
  if (p(iMeasure)) return { left: [], value: a, right: ar };

  // keep searching in the rest of the array and add 'a' to the left side.
  const { left: l, value: x, right: r } = splitDigit(m, p, iMeasure, ar);
  return { left: [a, ...l], value: x, right: r };
};

const splitTreeCPS = <V, A>(
  _predicate: (v: V) => boolean,
  _start: V,
  _t: FingerTree<V, A>,
): Trampoline<Split<V, A>> => {
  // if it is single then it is the split point.
  if (isSingle<V, A>(_t)) {
    return new SplitImpl<V, A>(
      empty<V, A>(_t.m),
      _t.value,
      empty<V, A>(_t.m),
    );
  }

  if (isDeep<V, A>(_t)) {
    const annoPrefix: V = _t.m.combine(_start, _t.prefix.annotation);
    if (_predicate(annoPrefix)) { // check if the split point is in the prefix through the cached anno at its root
      const { left, value, right } = splitDigit<V, A>(
        _t.m,
        _predicate,
        _start,
        _t.prefix.toList(),
      );

      return new SplitImpl<V, A>(
        fromArray(left, _t.m),
        value,
        deepL(_t.m, right, _t.deeper, _t.suffix),
      );
    }

    const annoDeeper: V = _t.m.combine(annoPrefix, _t.deeper.annotation);
    if (_predicate(annoDeeper)) { // check if the split point is in the deeper through the cached anno at its root
      return () =>
        flatMap( // because non-tail recursive splitTreeCPS
          splitTreeCPS<V, Node<V, A>>(_predicate, annoPrefix, _t.deeper), // trampoline on the deeper part
          (splitDeeper: Split<V, Node<V, A>>) => { // continue after getting the split result of deeper
            const nodeMeasureBefore = _t.m.combine(
              annoPrefix,
              splitDeeper.left.annotation,
            );
            const { left, value, right } = splitDigit<V, A>(
              _t.m,
              _predicate,
              nodeMeasureBefore,
              splitDeeper.value.toList(),
            );

            return new SplitImpl<V, A>(
              deepR<V, A>(_t.m, _t.prefix, splitDeeper.left, left),
              value,
              deepL<V, A>(_t.m, right, splitDeeper.right, _t.suffix),
            );
          },
        );
    }

    // the predicate is in the suffix
    const { left, value, right } = splitDigit<V, A>(
      _t.m,
      _predicate,
      annoDeeper,
      _t.suffix.toList(),
    );

    return new SplitImpl<V, A>(
      deepR<V, A>(_t.m, _t.prefix, _t.deeper, left),
      value,
      fromArray(right, _t.m),
    );
  }

  throw new Error("UNREACHABLE"); // defensive throws unreachable from the public API
};

/**
 * Splits a tree based on a predicate on the monoidal annotation.
 *
 * @complexity O(log(min(nl, nr)))
 * @cite Hinze-Paterson §4.4
 */
export const split = <V, A>(
  _predicate: (v: V) => boolean,
  _start: V,
  _t: FingerTree<V, A>,
): O.Option<Split<V, A>> => {
  if (isEmpty<V, A>(_t)) return O.none();
  return O.some(trampoline(splitTreeCPS)(_predicate, _start, _t));
};

// ---------------------------------------------------------------------------
// Higher-order traversals
// ---------------------------------------------------------------------------
const mapCPS = <V, A, B>(
  _t: FingerTree<V, A>,
  _f: (a: A) => B,
  _m: Measured<B, V>,
): Trampoline<FingerTree<V, B>> => {
  if (isEmpty<V, A>(_t)) return empty(_m);
  if (isSingle<V, A>(_t)) return single(_m, _f(_t.value));

  const p = _t.prefix;
  const mappedPrefix = isOne<V, A>(p) // map the prefix simply
    ? one<V, B>(_m, _f(p.a))
    : isTwo<V, A>(p)
    ? two<V, B>(_m, _f(p.a), _f(p.b))
    : isThree<V, A>(p)
    ? three<V, B>(_m, _f(p.a), _f(p.b), _f(p.c))
    : four<V, B>(_m, _f(p.a), _f(p.b), _f(p.c), _f(p.d));

  const s = _t.suffix;
  const mappedSuffix = isOne<V, A>(s) // map the suffix simply
    ? one<V, B>(_m, _f(s.a))
    : isTwo<V, A>(s)
    ? two<V, B>(_m, _f(s.a), _f(s.b))
    : isThree<V, A>(s)
    ? three<V, B>(_m, _f(s.a), _f(s.b), _f(s.c))
    : four<V, B>(_m, _f(s.a), _f(s.b), _f(s.c), _f(s.d));

  return flatMap( // because non-tail recursive mapCPS
    () =>
      mapCPS( // trampoline on the deeper part
        _t.deeper,
        (node: Node<V, A>) =>
          // define the map for the next level
          isBranch3<V, A>(node)
            ? branch3<V, B>(_m, _f(node.a), _f(node.b), _f(node.c))
            : branch2<V, B>(_m, _f(node.a), _f(node.b)),
        {
          ..._m,
          measure: (node: Node<V, B>) => node.annotation,
        },
      ),
    (mappedDeeper: FingerTree<V, Node<V, B>>) => { // continue after getting the mapped deeper result
      const newAnno = _m.combine(
        mappedPrefix.annotation,
        _m.combine(mappedDeeper.annotation, mappedSuffix.annotation),
      );
      return new DeepImpl<V, B>(
        _m,
        newAnno,
        mappedPrefix,
        mappedDeeper,
        mappedSuffix,
      );
    },
  );
};

/**
 * Maps a function over every element in the tree.
 *
 * @complexity O(n)
 */
export const map = <V, A, B>(
  _t: FingerTree<V, A>,
  _f: (a: A) => B,
  _m: Measured<B, V>,
): FingerTree<V, B> => trampoline(mapCPS)(_t, _f, _m);

const foldlCPS = <V, A, B>(
  _f: (acc: B, a: A) => B,
  _init: B,
  _t: FingerTree<V, A>,
): Trampoline<B> => {
  if (isEmpty<V, A>(_t)) return _init;
  if (isSingle<V, A>(_t)) return _f(_init, _t.value);

  const p = _t.prefix;
  const prefixFolded = isOne<V, A>(p) // fold the prefix simply
    ? _f(_init, p.a)
    : isTwo<V, A>(p)
    ? _f(_f(_init, p.a), p.b)
    : isThree<V, A>(p)
    ? _f(_f(_f(_init, p.a), p.b), p.c)
    : _f(
      _f(_f(_f(_init, p.a), p.b), p.c),
      p.d,
    );

  const _f_deeper = (innerAcc: B, node: Node<V, A>): B =>
    // define the fold for the next level
    isBranch3<V, A>(node)
      ? _f(
        _f(_f(innerAcc, node.a), node.b),
        node.c,
      )
      : _f(_f(innerAcc, node.a), node.b);

  return flatMap( // because non-tail recursive foldlCPS
    () => foldlCPS(_f_deeper, prefixFolded, _t.deeper), // trampoline on the deeper part
    (deeperFolded: B) => { // continue after getting the deeper result
      const s = _t.suffix;
      return isOne<V, A>(s) // fold the suffix simply
        ? _f(deeperFolded, s.a)
        : isTwo<V, A>(s)
        ? _f(_f(deeperFolded, s.a), s.b)
        : isThree<V, A>(s)
        ? _f(_f(_f(deeperFolded, s.a), s.b), s.c)
        : _f(
          _f(_f(_f(deeperFolded, s.a), s.b), s.c),
          s.d,
        );
    },
  );
};

/**
 * Performs a left-associative fold over the tree.
 *
 * @complexity O(n)
 * @cite Hinze-Paterson §2.2
 */
export const foldl = <V, A, B>(
  _f: (acc: B, a: A) => B,
  _init: B,
  _t: FingerTree<V, A>,
): B => trampoline(foldlCPS)(_f, _init, _t);

const foldrCPS = <V, A, B>(
  _f: (a: A, acc: B) => B,
  _init: B,
  _t: FingerTree<V, A>,
): Trampoline<B> => {
  if (isEmpty<V, A>(_t)) return _init;
  if (isSingle<V, A>(_t)) return _f(_t.value, _init);

  const s = _t.suffix;
  const suffixFolded = isOne<V, A>(s) // fold the suffix simply
    ? _f(s.a, _init)
    : isTwo<V, A>(s)
    ? _f(s.a, _f(s.b, _init))
    : isThree<V, A>(s)
    ? _f(s.a, _f(s.b, _f(s.c, _init)))
    : _f(
      s.a,
      _f(s.b, _f(s.c, _f(s.d, _init))),
    );

  const _f_deeper = (node: Node<V, A>, innerAcc: B): B =>
    // define the fold for the next level
    isBranch3<V, A>(node)
      ? _f(
        node.a,
        _f(node.b, _f(node.c, innerAcc)),
      )
      : _f(node.a, _f(node.b, innerAcc));

  return flatMap( // because non-tail recursive foldrCPS
    () => foldrCPS(_f_deeper, suffixFolded, _t.deeper), // trampoline on the deeper part
    (deeperFolded: B) => { // continue after getting the deeper result
      const p = _t.prefix;
      return isOne<V, A>(p) // fold the prefix simply
        ? _f(p.a, deeperFolded)
        : isTwo<V, A>(p)
        ? _f(p.a, _f(p.b, deeperFolded))
        : isThree<V, A>(p)
        ? _f(p.a, _f(p.b, _f(p.c, deeperFolded)))
        : _f(
          p.a,
          _f(p.b, _f(p.c, _f(p.d, deeperFolded))),
        );
    },
  );
};

/**
 * Performs a right-associative fold over the tree.
 *
 * @complexity O(n)
 * @cite Hinze-Paterson §2.2
 */
export const foldr = <V, A, B>(
  _f: (a: A, acc: B) => B,
  _init: B,
  _t: FingerTree<V, A>,
): B => trampoline(foldrCPS)(_f, _init, _t);
