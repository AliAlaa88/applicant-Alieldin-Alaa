/**
 * Public entrypoint for the package.
 *
 * The applicant's `FingerTree` and `FingerPriorityQueue` modules are
 * re-exported here as namespaces so consumers write
 * `import { FingerTree, FingerPriorityQueue } from "task"`.
 */
export * as FingerTree from "./fingerTree/FingerTree.ts";
export * as FingerPriorityQueue from "./fingerPriorityQueue/FingerPriorityQueue.ts";
