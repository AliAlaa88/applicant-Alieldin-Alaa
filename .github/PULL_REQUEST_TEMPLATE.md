<!--
  Internship-task PR template.
  Fill in every section. Honesty is part of the evaluation.
-->

## Summary

<!-- 2 – 3 sentences. What did you build, what's the headline result? -->

## Extensions (TASK.md §3.3) — mandatory

- [ ] **E1 — `take(n, tree)` in `O(log n)`** via `split` (size-measure variant)
  - Conceptual answer (3-5 sentences) is in `DECISIONS.md`: <link line range>
- [ ] **E2 — `getPriorityMonoid` law fix**
  - The broken law: <name>
  - Inputs that break it: <range>
  - My fix: <signature change / runtime guard / both>
  - Trade-off: <one sentence>
  - Failing-then-passing property test: <file:line>

## Self-scored rubric (fill in every row — see TASK.md §9)

| Dimension                                                            | Weight  | Your score | Justification (one line) |
| -------------------------------------------------------------------- | ------- | ---------- | ------------------------ |
| Correctness — `FingerTree.test.ts` passes & PQ behaves               | 25      | /25        |                          |
| Code quality — modularity, naming, immutability discipline, no `any` | 20      | /20        |                          |
| Tests you wrote — meaningful coverage of the PQ + edge cases         | 15      | /15        |                          |
| Benchmarks — methodology, baseline choice, reading of results        | 10      | /10        |                          |
| Design-pattern justification & `README-SOLUTION.md`                  | 15      | /15        |                          |
| Effective use of Effect, monoids, trampoline                         | 10      | /10        |                          |
| Engineering hygiene — commits, formatter, lint, PR description       | 5       | /5         |                          |
| **Total**                                                            | **100** | **/100**   |                          |

## Coverage

<!-- Paste the table from `deno task coverage`. Per-file thresholds in
     vitest.config.ts must pass. -->

```
File                       % Stmts | % Branch | % Funcs | % Lines
FingerTree.ts                ...   |    ...   |   ...   |   ...
FingerPriorityQueue.ts       ...   |    ...   |   ...   |   ...
```

## Benchmarks

<!-- Paste the summary lines from `deno task benchmark:fingerTree` and
     `deno task benchmark:fingerPriorityQueue`. Include 1-2 sentences of
     interpretation per group ("FingerPriorityQueue::push 100k is
     N× faster than the sorted-Array baseline because …"). -->

```
group push_10000
  ... ...x faster than ...

group pop_10000
  ... ...x faster than ...
```

## Design patterns — see TASK.md §6

For each pattern: where it lives, why you chose it, and one trade-off /
alternative you rejected.

- **Monoid / Measured typeclass** —
- **Persistent / immutable data structure** —
- **Trampoline / CPS** —
- **Smart constructors** —
- **Pipeable** —
- **Inspectable / structural Equal** —
- **Strategy** (`Order<P>`) —
- **Adapter** (PQ over FingerTree) —

## Anti-patterns considered & rejected

<!-- Mention briefly which non-options you weighed and why you said no. -->

## Post-mortem

**What was hardest?**

**With one extra week, I would …**

**Open questions / things I'd want feedback on:**

## Checklist

- [ ] `deno task test` passes locally
- [ ] `deno task coverage` meets the per-file thresholds in `vitest.config.ts`
- [ ] `deno task benchmark:fingerTree` and
      `deno task benchmark:fingerPriorityQueue` run cleanly
- [ ] `deno fmt --check` and `deno lint` clean
- [ ] `deno check src/index.ts` clean
- [ ] No `any`, no `// @ts-ignore`, no `as` casts (other than `as const`), no
      copy-paste from `src/internal/`
- [ ] `README-SOLUTION.md` covers every pattern in TASK.md §6 (justified **and**
      criticised)
- [ ] `DECISIONS.md` exists, has ≥ 3 dated sessions, includes both extensions
      and at least one "didn't work" entry
- [ ] Git: ≥ 10 atomic commits, spread over ≥ 2 calendar days, each green, no
      squash/force-push
- [ ] Commits follow
      [Conventional Commits](https://www.conventionalcommits.org/) and each one
      is green
