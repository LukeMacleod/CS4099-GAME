# Figure 4.4-Style BFS Summary for Lobster Pathfinding

## Clean Example (No Obstacles)

This shows BFS execution on a simplified hexagonal grid with NO blocked vertices, demonstrating pure layer-by-layer exploration until the first boundary is reached.

---

## Table: BFS Execution Trace

```
┌─────────────────────┬──────────────────────────────────────┐
│  Order of           │  Queue contents                      │
│  visitation         │  after processing node               │
├─────────────────────┼──────────────────────────────────────┤
│  L (lobster start)  │  [N₁, N₂, N₃, N₄, N₅, N₆]           │
│  N₁                 │  [N₂, N₃, N₄, N₅, N₆, N₇, N₈]       │
│  N₂                 │  [N₃, N₄, N₅, N₆, N₇, N₈, N₉]       │
│  N₃                 │  [N₄, N₅, N₆, N₇, N₈, N₉, E₁]       │
│  N₄                 │  [N₅, N₆, N₇, N₈, N₉, E₁, E₂]       │
│  N₅                 │  [N₆, N₇, N₈, N₉, E₁, E₂, E₃]       │
│  N₆                 │  [N₇, N₈, N₉, E₁, E₂, E₃, E₄]       │
│  N₇                 │  [N₈, N₉, E₁, E₂, E₃, E₄, E₅]       │
│  N₈                 │  [N₉, E₁, E₂, E₃, E₄, E₅]           │
│  N₉                 │  [E₁, E₂, E₃, E₄, E₅]               │
│  E₁ (boundary!)     │  STOP - boundary reached             │
└─────────────────────┴──────────────────────────────────────┘
```

**Legend:**
- `L` = Lobster's starting position (source vertex `s`)
- `Nᵢ` = Internal vertices at various distances
- `Eᵢ` = Boundary vertices (escape points)
- Queue uses FIFO: `shift()` removes from front, `push()` adds to back

---

## BFS Spanning Tree (Parent-Child Relationships)

```
                         L (start)
                    _____|_____
                   /  /  |  \  \
                  /  /   |   \  \
                 N₁ N₂  N₃  N₄  N₅  N₆    ← Distance 1 (6 hex neighbors)
                 |   |   |   |   |   |
                 N₇  N₈  N₉  N₁₀ N₁₁ N₁₂   ← Distance 2
                     |
                     E₁ ← Distance 3 (BOUNDARY - algorithm stops)
```

**Shortest Path (via parent pointers):**
```
L → N₂ → N₈ → E₁
```

**Key Properties:**
- Each vertex appears exactly once (no cycles)
- Edges point from parent to child
- All paths from L are shortest paths
- First boundary vertex found (E₁) is guaranteed to be on shortest path

---

## Detailed Example for YOUR Diagram

Here's a concrete example matching your 5×7 simplified grid:

### Simplified Scenario (No Rocks)

**Initial State:**
- Grid: 5 columns × 7 rows = 35 vertices
- Lobster at center: position (2, 3)
- No blocked vertices
- Boundary: all vertices where x=0, x=4, y=0, or y=6

### Execution Table

```
┌──────────────┬────────────────────────────────┬──────────┐
│ Vertex       │ Queue after processing         │ Distance │
├──────────────┼────────────────────────────────┼──────────┤
│ (2,3) START  │ [(1,3),(3,3),(2,2),(2,4),     │    0     │
│              │  (1,2),(3,4)]                  │          │
├──────────────┼────────────────────────────────┼──────────┤
│ (1,3)        │ [(3,3),(2,2),(2,4),(1,2),     │    1     │
│              │  (3,4),(0,3),(1,2),(1,4)]     │          │
├──────────────┼────────────────────────────────┼──────────┤
│ (3,3)        │ [(2,2),(2,4),(1,2),(3,4),     │    1     │
│              │  (0,3),(1,2),(1,4),(4,3),     │          │
│              │  (3,2),(3,4)]                  │          │
├──────────────┼────────────────────────────────┼──────────┤
│ (2,2)        │ [...,(1,1),(2,1),(3,2)]       │    1     │
├──────────────┼────────────────────────────────┼──────────┤
│ (2,4)        │ [...,(1,4),(2,5),(3,4)]       │    1     │
├──────────────┼────────────────────────────────┼──────────┤
│    ...       │           ...                  │   ...    │
├──────────────┼────────────────────────────────┼──────────┤
│ (2,1)        │ [...,(1,0),(2,0),(3,0)]       │    2     │
├──────────────┼────────────────────────────────┼──────────┤
│    ...       │           ...                  │   ...    │
├──────────────┼────────────────────────────────┼──────────┤
│ (2,0) **E**  │ **STOP** (y=0, boundary!)     │  **3**   │
└──────────────┴────────────────────────────────┴──────────┘
```

