# Corrected UML Activity Diagram - Gaelic Games Application

## Full Diagram with Proper UML Notation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PARTICIPANT SWIMLANE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                              ●  (Initial node)                              │
│                              ↓                                              │
│                        ┌──────────┐                                         │
│                        │  Login   │←─────────── ┌──────────────┐           │
│                        └────┬─────┘             │ Participant  │           │
│                             ↓                   │    Code      │           │
│                         ┌───◇───┐              └──────────────┘           │
│                         │       │              (Object node)               │
│                      ╱──┴───────┴──╲                                        │
│                 [Teacher]      [Participant]                                │
│                     ↓                ↓                                      │
│      ┌──────────────┴─┐         ┌────────────┐                             │
│      │   TEACHER      │         │  Welcome   │                             │
│      │   SWIMLANE     │         └─────┬──────┘                             │
│      └────────────────┘               ↓                                    │
│                              ┌──────────────────┐                           │
│                              │ Pre-Games        │                           │
│                              │ Tutorial         │                           │
│                              └────────┬─────────┘                           │
│                                       ↓                                     │
│                              ┌────────◇────────┐  (Merge node)             │
│                              │                 │                            │
│                          ╱───┴─────────────┬───┴───╲                       │
│                         ↓                   ↓       ↓                       │
│                    ┌────────┐         ┌────────┐  ┌────────┐               │
│                    │ Step 1 │         │ Step 2 │  │ Step 3 │               │
│                    └───┬────┘         └───┬────┘  └───┬────┘               │
│                        ↓                  ↓           ↓                     │
│                    ┌────────┐         ┌────────┐  ┌────────┐               │
│                    │ Step 4 │         │ Step 5 │  │        │               │
│                    └───┬────┘         └───┬────┘  └────────┘               │
│                        │                  │                                 │
│                        └──────┬───────────┘                                 │
│                               ↓                                             │
│                          ┌────◇────┐  (Decision node)                      │
│                          │         │                                        │
│                      ╱───┴─────────┴───╲                                   │
│                  [Repeat]           [Continue]                              │
│                     ↓                    ↓                                  │
│                     │              ┌──────────────┐                         │
│                     └──────────────→│ Game 1      │                         │
│                                    │ Tutorial    │                         │
│                                    └──────┬───────┘                         │
│                                           ↓                                 │
│                                    ┌─────────────────────────────┐         │
│                                    │        Game 1                │         │
│                                    │  {duration ≤ 4 min}          │         │
│                                    │  ┌────────────────────────┐  │         │
│                                    │  │  Main Game Loop        │  │         │
│                                    │  │  (Lobster Pathfinding) │  │         │
│                                    │  └──────────┬─────────────┘  │         │
│                                    │             ↕                │         │
│                                    │  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │         │
│                                    │  ┊ In-Game Help Modal     ┊  │         │
│                                    │  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │         │
│                                    └─────────────┬───────────────┘         │
│                                                  ↓                          │
│                                          ┌───────────────┐                  │
│                                          │  Interval 1   │                  │
│                                          └───────┬───────┘                  │
│                                                  ↓                          │
│                                          ┌───────────────┐                  │
│                                          │ Game 2        │                  │
│                                          │ Tutorial      │                  │
│                                          └───────┬───────┘                  │
│                                                  ↓                          │
│                                    ┌─────────────────────────────┐         │
│                                    │        Game 2                │         │
│                                    │  (Memory Matching)           │         │
│                                    │  ┌────────────────────────┐  │         │
│                                    │  │  Main Game Loop        │  │         │
│                                    │  └──────────┬─────────────┘  │         │
│                                    │             ↕                │         │
│                                    │  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │         │
│                                    │  ┊ In-Game Help Modal     ┊  │         │
│                                    │  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │         │
│                                    └─────────────┬───────────────┘         │
│                                                  ↓                          │
│                                          ┌───────────────┐                  │
│                                          │  Interval 2   │                  │
│                                          └───────┬───────┘                  │
│                                                  ↓                          │
│                                          ┌───────────────┐                  │
│                                          │ Game 3        │                  │
│                                          │ Tutorial      │                  │
│                                          └───────┬───────┘                  │
│                                                  ↓                          │
│                                    ┌─────────────────────────────┐         │
│                                    │        Game 3                │         │
│                                    │  {duration ≤ 3 min}          │         │
│                                    │  ┌────────────────────────┐  │         │
│                                    │  │  Main Game Loop        │  │         │
│                                    │  │  (Fishing Collection)  │  │         │
│                                    │  └──────────┬─────────────┘  │         │
│                                    │             ↕                │         │
│                                    │  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │         │
│                                    │  ┊ In-Game Help Modal     ┊  │         │
│                                    │  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  │         │
│                                    └─────────────┬───────────────┘         │
│                                                  ↓                          │
│                                          ┌───────────────┐                  │
│                                          │ Finish Display│                  │
│                                          │ (Results)     │                  │
│                                          └───────┬───────┘                  │
│                                                  ↓                          │
│                                                 ◉  (Activity final)         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                          TEACHER SWIMLANE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│      (from Login decision)                                                  │
│                ↓                                                            │
│        ┌───────────────┐                ┌──────────────┐                    │
│        │   Dashboard   │←───────────────│ Teacher Code │                    │
│        │               │                └──────────────┘                    │
│        │ - Live Stats  │                (Object node)                       │
│        │ - Sessions    │                                                    │
│        │ - Export Data │                                                    │
│        └───────┬───────┘                                                    │
│                ↓                                                            │
│               ◉  (Activity final)                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                    SYSTEM/FIREBASE SWIMLANE (Background)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│      ┌─────────────────┐                                                    │
│      │ Validate Code   │                                                    │
│      │ (Cloud Function)│                                                    │
│      └────────┬────────┘                                                    │
│               ↓                                                             │
│      ┌─────────────────┐                                                    │
│      │ Create Session  │                                                    │
│      │ (Firestore)     │                                                    │
│      └────────┬────────┘                                                    │
│               ↓                                                             │
│      ┌─────────────────┐        ┌──────────────┐                           │
│      │ Log Events      │←───────│ Session Data │                           │
│      │ (Real-time)     │        └──────────────┘                           │
│      └────────┬────────┘        (Object node)                              │
│               ↓                                                             │
│      ┌─────────────────┐                                                    │
│      │ Finalize        │                                                    │
│      │ Session         │                                                    │
│      └─────────────────┘                                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Tutorial Subactivity (Expandable)

