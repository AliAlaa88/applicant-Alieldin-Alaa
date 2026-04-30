/**
 * Deno bench suite for `FingerPriorityQueue`. **You write this file.**
 *
 * Model it after `src/fingerTree/FingerTree.bench.ts`. At minimum:
 *   - benchmark `push` and `pop` for sizes 1 000, 10 000, 100 000;
 *   - compare against a baseline (a sorted `Array` PQ is fine);
 *   - mark the FingerPriorityQueue benches `baseline: true` within each group
 *     so Deno reports the relative speed-up;
 *   - seed your random data so runs are reproducible (`Math.random()` ≠ science).
 *
 * Run with:  `deno task benchmark:fingerPriorityQueue`
 */

Deno.bench({
  name: "FingerPriorityQueue::TODO — implement me",
  fn: () => {
    throw new Error(
      "FingerPriorityQueue.bench is not implemented yet. See TASK.md §3.",
    );
  },
});
