import {
  format,
  type Inspectable,
  NodeInspectSymbol,
  toJSON,
} from "effect/Inspectable";
import { type Pipeable, pipeArguments } from "effect/Pipeable";
import * as Equal from "effect/Equal";
import * as Hash from "effect/Hash";
import {
  AffixTypeId,
  Branch2TypeId,
  Branch3TypeId,
  FourTypeId,
  FourTypeKey,
  isObj,
  NodeTypeId,
  OneTypeId,
  OneTypeKey,
  ThreeTypeId,
  ThreeTypeKey,
  TwoTypeId,
  TwoTypeKey,
} from "./types.ts";
import type { Measured } from "../../utils/monoids.ts";

interface NodeBase<V, in out A> extends Equal.Equal, Pipeable, Inspectable {
  readonly [NodeTypeId]: {
    readonly _V: (_: never) => V;
    readonly _A: (_: never) => A;
  };
  readonly annotation: V;
  toList: () => readonly [A, A] | readonly [A, A, A];
}
interface AffixBase<V, in out A> extends Equal.Equal, Pipeable, Inspectable {
  readonly [AffixTypeId]: {
    readonly _V: (_: never) => V;
    readonly _A: (_: never) => A;
  };
  readonly annotation: V;
  toList: () => ReadonlyArray<A>;
}
export interface Branch2<V, in out A> extends NodeBase<V, A> {
  readonly [Branch2TypeId]: Branch2TypeId;
  readonly a: A;
  readonly b: A;
}
export interface Branch3<V, in out A> extends NodeBase<V, A> {
  readonly [Branch3TypeId]: Branch3TypeId;
  readonly a: A;
  readonly b: A;
  readonly c: A;
}
export type Node<V, A> = Branch2<V, A> | Branch3<V, A>;
export interface One<V, in out A> extends AffixBase<V, A> {
  readonly [OneTypeId]: OneTypeId;
  readonly a: A;
}
export interface Two<V, in out A> extends AffixBase<V, A> {
  readonly [TwoTypeId]: TwoTypeId;
  readonly a: A;
  readonly b: A;
}
export interface Three<V, in out A> extends AffixBase<V, A> {
  readonly [ThreeTypeId]: ThreeTypeId;
  readonly a: A;
  readonly b: A;
  readonly c: A;
}
export interface Four<V, in out A> extends AffixBase<V, A> {
  readonly [FourTypeId]: FourTypeId;
  readonly a: A;
  readonly b: A;
  readonly c: A;
  readonly d: A;
}
export type Affix<V, A> = One<V, A> | Two<V, A> | Three<V, A> | Four<V, A>;

export const isBranch2 = <V, A>(u: unknown): u is Branch2<V, A> =>
  isObj(u) && Branch2TypeId in u &&
  "a" in u &&
  "b" in u;

export const isBranch3 = <V, A>(u: unknown): u is Branch3<V, A> =>
  isObj(u) && Branch3TypeId in u &&
  "a" in u &&
  "b" in u &&
  "c" in u;
export const isOne = <V, A>(u: unknown): u is One<V, A> =>
  isObj(u) && OneTypeId in u && "a" in u;
export const isTwo = <V, A>(u: unknown): u is Two<V, A> =>
  isObj(u) && TwoTypeId in u && "a" in u && "b" in u;
export const isThree = <V, A>(u: unknown): u is Three<V, A> =>
  isObj(u) && ThreeTypeId in u && "a" in u && "b" in u && "c" in u;

export const isFour = <V, A>(u: unknown): u is Four<V, A> =>
  isObj(u) && FourTypeId in u && "a" in u && "b" in u && "c" in u && "d" in u;

