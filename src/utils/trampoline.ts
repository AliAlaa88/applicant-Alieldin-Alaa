/**
 * A type representing either a value of type T or a function that produces a Trampoline of T.
 * Used to implement tail-recursive functions without stack overflow.
 */
export type Trampoline<T> = T | (() => Trampoline<T>);

/**
 * Converts a recursive function into a loop-based version using a trampoline mechanism.
 * This allows safe execution of tail-recursive functions without stack overflow.
 *
 * @template Args - The argument types of the original function
 * @template T - The return type of the original function
 * @param fn - The recursive function to be trampolined
 * @returns A new function that implements the recursive logic using a loop
 *
 * @example
 * const factorial = trampoline((n: number, acc = 1): Trampoline<number> => {
 *   return n <= 1 ? acc : () => factorial(n - 1, acc * n);
 * });
 */
// deno-lint-ignore no-explicit-any
export const trampoline = <Args extends any[], T>(
  fn: (...args: Args) => Trampoline<T>,
) => {
  return (...args: Args): T => {
    let result = fn(...args);
    while (typeof result === "function") {
      result = (result as () => Trampoline<T>)();
    }
    return result as T;
  };
};

/**
 * Chains a Trampoline computation with a function that produces a new Trampoline.
 * This allows combining multiple Trampoline computations without nesting.
 *
 * @template T - The type of the initial Trampoline value
 * @template U - The type of the resulting Trampoline value
 * @param trampoline - The initial Trampoline computation
 * @param f - A function that maps the result of the initial computation to a new Trampoline
 * @returns A new Trampoline representing the combined computation
 */
export function flatMap<T, U>(
  trampoline: Trampoline<T>,
  f: (value: T) => Trampoline<U>,
): Trampoline<U> {
  return typeof trampoline === "function"
    ? () => {
      const next = (trampoline as () => Trampoline<T>)();
      return flatMap(next, f);
    }
    : f(trampoline);
}
