# UML Activity Diagram - Quick Reference Guide

## 📁 Files Created

1. **[UML_ACTIVITY_DIAGRAM_CORRECTED.md](UML_ACTIVITY_DIAGRAM_CORRECTED.md)**
   - Complete ASCII/text diagram with swimlanes
   - Detailed explanations
   - Code mappings to your implementation

2. **[activity-diagram.plantuml](activity-diagram.plantuml)**
   - PlantUML source code
   - Auto-generates professional diagram
   - Can export to PNG/SVG/PDF

3. **This guide** - Quick reference

---

## 🔧 How to Generate Professional Diagram

### Option 1: Online (Easiest)
1. Go to http://www.plantuml.com/plantuml/uml/
2. Copy contents of `activity-diagram.plantuml`
3. Paste and click "Submit"
4. Download as PNG or SVG

### Option 2: VS Code Extension
1. Install "PlantUML" extension
2. Open `activity-diagram.plantuml`
3. Press `Alt+D` (or `Cmd+D` on Mac)
4. Preview appears
5. Right-click → Export → Choose format

### Option 3: Command Line
```bash
# Install PlantUML
brew install plantuml

# Generate diagram
plantuml activity-diagram.plantuml

# Creates: activity-diagram.png
```

---

## ✅ What Was Fixed (Before → After)

### 1. **Login Routing** ❌ → ✅

**Before:**
```
Login → Welcome → Pre-Games Tutorial
```

**After:**
```
Login → Decision ◇
         ├─[Teacher]──→ Dashboard → ◉
         └─[Participant]──→ Welcome → ...
```

**Why:** Your Firebase code (lines 3889-3894) routes differently based on code type!

---

### 2. **Tutorial Loops** ❌ → ✅

**Before:** Informal arrows looping back

**After:** Proper merge + decision nodes
```
     ◇ (Merge)
     ↓
   Steps
     ↓
     ◇ (Decision)
   ╱   ╲
[Repeat] [Continue]
```

**Why:** UML standard for iterative activities

---

### 3. **Time Constraints** ❌ → ✅

**Before:** Text annotation "4 mins"

**After:** Formal constraint notation
```
┌─────────────────────┐
│ Game 1              │
│ {duration ≤ 4 min}  │
└─────────────────────┘
```

**Why:** Standard UML constraint syntax

---

### 4. **Data Objects** ❌ → ✅

**Before:** No data shown

**After:** Object nodes for:
- Participant Code (input to Login)
- Session Data (logged by system)

**Why:** Shows data flow through system

---

### 5. **Swimlanes** ❌ → ✅

**Before:** Single column

**After:** Three swimlanes:
- Participant (main user flow)
- Teacher (dashboard access)
- System/Firebase (background processes)

**Why:** Separates concerns, shows parallel execution

---

## 📊 Comparison

| Element | Original | Corrected |
|---------|----------|-----------|
| Login routing | Linear | Decision node ◇ |
| Teacher path | Missing | Dashboard → ◉ |
| Tutorial loops | Informal arrows | Merge + Decision |
| Time limits | Text only | `{constraint}` notation |
| Data objects | None | Code, Session objects |
| Swimlanes | None | 3 swimlanes |
| Help modals | Side boxes | Interrupting regions |
| UML compliance | Partial | Full ✓ |

---

## 🎓 Academic Justification

### Decision Node After Login
**Why necessary:**
> "The authentication flow in the Gaelic Games application diverges based on the type of access code provided. Teacher codes (T-XX) redirect to a read-only dashboard for monitoring participant sessions, while participant codes (P-XX) proceed to the game sequence. This branching is implemented in the `handleLoginSubmit()` method (game.js:3889-3894) using Firebase custom token authentication, necessitating a decision node in the activity diagram to accurately represent the conditional routing logic."

### Swimlanes for Separation of Concerns
**Why necessary:**
> "The application operates across three distinct execution contexts: the participant's game interface, the teacher's dashboard interface, and the Firebase backend services. Swimlanes (UML 2.5 §15.2.3) partition these activities by responsibility, clarifying which components execute each action. This separation is particularly important for understanding the distributed nature of the data logging system, where client-side game events trigger server-side Cloud Functions for validation and persistence."