**Shortest Path:** (2,3) → (2,2) → (2,1) → (2,0)
**Path Length:** 3 steps

---

## ASCII Tree Diagram (Clean, No Rocks)

```
                        (2,3) L
                    ______|______
                   /      |      \
                  /       |       \
            (1,3)      (2,2)      (3,3)     ← Distance 1
           /    \        |         /   \
          /      \       |        /     \
      (0,3)E   (1,2)  (2,1)   (3,2)   (4,3)E  ← Distance 2
                 |       |       |
              (1,1)   (2,0)E  (3,1)           ← Distance 3
                       ^^^^
                    BOUNDARY!
                  Algorithm stops
```

**Shortest Path Highlighted:**
```
L (2,3)
  └─→ (2,2)  [Distance 1]
       └─→ (2,1)  [Distance 2]
            └─→ (2,0) E  [Distance 3] ✓ FOUND!
```

---

## How to Visualize This for Your Dissertation

### Option 1: Side-by-Side Layout (Like Textbook Fig 4.4)

```
┌─────────────────────────────────────────────────────┐
│  Table                    │   Tree                  │
│  ────────────────────     │   ──────────────        │
│  Order │ Queue             │          L              │
│  ─────────────────         │      ____|____         │
│  L     │ [N₁...N₆]         │     /    |    \        │
│  N₁    │ [N₂...N₇]         │   N₁    N₂    N₃      │
│  N₂    │ [N₃...E₁]         │         |              │
│  ...   │ ...               │        E₁              │
│  E₁    │ STOP              │                         │
└─────────────────────────────────────────────────────┘
```

### Option 2: Stacked Layout (Better for narrow pages)

```
┌─────────────────────────────────────┐
│         BFS Execution Table         │
│  ─────────────────────────────────  │
│  Vertex  │  Queue  │  Distance      │
│  ──────────────────────────────     │
│    L     │  [...]  │     0          │
│    N₁    │  [...]  │     1          │
│    E₁    │  STOP   │     3          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│         BFS Spanning Tree           │
│  ─────────────────────────────────  │
│              L                      │
│         _____|_____                 │
│        /     |     \                │
│       N₁    N₂    N₃               │
│             |                       │
│            E₁ (boundary)            │
└─────────────────────────────────────┘
```

---

## Code Mapping (Your Implementation)

### Queue Operations (Lines 752, 760, 786)

```javascript
const queue = [startKey];        // Initialize: Q = [L]

while (queue.length > 0) {
    const key = queue.shift();   // FIFO: dequeue from front
    // ... process vertex ...
    queue.push(nk);              // Enqueue neighbors at back
}
```

**Matches textbook:**
- `eject(Q)` ≡ `queue.shift()`
- `inject(Q, v)` ≡ `queue.push(nk)`

### Visitation Order

The table's "Order of visitation" column shows the sequence in which `queue.shift()` returns vertices. This is EXACTLY the order BFS processes vertices.

### Parent Pointers (Lines 753-754, 785)

```javascript
const parent = new Map();
parent.set(startKey, null);       // L has no parent
// ...
parent.set(nk, key);              // Child → Parent mapping
```

The tree diagram shows these parent-child relationships visually.

---

## Figure Caption (for dissertation)

**Figure X: BFS Execution Summary for Lobster Pathfinding (Unobstructed Case)**

Left: Trace of BFS execution showing the order in which vertices are visited and the queue state after processing each vertex. The algorithm terminates when the first boundary vertex (E₁) is dequeued, guaranteeing a shortest path. Right: The resulting BFS spanning tree showing parent-child relationships. All edges in the tree correspond to shortest paths from the lobster's starting position (L) to the respective vertices. The highlighted path L→N₂→E₁ represents the shortest escape route with length 2. This follows the standard BFS formulation from Dasgupta et al. (Chapter 4, Figure 4.4), demonstrating layer-by-layer exploration with FIFO queue ordering.

---

## Key Differences from Textbook Figure 4.4

| Textbook (Dasgupta Fig 4.4) | Your Implementation |
|------------------------------|---------------------|
| Explores entire graph | Early termination at boundary |
| Queue empties completely | Queue may have vertices when stopping |
| All vertices visited | Only vertices needed to reach goal |
| BFS tree shows all edges | Tree truncated at first boundary |

**Why the difference?**
- Textbook: General BFS (find all distances)
- Your code: Goal-directed BFS (find path to boundary)
- Both are correct! Yours is optimized for your game's needs.

---

This clean, unobstructed example clearly demonstrates the BFS algorithm structure before adding the complexity of player-placed rocks.