For Pre-Games Tutorial, Game 1 Tutorial, etc.:

```
┌────────────────────────────────────────────────────┐
│          Tutorial Activity (Expanded)              │
├────────────────────────────────────────────────────┤
│                                                    │
│                    ● (Entry point)                 │
│                         ↓                          │
│                    ┌────◇────┐ (Merge)             │
│                    │         │                     │
│         ╱──────────┴─────────┴──────────╲          │
│        ↓          ↓          ↓          ↓          │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│   │ Step 1 │ │ Step 2 │ │ Step 3 │ │ Step 4 │     │
│   └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘     │
│       │          │          │          │          │
│       └──────────┴──────────┴──────────┘          │
│                         ↓                          │
│                    ┌────────┐                      │
│                    │ Step 5 │                      │
│                    └───┬────┘                      │
│                        ↓                           │
│                   ┌────◇────┐                      │
│                   │         │                      │
│               ╱───┴─────────┴───╲                  │
│           [User       ]     [Auto     ]            │
│           [clicks back]     [continue ]            │
│               ↓                  ↓                 │
│               └──────────┬───────┘                 │
│                          ↓                         │
│               ┌──────────◇──────────┐              │
│               │  Decision           │              │
│           ╱───┴─────────────────┴───╲             │
│       [Repeat]               [Done]               │
│          ↓                      ↓                  │
│     (loop back)            (continue to            │
│      to merge               next activity)         │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## Legend (UML Notation Used)

| Symbol | Name | Meaning |
|--------|------|---------|
| ● | Initial node | Start of activity |
| ◉ | Activity final | End of ALL paths |
| ⊗ | Flow final | End of ONE path |
| ◇ | Decision/Merge | Conditional branching or path merging |
| ▐▌ | Fork/Join | Concurrent execution split/merge |
| ┌────┐ | Activity | Action or state |
| ╌╌╌╌ | Interrupting region | Can be interrupted (help modal) |
| [Text] | Guard condition | Condition for taking path |
| {Text} | Constraint | Time/resource constraint |
| ┌──┐ | Object node | Data object |

---

## Key Improvements Over Original:

### 1. **Decision Node After Login** ✓
- Properly shows Teacher vs Participant routing
- Matches Firebase authentication logic (game.js lines 3889-3894)

### 2. **Swimlanes** ✓
- Separates Participant, Teacher, and System concerns
- Shows parallel execution contexts
- Academic best practice for complex flows

### 3. **Proper Tutorial Loops** ✓
- Uses merge node (top of loop)
- Uses decision node (repeat vs continue)
- Formal UML notation instead of informal arrows

### 4. **Time Constraints** ✓
- `{duration ≤ 4 min}` for Game 1
- `{duration ≤ 3 min}` for Game 3
- Standard UML constraint notation

### 5. **Object Nodes** ✓
- Participant Code (input to Login)
- Teacher Code (input to Dashboard)
- Session Data (logged by system)

### 6. **Interrupting Regions** ✓
- In-Game Help shown as interrupting modal
- Dashed box indicates can be triggered at any time
- Returns to main game loop after dismissal

### 7. **Multiple Final Nodes** ✓
- Participant path ends after Results
- Teacher path ends after Dashboard view
- Proper use of activity final (◉) for each swimlane

---

## Code Mapping (Your Implementation)

| Diagram Element | Code Reference |
|----------------|----------------|
| Login → Decision | `game.js:3889-3894` (handleLoginSubmit) |
| [Teacher] path | `window.location.href = '/dashboard.html'` (line 3892) |
| [Participant] path | `this.setGameFlowState('RUAIRIDH_INTRO')` (line 3908) |
| Game 1 {≤4 min} | Timer in Game1Board class |
| Game 3 {≤3 min} | Timer in Game3Board class |
| In-Game Help | `toggleInGameHelpModal()` methods |
| Validate Code | `functions/index.js:validateAndAuthenticate` |
| Log Events | `data-logger.js:logEvent()` |
| Session Data | Firestore `/sessions/{id}` documents |

---

## Alternative: Simplified Version (No Swimlanes)

If you want a cleaner single-column flow without swimlanes:

```
        ●
        ↓
    ┌────────┐      ┌──────────────┐
    │ Login  │←─────│ User Code    │
    └───┬────┘      └──────────────┘
        ↓
    ┌───◇───┐
    │       │
╱───┴───────┴───╲
↓               ↓
┌──────────┐  ┌──────────┐
│Dashboard │  │ Welcome  │
│(Teacher) │  └────┬─────┘
└────┬─────┘       ↓
     ↓         ┌────────────┐
     ◉         │ Pre-Games  │
               │ Tutorial   │
               └─────┬──────┘
                     ↓
               (rest of participant flow)
                     ↓
               ┌──────────┐
               │ Results  │
               └────┬─────┘
                    ↓
                    ◉
```

---

## Rendering Tips

**For your dissertation:**

1. **Use a UML tool**: Lucidchart, Draw.io, Visual Paradigm, PlantUML
2. **Export as vector**: SVG or PDF for crisp printing
3. **Keep it readable**: Don't cram too much into one diagram
4. **Consider 2 diagrams**:
   - **High-level flow**: Login → Games → Results (simpler)
   - **Detailed view**: Tutorial loops, help modals, system integration

**PlantUML Code** (if you want to auto-generate):

I can provide PlantUML syntax if you'd like to use a text-based tool to generate the diagram automatically.

---

This corrected diagram is now **academically rigorous** and **accurately reflects your implementation**! 🎓
