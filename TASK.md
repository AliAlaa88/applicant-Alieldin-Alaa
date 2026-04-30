# Internship Task — Persistent Priority Queue on a Finger Tree

> **Estimated effort:** 2 – 4 focused working days. **Stack:** TypeScript ·
> [Deno](https://deno.com) · [vitest](https://vitest.dev/) ·
> [Effect](https://effect.website) ·
> [`@effect/typeclass`](https://www.npmjs.com/package/@effect/typeclass). **What
> we judge:** code quality, design discipline, type-safety, test coverage,
> benchmark methodology, and the _justification_ of the design decisions you
> make. Working code with weak reasoning ranks below clean code with strong
> reasoning.

> **A note on AI assistants.** You may use them — we won't pretend you can't. We
> have, however, designed the rubric and the follow-up around things AI
> assistants are bad at: defending design choices live, explaining code you
> didn't write, spotting subtle algebraic bugs, hitting tight asymptotic
> targets, and producing a real commit history. Concretely: (a) submission is
> followed by a **60-min live pair-coding session** where you extend your own
> code under our criticism — code you cannot defend cannot be evaluated; (b) we
> grade against a **hidden test suite** you do not see; (c) the rubric weights
> reasoning (`DECISIONS.md` §6, PR write-up) almost as heavily as code. We have
> seen AI-only submissions and we know what they look like. Please don't waste
> your time or ours.

---

## 1. Goal

Implement, from scratch, two persistent, immutable, fully-typed data structures
in TypeScript:

1. **`FingerTree<V, A>`** — Hinze & Paterson's finger tree, parameterised by a
   measure type `V` and an element type `A`. The measure is provided by an
   instance of the `Measured<A, V>` typeclass already shipped in
   `src/utils/monoids.ts`.
2. **`FingerPriorityQueue<P, A>`** — a max-priority queue built **on top of**
   your finger tree, where the monoidal annotation is the priority and `pop` is
   implemented via `split` on the tree.

Both must be:

- **Immutable** — every operation returns a new instance; no in-place mutation,
  ever.
- **Persistent** — old versions remain valid and cheap (structural sharing).
- **Stack-safe** — recursive functions must not blow the stack on inputs of
  $10^5$ elements. Use the trampoline in `src/utils/trampoline.ts`.
- **Typed** — `tsc --strict` clean, zero `any`, zero `// @ts-ignore`.
- **Pipeable & inspectable** — instances must implement Effect's
  [`Pipeable`](https://effect-ts.github.io/effect/effect/Pipeable.ts.html) and
  [`Inspectable`](https://effect-ts.github.io/effect/effect/Inspectable.ts.html)
  interfaces so they integrate with the wider Effect ecosystem.

---

## 2. Deliverables

You write these files (they don't exist yet — that's intentional):

| File                                                   | Purpose                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/fingerTree/FingerTree.ts`                         | Your finger-tree implementation. Must export every name imported by `src/fingerTree/FingerTree.test.ts` and `src/fingerTree/FingerTree.bench.ts` (those files are the **spec** — leave them untouched).                                                                                                                                                    |
| `src/fingerTree/iterator.ts`                           | Your `FingerTreeIterator<V, A>` class — a left-to-right `IterableIterator<A>` over a `FingerTree`. The internal impl classes already call `new FingerTreeIterator(this)` from `Symbol.iterator`, so once you ship this every tree becomes iterable via `for...of`. Implement it via your own `head` + `tail` (it's a one-screen exercise once those work). |
| `src/fingerPriorityQueue/FingerPriorityQueue.ts`       | Your priority-queue implementation, built on top of your finger tree.                                                                                                                                                                                                                                                                                      |
| `src/fingerPriorityQueue/FingerPriorityQueue.test.ts`  | vitest suite covering the PQ — model it after `src/fingerTree/FingerTree.test.ts`.                                                                                                                                                                                                                                                                         |
| `src/fingerPriorityQueue/FingerPriorityQueue.bench.ts` | Deno bench suite covering the PQ — model it after `src/fingerTree/FingerTree.bench.ts`, and compare against a baseline (e.g. a sorted-array PQ) for at least the sizes 1 000, 10 000, 100 000.                                                                                                                                                             |
| `src/index.ts`                                         | Re-export both modules as named namespaces (see the existing convention).                                                                                                                                                                                                                                                                                  |
| `README-SOLUTION.md` (top-level)                       | A short (≤ 500 words) write-up: which design patterns you used, why, and what you would change with one extra week. **No code dumps** — link line ranges.                                                                                                                                                                                                  |
| `DECISIONS.md` (top-level)                             | A timestamped, append-only design diary. See §11. We read this carefully. **An empty or sparse `DECISIONS.md` is grounds for re-interview regardless of code quality.**                                                                                                                                                                                    |

The two scripts in `deno.json` are already wired up:

```bash
deno task test                       # vitest
deno task coverage                   # vitest --coverage
deno task benchmark:fingerTree       # Deno bench on src/fingerTree/FingerTree.bench.ts
deno task benchmark:fingerPriorityQueue   # Deno bench on src/fingerPriorityQueue/FingerPriorityQueue.bench.ts
```

---

## 3. Required public API

### 3.1 `FingerTree.ts` — fixed (the kept spec depends on it)

```ts
export const empty: <V, A>(m: Measured<A, V>) => FingerTree<V, A>;
export const single: <V, A>(m: Measured<A, V>, a: A) => FingerTree<V, A>;
export const fromArray: <V, A>(
  xs: ReadonlyArray<A>,
  m: Measured<A, V>,
) => FingerTree<V, A>;
export const prepend: <V, A>(t: FingerTree<V, A>, a: A) => FingerTree<V, A>;
export const append: <V, A>(t: FingerTree<V, A>, a: A) => FingerTree<V, A>;
export const head: <V, A>(t: FingerTree<V, A>) => Option<A>;
export const last: <V, A>(t: FingerTree<V, A>) => Option<A>;
export const tail: <V, A>(t: FingerTree<V, A>) => Option<FingerTree<V, A>>;
export const init: <V, A>(t: FingerTree<V, A>) => Option<FingerTree<V, A>>;
export const concat: <V, A>(
  l: FingerTree<V, A>,
  r: FingerTree<V, A>,
) => FingerTree<V, A>;
export const split: <V, A>(
  predicate: (v: V) => boolean,
  start: V,
  t: FingerTree<V, A>,
) => Option<Split<V, A>>;
export const map: <V, A, B>(
  t: FingerTree<V, A>,
  f: (a: A) => B,
  m: Measured<B, V>,
) => FingerTree<V, B>;
export const foldl: <V, A, B>(
  f: (acc: B, a: A) => B,
  init: B,
  t: FingerTree<V, A>,
) => B;
export const foldr: <V, A, B>(
  f: (a: A, acc: B) => B,
  init: B,
  t: FingerTree<V, A>,
) => B;
```

Use the type aliases in `src/internal/fingerTree/` (`FingerTree`, `Empty`,
`Single`, `Deep`, `Affix`, `Node`, `Split`) — **import them**, do not redefine
them.

In addition to the functions above, you ship `src/fingerTree/iterator.ts`
exporting:

```ts
export class FingerTreeIterator<V, A> implements IterableIterator<A> {
  constructor(tree: FingerTree<V, A>);
  next(): IteratorResult<A>;
  [Symbol.iterator](): IterableIterator<A>;
}
```

The internal classes already wire this in via `Symbol.iterator`; you do not need
to touch them. The natural implementation is one screen long: each `next()`
reads `head(current)` and replaces `current` with `tail(current)`, stopping when
the tree is empty. Eager flatten via `foldl` works but loses incremental
laziness — mention the trade-off in `DECISIONS.md`.

### 3.2 `FingerPriorityQueue.ts` — design freedom, minimum surface

```ts
export const empty: <P, A>(
  order: Order<P>,
  emptyPriority: P,
) => FingerPriorityQueue<P, A>;
export const fromArray: <P, A>(
  xs: ReadonlyArray<{ priority: P; item: A }>,
  order: Order<P>,
  emptyPriority: P,
) => FingerPriorityQueue<P, A>;
export const push: <P, A>(
  q: FingerPriorityQueue<P, A>,
  item: A,
  priority: P,
) => FingerPriorityQueue<P, A>;
export const pop: <P, A>(
  q: FingerPriorityQueue<P, A>,
) => Option<[{ priority: P; item: A }, FingerPriorityQueue<P, A>]>;
export const peek: <P, A>(
  q: FingerPriorityQueue<P, A>,
) => Option<{ priority: P; item: A }>;
export const size: <P, A>(q: FingerPriorityQueue<P, A>) => number;
```

Use [`getPriorityMonoid`](src/utils/monoids.ts) — already provided. The PQ is a
thin wrapper: `pop` is `split` against the tree's annotation (the maximum
priority). FIFO order among equal priorities is required.

### 3.3 Required extensions (these are the discriminators)

These two tasks are **not** in Hinze & Paterson and are not directly Google-able
as a single answer. They test that you understand the abstractions, not just
that you can reproduce an algorithm.

**E1 — `take(n, tree)` in `O(log n)`.** Implement

```ts
export const take: <A>(
  n: number,
  t: FingerTree<number, A>,
) => FingerTree<number, A>;
```

over a tree that has been built with a **size measure** (`Measured<A, number>`
with `measure = () => 1`, `combine = (a, b) => a + b`, `empty = 0`). The
implementation must use `split`. In `DECISIONS.md`, answer in 3-5 sentences:
_why does this only work for the size-measure variant, and what does that tell
you about the role of the measure in finger trees?_ A correct working `take`
that does **not** use `split` (e.g. fold-and-rebuild) earns half marks; a `take`
that uses `split` but cannot answer the conceptual question earns half marks.

**E2 — fix the monoid-law bug in `getPriorityMonoid`.** The supplied
`getPriorityMonoid` in `src/utils/monoids.ts` violates one of the monoid laws
for a non-trivial range of inputs. Find it, write a single failing
`fast-check`-style property test that exposes it, fix the implementation (or the
signature, or both — your choice), and explain in `DECISIONS.md` _which law
breaks, for which inputs, why, and what your fix's trade-off is_. A fix that
tightens the type signature so the bug becomes statically impossible scores
higher than a runtime guard.

Both extensions are graded under §9 "Correctness" (hard floor: any extension
left un-attempted = automatic −10 from your final score) and "Design-pattern
justification" (hard floor: empty `DECISIONS.md` for these = −10 more).

---

## 4. Reference-reading policy (read this carefully)

| Path                                 | Read                                                                                    | Import                                                                                                                   | Copy                                                                                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/internal/fingerTree/**`         | ✅ encouraged — study the type IDs, the `Affix`/`Node` algebra, the predicate functions | ✅ for **types and predicates only** (`FingerTree`, `Empty`, `Single`, `Deep`, `Split`, `isEmpty`, `isSingle`, `isDeep`) | ❌ **No.** We will diff against the upstream. Copying the algorithm bodies (`pushLeft`, `pushRight`, `viewLeft`, `viewRight`, `app3`, `splitTree`, `nodes`, etc.) is a hard fail. |
| `src/utils/monoids.ts`               | ✅                                                                                      | ✅ via `@monoids`                                                                                                        | n/a — it's a tiny utility, just import it                                                                                                                                         |
| `src/utils/trampoline.ts`            | ✅                                                                                      | ✅ via `@trampoline`                                                                                                     | n/a                                                                                                                                                                               |
| `src/fingerTree/FingerTree.test.ts`  | ✅                                                                                      | n/a                                                                                                                      | ❌ do not modify it — it is the acceptance spec                                                                                                                                   |
| `src/fingerTree/FingerTree.bench.ts` | ✅                                                                                      | n/a                                                                                                                      | ❌ do not modify it (you may _add_ benches in a sibling file)                                                                                                                     |

---

## 5. Code style (hard rules unless noted)

- **Formatter:** `deno fmt` — tabs (default), 100-col soft wrap. Run before
  every commit.
- **Linter:** `deno lint` — must pass. The repo excludes `ban-ts-comment` and
  `no-explicit-any` at the project level; **you may not exploit those
  exclusions** in your own files (treat `any` as banned).
- **TypeScript:** `strict: true`. No `any`, no non-null assertion (`!`) except
  inside obviously-total arithmetic, **no `as` casts at all**. We grep for
  `\bas\s+[A-Z]`. The one exception is the `as const` literal-narrowing form —
  it's allowed because it doesn't lie to the compiler. If you find a place where
  you genuinely cannot carry the type without `as`, that is a signal your model
  of the data is wrong; either rework the algebra (a discriminated union usually
  fixes it) or document the unavoidable case in `DECISIONS.md` and accept the
  score hit.
- **Module shape:** small focused files. One data type per file. Pure functions
  exported at module top level (`export const fn = …`); methods on the class
  limited to typeclass instances (`Pipeable`, `Inspectable`, `Equal`, `Hash`,
  `Symbol.iterator`).
- **Effect imports:** `import * as O from "effect/Option"` /
  `import * as Order from "effect/Order"` — namespace imports, never default
  imports. Use `Option` for partial results (`head`, `last`, `pop`, `split`);
  never throw for "not found".
- **Recursion:** any function whose recursion depth is bounded by `O(log n)`
  over a 100 000-element tree must be wrapped with
  [`trampoline`](src/utils/trampoline.ts) and chained with `Trampoline.flatMap`.
- **Equality & hashing:** instances must satisfy `Equal.equals` structurally and
  `Hash.hash` consistently — see how `EmptyImpl` / `SingleImpl` / `DeepImpl` in
  `src/internal/fingerTree/FingerTree.ts` set this up (you will follow the same
  pattern in your own classes; _read_, do not _copy_).
- **Comments:** TSDoc on every exported symbol. State complexity
  (`@complexity O(log n)` amortised). Cite the Hinze–Paterson section number
  where the algorithm comes from.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/).
  Small, atomic, green at every commit (`deno task test`).

---

## 6. Design patterns you must demonstrate

For each one, justify it in `README-SOLUTION.md` (≤ 3 sentences each) and **also
criticise it** (one alternative, one trade-off):

| Pattern                                   | Where it lives                                                                  | Hint                                                                                |
| ----------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Monoid / Measured typeclass**           | `Measured<A, V>` from `@monoids` is the algebra of annotations                  | Why is "measure as monoid" the _one_ design choice that makes finger trees general? |
| **Persistent / immutable data structure** | every operation returns a new tree                                              | What's the structural-sharing factor for `prepend` on a 1 M-element tree?           |
| **Trampoline / CPS**                      | `@trampoline` for stack-safe `concat`/`split`/`map`                             | Why CPS over plain tail calls in TS?                                                |
| **Smart constructors**                    | `empty`, `single`, `deep` (private)                                             | Why hide raw class constructors behind functions?                                   |
| **Pipeable**                              | `pipe()` on every instance — `effect/Pipeable`                                  | What does this give a downstream Effect user?                                       |
| **Inspectable / structural Equal**        | `effect/Inspectable` + `effect/Equal` + `effect/Hash`                           | Why bother — what breaks in `Set`/`HashMap` if you skip these?                      |
| **Strategy**                              | `Order<P>` injected into `getPriorityMonoid` makes the PQ a max- _or_ min-queue | One-line code change to swap min ↔ max. Show it.                                    |
| **Adapter**                               | `FingerPriorityQueue` is an adapter of `FingerTree` to a queue interface        | Why is this a one-day project once the tree is correct?                             |

**Anti-patterns** to avoid (mention briefly that you considered & rejected
them):

- mutable in-place updates "for performance" → you've defeated persistence;
- `class extends FingerTree` to add the priority queue → composition over
  inheritance;
- a global `Order<P>` singleton → kills the Strategy pattern's value.

---

## 7. The illustrative scenario (NOT a deliverable — do not implement)

Read it only to ground your intuition for _why_ a measured priority queue is
interesting:

> A web scraper owns a pool of HTTP proxies. Each proxy may be used `N` times
> before it must cool down for `T` seconds. A worker picks the next proxy by
> sampling **at random**, biased toward the "freshest" (longest-cooled-down,
> most-uses-remaining) proxy currently eligible.

A finger-tree-backed priority queue with `priority = freshness_score` makes both
the eligibility query (`split` on a cooldown predicate) and the "pop best"
operation cheap and composable. **Don't build the scraper** — your task is the
data structure.

---

## 8. Acceptance criteria (must all pass)

1. `deno task test` → all green, **zero** skipped, coverage ≥ **90% lines / 75%
   branches** on each of `src/fingerTree/FingerTree.ts` and
   `src/fingerPriorityQueue/FingerPriorityQueue.ts`. Branch coverage below 100%
   is acceptable when the only uncovered branches are _defensive throws_
   unreachable from the public API (e.g.
   `throwIllegalArgumentException("Invalid FingerTree")` after exhaustive
   `isEmpty / isSingle / isDeep` discrimination). Document any such gap in
   `README-SOLUTION.md`. (You may _add_ tests; you may **not** remove or weaken
   `src/fingerTree/FingerTree.test.ts`.)
2. `deno task benchmark:fingerTree` runs to completion, no thrown errors. Your
   numbers should be within ~2× of the inline reference sample in §13 (machine
   class: a modern x86_64 laptop).
3. `deno task benchmark:fingerPriorityQueue` runs to completion and shows
   `FingerPriorityQueue::push N` is **faster** than a sorted-`Array` baseline
   for `N ≥ 10 000`.
4. `deno fmt --check` and `deno lint` both clean.
5. `tsc --noEmit` (run via your editor / `deno check src/index.ts`) — zero
   errors.
6. `README-SOLUTION.md` exists and addresses every pattern in §6.

---

## 9. Scoring rubric (out of 100)

| Dimension                                                                       | Weight  | What it means                                                                |
| ------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------- |
| Correctness — `FingerTree.test.ts` passes & PQ behaves                          | 25      | Hard floor: <25 here = no-hire regardless of the rest.                       |
| Code quality — modularity, naming, immutability discipline, no `any`            | 20      | We grep for `any`, `!`, `as`, `// @ts-`.                                     |
| Tests you wrote — meaningful coverage of the PQ + edge cases                    | 15      | Equal-priority FIFO, empty pop, immutability, large-scale, `peek` semantics. |
| Benchmarks — methodology, baseline choice, reading of results in PR description | 10      | "Numbers without interpretation" loses half the points.                      |
| Design-pattern justification & `README-SOLUTION.md`                             | 15      | Each of §6 mentioned, justified, criticised.                                 |
| Effective use of Effect, monoids, trampoline                                    | 10      | Idiomatic; not bolted on.                                                    |
| Engineering hygiene — commits, formatter, lint, PR description                  | 5       | Conventional commits, atomic, green at each commit.                          |
| **Total**                                                                       | **100** |                                                                              |

---

## 10. Resources

### Finger trees (the paper and the lecture)

- Hinze & Paterson, _Finger Trees: A Simple General-Purpose Data Structure_
  (JFP 2006) — the canonical paper. **Read at minimum §3 and §4.**
  https://www.staff.city.ac.uk/~ross/papers/FingerTree.pdf
- Wikipedia overview (warm-up, not enough by itself):
  https://en.wikipedia.org/wiki/Finger_tree

### Effect modules you will actually need (don't try to learn all of Effect)

- `effect/Option` (docs): https://effect.website/docs/data-types/option/
- `effect/Option` (source):
  https://effect-ts.github.io/effect/effect/Option.ts.html
- `effect/Order` (source):
  https://effect-ts.github.io/effect/effect/Order.ts.html
- `effect/Pipeable` (source):
  https://effect-ts.github.io/effect/effect/Pipeable.ts.html
- `effect/Inspectable` (source):
  https://effect-ts.github.io/effect/effect/Inspectable.ts.html
- `effect/Equal` (source):
  https://effect-ts.github.io/effect/effect/Equal.ts.html
- `effect/Hash` (source): https://effect-ts.github.io/effect/effect/Hash.ts.html
- `@effect/typeclass/Monoid`:
  https://effect-ts.github.io/effect/typeclass/Monoid.ts.html
- Lukas Barake on `Order` (10 min, watch this — short and on point):
  https://www.youtube.com/watch?v=wqMaijl4bJ4

### Tooling

- Deno bench: https://docs.deno.com/runtime/fundamentals/testing/#benchmarking ·
  API: https://docs.deno.com/api/deno/~/Deno.bench
- vitest: https://vitest.dev/
- Conventional Commits: https://www.conventionalcommits.org/

### Background reading (optional but valuable)

- Okasaki, _Purely Functional Data Structures_ — chapter on amortised analysis &
  lazy evaluation.
- Effect website overview: https://effect.website/

---

## 11. Submission

1. Fork or branch — name it `applicant/<your-name>`.
2. Implement.
3. Open a Pull Request whose description contains:
   - the rubric (§9) with your **own** honest score per row + one-line
     justification per row;
   - the bench results table in markdown (paste the `deno bench` output, summary
     lines included);
   - a short **post-mortem**: what was hardest, what would you do with one extra
     week.
4. **Do not push your `README-SOLUTION.md` reasoning into commit messages** —
   keep commits focused on the code; the prose lives in the file.

### 11.1 Git history (hard requirements)

We read your `git log`. It is part of how we tell whether you _understand_ what
you shipped or whether you assembled it.

- **At least 10 commits**, each one passing `deno task test` (we'll spot-check
  via `git bisect`). A single "first commit" containing the whole solution is an
  automatic rejection.
- **Spread over at least 2 calendar days** (timestamped via
  `git log --format=%cI`). We accept that you might do most of the work on day 1
  and polish on day 2; we don't accept commits all within a 30-minute window.
- **No squash, no force-push** on the PR branch. We want to see the rough edges.
- **Conventional Commits** (already required in §5).
- **Atomic commits**: `feat(fingerTree): implement viewLeft`, not `wip` or
  `everything`.

### 11.2 `DECISIONS.md` format

Append-only, one section per work session, dated. Each section answers _at
minimum_:

```md
## 2025-MM-DD HH:MM — <session goal>

**What I tried:** ... **What worked:** ... **What didn't and why:** ... **Open
questions for the reviewer:** ...
```

We especially want to see the **didn't-work** parts. A `DECISIONS.md` whose
every entry is "implemented X cleanly, all tests passed first try" reads as
fabricated — flag for re-interview. Real engineering has dead-ends; show them.

---

## 12. FAQ

**Q: Can I implement `FingerTree` with arrays of length 2–4 instead of explicit
`One/Two/Three/Four` affix variants?** A: Yes — but justify it in §6 (it changes
the trade-off between code volume and JIT-friendliness; we'll judge the
justification, not the choice).

**Q: Do I have to support arbitrary measure types, or just numeric priorities?**
A: Arbitrary, parameterised by `Measured<A, V>`. The priority queue is one
_instance_; the tree itself must be measure-polymorphic.

**Q: Can I use `Effect` (the effect runtime) to model failure?** A: For this
task, prefer `Option` / `Either` over `Effect` — these structures are pure data,
not effectful. Using `Effect` for `pop` would be over-engineering and will cost
you points under §6's "criticise it" rule.

**Q: Is the proxy pool scenario in §7 a deliverable?** A: **No.** It's an
illustration of why the data structure is useful. Building it loses you time you
should spend on tests and benchmarks.

**Q: Can I use a different priority-queue algorithm (e.g. pairing heap, leftist
tree) inside `FingerPriorityQueue.ts`?** A: No — the whole point is that the PQ
is built **on top of the finger tree** via the measured-monoid trick. A
different inner data structure misses the assignment.

**Q: My benchmark numbers are 3× slower than the §13 reference sample.** A:
First, check you're actually trampolining the recursive ops. Second, check
you're not allocating intermediate arrays in `concat`/`split`. Third — note in
your PR; we care more about the methodology than the absolute number.

**Q: The kept tests import `isDeep`, `isEmpty`, `isSingle` from
`@internal/fingerTree/FingerTree`. Is that allowed?** A: Yes — they are
_predicates over the type_, not _the algorithm_. Read §4 again.

**Q: Can I split `FingerTree.ts` into multiple files?** A: Yes, as long as
`src/fingerTree/FingerTree.ts` re-exports the required public API.

---

## 13. Appendix — sample expected `deno bench` output

The first ~30 lines of `out.log` (reference run, 13th-gen i7-13700K, Deno
2.7.12):

```text
group empty_1000
| FingerTree::empty 1000         |  17.0 ns | 58,740,000 |

group single_1000
| FingerTree::single 1000        |  14.9 ns | 66,940,000 |

group fromArray_1000
| FingerTree::fromArray 1000     | 181.7 µs | 5,505 |

group prepend_1000
| FingerTree::prepend 1000       |  56.5 ns | 17,710,000 |
| Array::prepend 1000            |   3.0 µs |    334,100 |
summary
  FingerTree::prepend 1000   53.00x faster than Array::prepend 1000

group append_1000
| FingerTree::append 1000        |  81.0 ns | 12,350,000 |
| Array::append 1000             |   1.1 µs |    881,800 |
summary
  FingerTree::append 1000   14.00x faster than Array::append 1000
```

Use this as a sanity check, not a hard target — your numbers will vary with
hardware and noise.

---

Good luck. We're looking forward to reading your reasoning.
