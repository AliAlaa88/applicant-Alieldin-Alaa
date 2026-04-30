import type * as M from "@effect/typeclass/Monoid";
import type { Order } from "effect/Order";

export type Priority = number;
export interface Measured<A, V> extends M.Monoid<V> {
  measure: (a: A) => V;
}
export const getPriorityMonoid = <V, A>(
  order: Order<V>,
  emptyValue: V,
): M.Monoid<V> & Measured<A, V> => ({
  combine: (a, b) => (order(a, b) >= 0 ? a : b),
  empty: emptyValue,
  measure: (a: any) => a.priority,
  combineAll: function (collection) {
    return Array.from(collection).reduce(
      (acc, a) => this.combine(acc, a),
      this.empty,
    );
  },
  combineMany: function (self, collection) {
    return Array.from(collection).reduce(
      (acc, a) => this.combine(acc, a),
      self,
    );
  },
});