### Time Constraints
**Why necessary:**
> "Games 1 and 3 implement strict time limits (4 minutes and 3 minutes respectively) to maintain research protocol consistency. UML constraint notation `{duration ≤ N min}` formally specifies these temporal requirements, which are enforced by JavaScript `setInterval()` timers in the respective game board classes. These constraints ensure all participants experience standardized challenge conditions for valid comparative analysis."

---

## 📝 Figure Caption Template

**Figure X: UML Activity Diagram for Gaelic Games Application**

This activity diagram models the user flow and system interactions of the Gaelic Games educational research application. Upon login, users are routed via a decision node based on their access code type: teacher codes (T-XX) lead to a monitoring dashboard, while participant codes (P-XX) proceed through three sequential games with intervening tutorial and interval activities. Tutorial sequences employ merge and decision nodes to support iterative review. Games 1 and 3 include time constraints (`{duration ≤ 4 min}` and `{duration ≤ 3 min}` respectively) enforced by client-side timers. The system swimlane shows background Firebase processes including code validation via Cloud Functions and session logging to Firestore. Interrupting regions (dashed boxes) represent in-game help modals accessible at any point during gameplay. This diagram follows UML 2.5 activity diagram notation and accurately reflects the implementation in the game.js and Firebase Cloud Functions codebases.

---

## 🔍 Code-to-Diagram Mapping

| Diagram Element | Implementation |
|----------------|----------------|
| **Login Activity** | `game.js:3859` (`handleLoginSubmit()`) |
| **Decision Node** | `game.js:3889` (`if result.data.type === 'teacher'`) |
| **Teacher Path** | `game.js:3892` (`window.location.href = '/dashboard.html'`) |
| **Participant Path** | `game.js:3908` (`setGameFlowState('RUAIRIDH_INTRO')`) |
| **Welcome Activity** | `game.js:3934` (`renderIntroduction_RuairidhIntro()`) |
| **Game 1 Activity** | `game.js:911` (`class Game1Board`) |
| **Game 1 Constraint** | Timer logic in Game1Board |
| **Game 2 Activity** | `game.js:1689` (`class Game2Board`) |
| **Game 3 Activity** | `game.js:2463` (`class Game3Board`) |
| **Game 3 Constraint** | Timer in Game3Board |
| **Results Activity** | `game.js:4808` (`renderResultsScreen()`) |
| **Validate Code (System)** | `functions/index.js:16` (`validateAndAuthenticate`) |
| **Log Events (System)** | `data-logger.js:65` (`logEvent()`) |
| **Session Data Object** | Firestore `/sessions/{id}` documents |

---

## 💡 Tips for Your Dissertation

1. **Use vector format** (SVG/PDF) not PNG for crisp printing
2. **Keep it on one page** - split into 2 diagrams if needed:
   - High-level overview (just main flow)
   - Detailed view (with all loops and system interactions)
3. **Reference in text**: "As shown in Figure X, the application employs..."
4. **Explain non-standard elements**: If you use interrupting regions for help modals, explain in caption
5. **Cross-reference code**: "...implemented in the handleLoginSubmit method (Listing Y)"

---

## ✨ Final Checklist

Before submission, verify:

- [ ] Decision node after Login ✓
- [ ] Teacher path leads to Dashboard ✓
- [ ] Participant path continues to games ✓
- [ ] Tutorial loops use merge + decision nodes ✓
- [ ] Time constraints in curly braces `{...}` ✓
- [ ] Object nodes for data (Code, Session) ✓
- [ ] Swimlanes for Participant/Teacher/System ✓
- [ ] Activity final nodes (◉) for both paths ✓
- [ ] Legend explaining all notation used ✓
- [ ] Figure caption references UML 2.5 standard ✓
- [ ] Code mappings in text/appendix ✓

---

**Your diagram is now academically rigorous and implementation-accurate!** 🎓✨
