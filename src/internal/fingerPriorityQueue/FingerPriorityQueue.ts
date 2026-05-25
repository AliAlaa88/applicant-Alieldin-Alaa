import * as O from "effect/Option";
import type { Order } from "effect/Order";

import { format, NodeInspectSymbol, toJSON } from "effect/Inspectable";
import { pipeArguments } from "effect/Pipeable";
import * as FT from "../../fingerTree/FingerTree.ts";

export type Prioritized<P, A> = {
  readonly priority: P;
  readonly item: A;
};

export class FingerPriorityQueueImpl<P, A> {
  readonly _P!: (_: never) => P;
  readonly _A!: (_: never) => A;

  constructor(
    public readonly tree: FT.FingerTree<P, Prioritized<P, A>>,
    public readonly order: Order<P>,
    public readonly size: number,
  ) {}

  // Inspectable
  toJSON() {
    return {
      _id: "FingerPriorityQueue",
      size: this.size,
      maxPriority: O.isNone(FT.head(this.tree))
        ? null
        : toJSON(this.tree.annotation),
    };
  }

  toString() {
    return format(this.toJSON());
  }

  [NodeInspectSymbol]() {
    return this.toJSON();
  }

  // Pipeable
  pipe() {
    return pipeArguments(this, arguments);
  }
}

export type FingerPriorityQueue<P, A> = FingerPriorityQueueImpl<P, A>;
