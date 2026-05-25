# README-SOLUTION.md

## Design Patterns & Justifications

### 1. Monoid / Measured

Generality is achieved by treating annotations as a Monoid. The same tree logic
handles sequences or priority queues just by swapping the `Measured` instance.

- **Alternative:** Hardcoding a "size" property into nodes.
- **Trade-off:** Every node update requires a `combine` call, adding
  constant-time overhead.

### 2. Persistent / Immutable

Every operation returns a new instance, allowing cheap historical versions.
Prepending to a 1M-element tree shares nearly all nodes with the original.

- **Alternative:** In-place mutation for speed.
- **Trade-off:** High allocation rates increase pressure on the JavaScript
  Garbage Collector.

### 3. Trampoline / CPS

Recursive operations are written in Continuation Passing Style to prevent stack
overflows on deep trees.

- **Alternative:** Converting recursive logic into complex while-loops.
- **Trade-off:** Wrapping calls in thunks makes the code slightly slower and
  harder to read.

### 4. Smart Constructors

Logic for caching annotations and rebalancing lives in `deepL`/`deepR`. This
ensures internal invariants are never broken by the public API.

- **Alternative:** Putting rebalancing logic directly inside the implementation
  classes.
- **Trade-off:** This restricts users from rebuilding trees node-by-node
  manually.

### 5. Pipeable

Implements Effect's `Pipeable` to allow functional composition like
`pipe(tree, FT.append(x), FT.tail)`.

- **Alternative:** Standard fluent method chaining (`tree.append(x).tail()`).
- **Trade-off:** Ties the implementation's API style to the Effect ecosystem.

### 6. Inspectable / Structural Equal & Hash

Used to ensure trees with the same content are seen as equal in `Sets` or
`Maps`.

- **Alternative:** Using standard JS `==` (reference equality).
- **Trade-off:** `Hash` must walk the tree ($O(n)$) to generate a consistent
  value.

### 7. Strategy

`FingerPriorityQueue` takes an `Order<P>` strategy. This allows swapping between
max and min-queues without changing the class code.

- **Alternative:** Creating separate `MaxPriorityQueue` and `MinPriorityQueue`
  classes.
- **Trade-off:** The `Order` object must be stored and passed through every
  operation.

### 8. Adapter

The PQ is an adapter that wraps the tree. It hides complex splitting logic
behind a simple `push/pop` interface.

- **Alternative:** Inheriting from the Finger Tree class.
- **Trade-off:** `pop` performs a `split` then a `concat`, making it slightly
  slower than a dedicated heap.

---

## What I Would Change with One Extra Week

1. **More PQ tests:** Add property-based tests with `fast-check` to cover edge
   cases like equal-priority FIFO ordering at scale, which is hard to hit with
   hand-written examples.
2. **Monoid law enforcement:** Fix the issue with the monoid law not being
   satisfied when the user provides an `emptyPriority` that is not actually the
   minimum value under the order.