class Branch2Impl<V, A> implements Branch2<V, A> {
  readonly [NodeTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  readonly [Branch2TypeId]: Branch2TypeId = Branch2TypeId;
  constructor(
    public readonly annotation: V,
    public readonly a: A,
    public readonly b: A,
  ) {
  }
  [Equal.symbol](that: unknown): boolean {
    return isBranch2(that) &&
      Equal.equals(this.a, that.a) &&
      Equal.equals(this.b, that.b);
  }
  [Hash.symbol](): number {
    return Hash.array([this.a, this.b]);
  }
  toJSON() {
    return {
      _id: "Branch2",
      values: [toJSON(this.a), toJSON(this.b)],
    };
  }

  toString() {
    return format(this.toJSON());
  }

  [NodeInspectSymbol]() {
    return this.toJSON();
  }

  pipe() {
    return pipeArguments(this, arguments);
  }

  toList(): readonly [A, A] {
    return [this.a, this.b] as readonly [A, A];
  }
}
class Branch3Impl<V, A> implements Branch3<V, A> {
  readonly [NodeTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  readonly [Branch3TypeId]: Branch3TypeId = Branch3TypeId;
  constructor(
    public readonly annotation: V,
    public readonly a: A,
    public readonly b: A,
    public readonly c: A,
  ) {}
  [Equal.symbol](that: unknown): boolean {
    return isBranch3<V, A>(that) &&
      Equal.equals(this.a, that.a) &&
      Equal.equals(this.b, that.b) &&
      Equal.equals(this.c, that.c);
  }
  [Hash.symbol](): number {
    return Hash.array([this.a, this.b, this.c]);
  }
  toJSON() {
    return {
      _id: "Branch3",
      values: [toJSON(this.a), toJSON(this.b), toJSON(this.c)],
    };
  }

  toString() {
    return format(this.toJSON());
  }

  [NodeInspectSymbol]() {
    return this.toJSON();
  }

  pipe() {
    return pipeArguments(this, arguments);
  }

  toList(): readonly [A, A, A] {
    return [this.a, this.b, this.c];
  }
}

class OneImpl<V, A> implements One<V, A> {
  readonly [OneTypeId]: OneTypeId = OneTypeId;
  readonly [AffixTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  readonly annotation: V;
  constructor(public readonly m: Measured<A, V>, public readonly a: A) {
    this.annotation = m.measure(a);
  }
  [Equal.symbol](that: unknown): boolean {
    return isOne<V, A>(that) && Equal.equals(this.a, that.a);
  }
  [Hash.symbol](): number {
    return Hash.hash(this.a);
  }
  toJSON() {
    return { _id: OneTypeKey, values: [toJSON(this.a)] };
  }
  toString() {
    return format(this.toJSON());
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toList(): readonly [A] {
    return [this.a];
  }
}

class TwoImpl<V, A> implements Two<V, A> {
  readonly [TwoTypeId]: TwoTypeId = TwoTypeId;
  readonly [AffixTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  readonly annotation: V;
  constructor(
    public readonly m: Measured<A, V>,
    public readonly a: A,
    public readonly b: A,
  ) {
    this.annotation = m.combine(m.measure(a), m.measure(b));
  }
  [Equal.symbol](that: unknown): boolean {
    return isTwo<V, A>(that) && Equal.equals(this.a, that.a) &&
      Equal.equals(this.b, that.b);
  }
  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.a))(Hash.hash(this.b));
  }
  toJSON() {
    return { _id: TwoTypeKey, values: [toJSON(this.a), toJSON(this.b)] };
  }
  toString() {
    return format(this.toJSON());
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toList(): readonly [A, A] {
    return [this.a, this.b];
  }
}
class ThreeImpl<V, A> implements Three<V, A> {
  readonly [ThreeTypeId]: ThreeTypeId = ThreeTypeId;
  readonly [AffixTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  readonly annotation: V;
  constructor(
    public readonly m: Measured<A, V>,
    public readonly a: A,
    public readonly b: A,
    public readonly c: A,
  ) {
    this.annotation = m.combine(
      m.measure(a),
      m.combine(m.measure(b), m.measure(c)),
    );
  }
  [Equal.symbol](that: unknown): boolean {
    return isThree<V, A>(that) && Equal.equals(this.a, that.a) &&
      Equal.equals(this.b, that.b) && Equal.equals(this.c, that.c);
  }
  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.a))(
      Hash.combine(Hash.hash(this.b))(Hash.hash(this.c)),
    );
  }
  toJSON() {
    return {
      _id: ThreeTypeKey,
      values: [toJSON(this.a), toJSON(this.b), toJSON(this.c)],
    };
  }
  toString() {
    return format(this.toJSON());
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toList(): readonly [A, A, A] {
    return [this.a, this.b, this.c];
  }
}

class FourImpl<V, A> implements Four<V, A> {
  readonly [FourTypeId]: FourTypeId = FourTypeId;
  readonly [AffixTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  readonly annotation: V;
  constructor(
    public readonly m: Measured<A, V>,
    public readonly a: A,
    public readonly b: A,
    public readonly c: A,
    public readonly d: A,
  ) {
    this.annotation = m.combine(
      m.combine(m.measure(a), m.measure(b)),
      m.combine(m.measure(c), m.measure(d)),
    );
  }
  [Equal.symbol](that: unknown): boolean {
    return isFour<V, A>(that) && Equal.equals(this.a, that.a) &&
      Equal.equals(this.b, that.b) &&
      Equal.equals(this.c, that.c) && Equal.equals(this.d, that.d);
  }
  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.a))(
      Hash.combine(Hash.hash(this.b))(
        Hash.combine(Hash.hash(this.c))(Hash.hash(this.d)),
      ),
    );
  }
  toJSON() {
    return {
      _id: FourTypeKey,
      values: [toJSON(this.a), toJSON(this.b), toJSON(this.c), toJSON(this.d)],
    };
  }
  toString() {
    return format(this.toJSON());
  }
  [NodeInspectSymbol]() {
    return this.toJSON();
  }
  pipe() {
    return pipeArguments(this, arguments);
  }
  toList(): readonly [A, A, A, A] {
    return [this.a, this.b, this.c, this.d];
  }
}

export const branch2 = <V, A>(m: Measured<A, V>, a: A, b: A): Branch2<V, A> => {
  const annotation = m.combine(m.measure(a), m.measure(b));
  return new Branch2Impl(annotation, a, b);
};

export const branch3 = <V, A>(
  m: Measured<A, V>,
  a: A,
  b: A,
  c: A,
): Branch3<V, A> => {
  const annotation = m.combine(
    m.measure(a),
    m.combine(m.measure(b), m.measure(c)),
  );
  return new Branch3Impl(annotation, a, b, c);
};

export const one = <V, A>(m: Measured<A, V>, a: A): One<V, A> =>
  new OneImpl(m, a);
export const two = <V, A>(m: Measured<A, V>, a: A, b: A): Two<V, A> =>
  new TwoImpl(m, a, b);
export const three = <V, A>(m: Measured<A, V>, a: A, b: A, c: A): Three<V, A> =>
  new ThreeImpl(m, a, b, c);
export const four = <V, A>(
  m: Measured<A, V>,
  a: A,
  b: A,
  c: A,
  d: A,
): Four<V, A> => new FourImpl(m, a, b, c, d);
