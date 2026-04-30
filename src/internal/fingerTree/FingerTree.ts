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
  DeepTypeId,
  DeepTypeKey,
  EmptyTypeId,
  EmptyTypeKey,
  FingerTreeTypeId,
  isObj,
  NilTypeId,
  NilTypeKey,
  SingleTypeId,
  SingleTypeKey,
  ViewTypeId,
  ViewTypeKey,
} from "./types.ts";
import type { Affix, Node } from "./nodes.ts";
import type { Measured } from "@monoids";
import { FingerTreeIterator } from "../../fingerTree/iterator.ts";
export interface FingerTreeBase<V, in out A>
  extends Equal.Equal, Pipeable, Inspectable {
  readonly [FingerTreeTypeId]: {
    readonly _V: (_: never) => V;
    readonly _A: (_: never) => A;
  };
  readonly m: Measured<A, V>;
  [Symbol.iterator](): IterableIterator<A>;
  readonly annotation: V;
  toList: () => ReadonlyArray<A>;
}
export interface Empty<A, in out V> extends FingerTreeBase<A, V> {
  readonly [EmptyTypeId]: EmptyTypeId;
}

export interface Single<V, in out A> extends FingerTreeBase<V, A> {
  readonly [SingleTypeId]: SingleTypeId;
  readonly value: A;
}

export interface Deep<V, in out A> extends FingerTreeBase<V, A> {
  readonly [DeepTypeId]: DeepTypeId;
  readonly prefix: Affix<V, A>;
  readonly deeper: FingerTree<V, Node<V, A>>;
  readonly suffix: Affix<V, A>;
}

export type FingerTree<V, A> = Empty<V, A> | Single<V, A> | Deep<V, A>;
export interface NilView extends Equal.Equal, Pipeable, Inspectable {
  readonly [NilTypeId]: Record<string | number | symbol, never>;
}

export interface ViewCase<V, A> extends Equal.Equal, Pipeable, Inspectable {
  readonly [ViewTypeId]: {
    readonly _V: (_: never) => V;
    readonly _A: (_: never) => A;
  };
  readonly value: A;
  readonly next: FingerTree<V, A>;
}

export type View<V, A> = NilView | ViewCase<V, A>;

export class Split<V, A> implements Pipeable {
  constructor(
    public readonly left: FingerTree<V, A>,
    public readonly value: A,
    public readonly right: FingerTree<V, A>,
  ) {}
  pipe() {
    return pipeArguments(this, arguments);
  }
}
export const isEmpty = <V, A>(u: unknown): u is Empty<V, A> =>
  isObj(u) && EmptyTypeId in u;

export const isSingle = <V, A>(u: unknown): u is Single<V, A> =>
  isObj(u) && SingleTypeId in u && "value" in u;

export const isDeep = <V, A>(u: unknown): u is Deep<V, A> =>
  isObj(u) && DeepTypeId in u && "prefix" in u && "deeper" in u &&
  "suffix" in u;
export const isNil = (u: unknown): u is NilView => isObj(u) && NilTypeId in u;

export const isView = <V, A>(u: unknown): u is ViewCase<V, A> =>
  isObj(u) && ViewTypeId in u;

export const isSplit = <V, A>(u: unknown): u is Split<V, A> =>
  isObj(u) && "left" in u && "value" in u && "right" in u;
export class EmptyImpl<V, A> implements Empty<V, A> {
  readonly [EmptyTypeId]: EmptyTypeId = EmptyTypeId;
  readonly [FingerTreeTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  public readonly annotation: V;
  constructor(public readonly m: Measured<A, V>) {
    this.annotation = this.m.empty;
  }
  [Symbol.iterator](): IterableIterator<A> {
    return new FingerTreeIterator(this);
  }
  [Equal.symbol](that: unknown): boolean {
    return isEmpty<V, A>(that);
  }

  [Hash.symbol](): number {
    return Hash.string(EmptyTypeKey);
  }

  toJSON() {
    return { _id: EmptyTypeKey };
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

  toList(): ReadonlyArray<A> {
    return [];
  }
}

export class SingleImpl<V, A> implements Single<V, A> {
  readonly [SingleTypeId]: SingleTypeId = SingleTypeId;
  readonly [FingerTreeTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  public readonly annotation: V;
  constructor(public readonly m: Measured<A, V>, public readonly value: A) {
    this.annotation = this.m.measure(this.value);
  }
  [Symbol.iterator](): IterableIterator<A> {
    return new FingerTreeIterator(this);
  }
  [Equal.symbol](that: unknown): boolean {
    return isSingle<V, A>(that) && Equal.equals(this.value, that.value);
  }

  [Hash.symbol](): number {
    return Hash.hash(this.value);
  }

  toJSON() {
    return { _id: SingleTypeKey, value: toJSON(this.value) };
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
    return [this.value];
  }
}

export class DeepImpl<V, A> implements Deep<V, A> {
  readonly [DeepTypeId]: DeepTypeId = DeepTypeId;
  readonly [FingerTreeTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };

  constructor(
    public readonly m: Measured<A, V>,
    public readonly annotation: V,
    public readonly prefix: Affix<V, A>,
    public readonly deeper: FingerTree<V, Node<V, A>>,
    public readonly suffix: Affix<V, A>,
  ) {}
  [Symbol.iterator](): IterableIterator<A> {
    return new FingerTreeIterator(this);
  }
  [Equal.symbol](that: unknown): boolean {
    return isDeep<V, A>(that) &&
      Equal.equals(this.prefix, that.prefix) &&
      Equal.equals(this.deeper, that.deeper) &&
      Equal.equals(this.suffix, that.suffix);
  }

  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.prefix))(
      Hash.combine(Hash.hash(this.deeper))(
        Hash.hash(this.suffix),
      ),
    );
  }

  toJSON() {
    return {
      _id: DeepTypeKey,
      prefix: toJSON(this.prefix),
      deeper: toJSON(this.deeper),
      suffix: toJSON(this.suffix),
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

  toList(): ReadonlyArray<A> {
    const prefixList = this.prefix.toList();
    const deeperList = this.deeper.toList().flatMap((node) => node.toList());
    const suffixList = this.suffix.toList();
    return [...prefixList, ...deeperList, ...suffixList];
  }
}
export class NilViewImpl implements NilView {
  readonly [NilTypeId] = {};
  [Equal.symbol](that: unknown): boolean {
    return isNil(that);
  }

  [Hash.symbol](): number {
    return Hash.string(NilTypeKey);
  }

  toJSON() {
    return { _id: NilTypeKey };
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
}

export class ViewCaseImpl<V, A> implements ViewCase<V, A> {
  [ViewTypeId] = {
    _V: (_: never) => _ as V,
    _A: (_: never) => _ as A,
  };
  constructor(
    public readonly value: A,
    public readonly next: FingerTree<V, A>,
  ) {}

  [Equal.symbol](that: unknown): boolean {
    return isView(that) &&
      Equal.equals(this.value, that.value) &&
      Equal.equals(this.next, that.next);
  }

  [Hash.symbol](): number {
    return Hash.combine(Hash.hash(this.value))(Hash.hash(this.next));
  }

  toJSON() {
    return {
      _id: ViewTypeKey,
      value: toJSON(this.value),
      next: toJSON(this.next),
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
}
