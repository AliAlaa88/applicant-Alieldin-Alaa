# DECISIONS.md

## 2025-05-17 16:00 — Exploring Functional Programming Rules

**What I tried:** I started by studying the general rules of functional
programming. I looked into immutability, pure functions, and persistent data
structures. I wanted to understand the patterns before looking at the code.

**What worked:**

- Reading about algebraic data types and structural sharing made the goal of the
  project much clearer.
- Understanding persistent data structures showed me how to return new versions
  of data without expensive copying.

**What didn't and why:**

- I initially struggled with how to handle deep recursion in a functional way
  without using loops, but then I found information on trampolining.
- Thinking without mutation was hard at first; I kept thinking of "update"
  properties instead of creating new instances.

**Open questions for the reviewer:**

- Is there a specific limit on how many helper functions I should use to keep
  functions pure?
- In persistent structures, how do we balance object allocation with the need
  for immutable updates?

**Resources used:**

- [Software Patterns Lexicon — Functional](https://softwarepatternslexicon.com/functional/)

---

## 2025-05-18 22:00 — Forking and Paper Deep Dive

**What I tried:** I forked the repository at 10 PM. I spent the session reading
the Hinze & Paterson paper and watching the Scale By The Bay lecture. I also
looked at existing implementations to see how others handled the complex spine
logic.

**What worked:**

- Comparing the Haskell code in the paper with the JavaScript implementation in
  `fingertree.js` helped me map the types to TypeScript.
- Visualizing the "spine" as a nested tree of nodes helped me understand why
  recursion is necessary.

**What didn't and why:**

- The paper is very academic. I had to read the every function several times to
  understand the symbols and annotations.
- I was confused by "Digits" being represented as lists in the paper versus the
  strict `One/Two/Three/Four` types in our internal code.

**Open questions for the reviewer:**

- The paper says digits are usually length 2 or 3, but our code allows length 1
  to 4. Does this change how I should think about the amortized cost?

**Resources used:**

- [Finger Trees Paper (Hinze & Paterson)](https://www.staff.city.ac.uk/~ross/papers/FingerTree.pdf)
- [Scale By The Bay 2020: Vlad Patryshev Video](https://www.youtube.com/watch?v=KzIAs_I7-Vw)
- [Finger Trees in JS (ObservableHQ)](https://observablehq.com/@vpatryshev/finger-trees-in-js)
- [Wikipedia — Finger Tree](https://en.wikipedia.org/wiki/Finger_tree)
- [qiao/fingertree.js (GitHub)](https://github.com/qiao/fingertree.js/blob/master/src/fingertree.js)

---

## 2025-05-19 19:30 — Internal Logic and Utils Exploration

**What I tried:** I explored the `src/internal/fingerTree/` folder. I looked at
how `nodes.ts` and `types.ts` define the structure. I also studied `monoids.ts`
to see how the `Measured` interface works and `trampoline.ts` for the
stack-safety requirement.

**What worked:**

- Understanding that the `Deep` node is the heart of the structure was a
  breakthrough. The types provided in the repo are very strict, which helps
  prevent mistakes.
- Caching the monoid `annotation` inside each node makes it very fast to query
  the tree's state.

**What didn't and why:**

- I tried to write a new monoid for strings to test my understanding, but I
  realized the task is to keep the tree polymorphic for any V.

**Open questions for the reviewer:**

- Does the performance change significantly if the combine operation of the
  monoid is expensive (like string concatenation vs. number addition)?
- How do we ensure the Monoid Identity law is respected when the user provides a
  custom `empty` value?

**Resources used:**

- internal files (`nodes.ts`, `monoids.ts`, `trampoline.ts`)

---

## 2025-05-20 20:00 — Wiring Simple Operations

**What I tried:** I implemented the easy functions: `empty`, `single`,
`fromArray`, `prepend`, and `append`. I used the `isOne`, ...etc. predicates
from the internal files.

**What worked:**

- Using the CPS (Continuation Passing Style) approach for `prepend` and `append`
  made them stack-safe.
- Implementing symmetric logic for both ends of the tree (left and right)
  ensured the Deque properties were maintained.

**What didn't and why:**

- I almost forgot to wrap the recursive calls in `trampoline`. I caught this
  while checking the `TASK.md` rules again.
- TypeScript narrowing failed when I tried to access digit properties without
  using the provided `isFour` type guards.

**Open questions for the reviewer:**

- Is there a significant performance overhead when using CPS trampolines
  compared to standard tail-call optimization?
- Is the amortized $O(1)$ performance visible in small tests, or should I wait
  for the benchmarks?

**Resources used:**

- `TASK.md` (§5 on Recursion)

---

## 2025-05-21 21:00 — Views and Deconstruction

**What I tried:** I implemented `head`, `last`, `tail`, and `init`. These
require looking at the prefixes and suffixes and sometimes "pulling" nodes from
the `deeper` tree.

**What worked:**

- The logic for `tail` and `init` is very similar but mirrored. Once I got
  `tail` working, `init` was easy.
- Using `effect/Option` for the return types made the empty-tree cases very
  clean and safe.

**What didn't and why:**

- Handling the case where the prefix is `One` and the `deeper` tree is `Empty`
  was tricky. I had to make sure the tree collapses back to a `Single` node or
  `Empty`.
- I initially struggled with "re-balancing" the tree when deconstructing the
  last node of a spine level.

**Open questions for the reviewer:**

- Is `O.getOrThrow` acceptable inside internal logic if I have already checked
  `isEmpty`?

**Resources used:**

- Hinze & Paterson (§3.2 Deque operations)

---

## 2025-05-22 22:00 — Concatenation and API Discussion

**What I tried:** I implemented the `concat` function and the `app3` helper.

**Interviewer Discussion:** I realized that the `concat` method was missing a
way to handle the middle elements during recursion. I discussed this with the
interviewer. I realized it was an oversight in the initial API. I added a
default `_mid` parameter to `concat` to make the recursion work.

**What worked:**

- Using a `makeNodes` helper to group middle elements into `Node2` or `Node3`
  made the `app3` logic much cleaner.
- Recursive spine merging allowed two large trees to be combined in logarithmic
  time.

**What didn't and why:**

- I initially tried to concatenate without `app3`, but it is impossible to
  maintain the `O(log n)` bound without the middle elements logic.

**Open questions for the reviewer:**

- In the app3 recursion, we sometimes create many small intermediate arrays. Is
  the performance hit from these allocations acceptable for the sake of clear
  functional logic?

**Resources used:**

- Hinze & Paterson (§3.3 Concatenation)

---

## 2025-05-23 16:00 — Splitting and Commit Strategy

**What I tried:** I implemented `split`, `splitTree`, and `splitDigit`. I spent
a lot of time on corner cases where the split happens exactly at a node
boundary.

**Interviewer Discussion:** I asked if I should commit the whole `FingerTree.ts`
file at once or break it up. We agreed it is okay to commit the whole file to
ensure all tests are "green", as long as I don't do the other deliverables in
the same commit.

**What worked:**

- The `splitDigit` helper works well for both prefixes and suffixes by
  accumulating the monoid value.
- Returning a `Split` object with the `left`, `value`, and `right` parts makes
  the API very easy to be used by the Priority Queue.

**What didn't and why:**

- I had to fix several errors in the split logic when the predicate becomes true
  exactly at the start of a deep tree.

**Open questions for the reviewer:**

- Does the `take` extension need its own test file?
- Should I use a separate commit for the `DECISIONS.md` file every day, or is
  one final commit acceptable?

**Resources used:**

- Hinze & Paterson (§4.4 Splitting)

## 2025-05-24 22:00 — Iterator and Priority Queue Implementation

**What I tried:**

- I created the FingerTreeIterator to satisfy the IterableIterator interface
  using the tree's public viewing methods.
- I implemented the FingerPriorityQueue as an Adapter over the FingerTree as
  described in Hinze & Paterson 4.6.
- I integrated the Prioritized<P, A> type to bundle items with their priorities
  within the tree structure.

**What worked:**

- Using the Adapter Pattern allowed me to reuse the FingerTree logic, keeping
  the queue implementation thin and composable.
- The FIFO requirement for equal priorities was satisfied by combining append
  with the left-to-right behavior of the split.
- Implementing the Iterator via head and tail maintained incremental laziness,
  ensuring that large trees are not flattened into memory all at once.

**What didn't and why:**

- The code initially used import type for the Effect Option module, which caused
  runtime errors because functions like O.map were removed during compilation. I
  had to switch to a standard import.

**Open questions for the reviewer:**

- Should the FingerPriorityQueue implement its own Equal and Hash logic based on
  the elements?

**Resources used:**

- Hinze & Paterson §4.6 (Priority Queues)
- effect/Option and effect/Pipeable documentation
- Repository internal files (FingerTree.ts predicates)

---

## 2025-05-25 13:00 — Implementing the Take Extension (E1)

**What I tried:**

- I implemented the take(n, t) function to extract the first n elements from a
  tree in O(log n) time using the split operation.
- I focused on the size-measure requirement, where each element counts as 1 and
  the monoid is addition.

**What worked:**

- Using `v > n` as the split predicate. In a size-measured tree, the first
  element that makes the sum greater than `n` is the `n+1` element. This ensures
  that the `left` of the split result contains `n` elements.
- Optimizing the function by checking `n >= t.annotation` at the start. This
  allows returning the original tree without performing a split operation when
  `n` is larger than or equal the tree.

**What didn't and why:**

- I initially tried using `v >= n` and then `append` the split value to the left
  tree. While that works, the `v > n` approach is more optimized as it returns
  the correct answer within the `left` property of the `Split` result.

**Open questions for the reviewer:**

- Is it better to return the original tree t if n is greater than the tree size,
  or should we explicitly rebuild it from the split components for consistency?

---

## 2025-05-25 17:00 — FPQ Tests and Benchmarks

**What I tried:**

- I wrote a Vitest suite for the `FingerPriorityQueue` to verify the priority
  queue requirements.
- I implemented a Deno benchmark suite to compare the FPQ against a sorted
  `Array` baseline.
- I created a custom seeded random generator to ensure that benchmark runs are
  reproducible.

**What worked:**

- The tests confirmed that using `FT.append` for insertion and `FT.split` for
  extraction correctly yields the leftmost element when priorities are equal.
- The benchmarks successfully showed that while `Array` is fast for small sizes,
  the `FingerPriorityQueue` outperforms it at large ones due to O(log n)
  complexity.

**What didn't and why:**

- I initially considered using the built-in random function, but realized it
  violates the requirement in the task. I replaced it with a seeded state.

**Open questions for the reviewer:**

- In the benchmark, the `Array::push` uses a full `.sort()` O(n log n). Would a
  binary search insertion O(n) be a more fair baseline, or is the goal simply to
  show the Finger Tree's logarithmic advantage?

## Extensions

### E1 — `take(n, tree)` in O(log n)

Implemented in
[`FingerTree.ts` L726–734](src/fingerTree/FingerTree.ts#L726-L734) using `split`
with the predicate `v > n`.

This only works for the size measure because that measure counts elements, so
the accumulated annotation at any node is exactly "how many elements are to the
left". With a priority measure, the annotation is the maximum priority in a
subtree, which tells you nothing about position.

### E2 — Monoid law bug in `getPriorityMonoid`

A monoid must satisfy three laws: associativity, left identity
(`combine(empty, x) = x`), and right identity (`combine(x, empty) = x`). The
`getPriorityMonoid` breaks the identity laws when the user passes an
`emptyPriority` that is not actually the minimum value under the order. Since
`combine` always returns the larger of two values, an `emptyPriority` that is
larger than some real priorities will win and cause those elements to be
ignored.

I understood the problem, the `empty` of a max-monoid must be a bottom element,
smaller than everything else. For numbers that's `-Infinity`. The issue is I
couldn't find a clean way to enforce this in the type system.
