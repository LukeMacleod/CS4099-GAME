# Testing Checklist

Use this checklist to verify all improvements are working correctly.

## Pre-Test Setup
- [ ] Start local server: `python3 -m http.server 8000`
- [ ] Open browser to `http://localhost:8000`
- [ ] Open browser DevTools Console (F12)

## Functional Testing

### Login Screen
- [ ] Enter valid code (e.g., "TEST123") - should work
- [ ] Enter code with special characters (e.g., "test@#$") - should be sanitized
- [ ] Enter empty code - should show Gaelic error message
- [ ] Enter very long code (>50 chars) - should show Gaelic error message

### Game Flow
- [ ] Login → Ruairidh Introduction - should show seal character
- [ ] Pre-game Tutorial (3 steps) - spotlight should highlight correct elements
- [ ] Game 1 Tutorial (3 steps) - lobster should be visible and animate
- [ ] Game 1 Main - timer should start at 5:00
- [ ] Place stones to trap lobster - should work correctly
- [ ] Catch a lobster - stone should fly to cairn, points should increase
- [ ] Let lobster escape - should reset board
- [ ] Click help button (?) - modal should appear in GAELIC
- [ ] Timer runs out - should transition to Game 2
- [ ] Game 2 Tutorial - should show tweed-backed cards
- [ ] Game 2 Main - cards should flip on click
- [ ] Match two cards - should stay flipped
- [ ] Mismatch two cards - should flip back
- [ ] Complete all matches - should show Gaelic success message
- [ ] Results screen - should show final score

### Bug Fixes Verification
- [ ] NO "Skip Timer (DEV)" button visible in Game 1
- [ ] Help modal is completely in Gaelic (not English)
- [ ] Game 2 completion message is in Gaelic
- [ ] Tutorial board renders correctly (no missing hexes)

## Accessibility Testing

### Screen Reader (VoiceOver on Mac: Cmd+F5)
- [ ] Login input is announced with label
- [ ] Help button announces its purpose
- [ ] Timer updates are announced
- [ ] Score updates are announced
- [ ] Game board is identified as application
- [ ] Help modal is identified as dialog
- [ ] Card states are announced (hidden/shown/matched)

### Keyboard Navigation
- [ ] Tab key moves between interactive elements
- [ ] Enter key activates buttons
- [ ] Space key flips cards in Game 2
- [ ] Enter key flips cards in Game 2
- [ ] Escape key (future: should close modal)
- [ ] Focus indicators are visible

### ARIA Attributes (Check in DevTools Elements tab)
- [ ] Main game areas have `role="main"`
- [ ] Banner has `role="banner"`
- [ ] Help modal has `role="dialog"` and `aria-modal="true"`
- [ ] Timer has `aria-live="polite"`
- [ ] Score has `aria-live="polite"`
- [ ] Game status has `aria-live="assertive"`
- [ ] Cards have `role="button"` and `tabindex="0"`

## Error Handling

### Console Messages
- [ ] No JavaScript errors in console
- [ ] State transitions logged (e.g., "Transitioning: LOGIN → RUAIRIDH_INTRO")
- [ ] Warning if board element not found (only during development)

### Edge Cases
- [ ] Refresh page mid-game - should restart cleanly
- [ ] Click elements rapidly - should not break
- [ ] Resize window during game - board should re-render
- [ ] Click disabled help button in Game 2 - should do nothing

## Visual Testing

### Layout
- [ ] All text is readable
- [ ] Buttons are properly styled
- [ ] Cards flip smoothly
- [ ] Lobster animates correctly
- [ ] Stone flies to cairn on catch
- [ ] Timer turns red when < 10 seconds

### Responsive (Test different sizes)
- [ ] Mobile view (< 480px) - everything visible
- [ ] Tablet view (< 768px) - layout adjusts
- [ ] Desktop view (> 768px) - optimal layout

## Performance

### Load Time
- [ ] Initial load is fast (<2 seconds)
- [ ] No lag when clicking buttons
- [ ] Animations are smooth (60fps)

### Memory
- [ ] No memory leaks (check DevTools Memory tab)
- [ ] Game runs smoothly for full 5+ minutes

## Code Quality

### Developer Review
- [ ] Comments explain complex logic
- [ ] No unused code
- [ ] Consistent formatting
- [ ] Gaelic strings used throughout

---

## Pass Criteria

✅ All checkboxes above should be checked
✅ Zero errors in browser console
✅ Smooth user experience identical to before improvements
✅ All text in Scottish Gaelic (except debug logs)

## Failure Actions

If any test fails:
1. Note which checkbox failed
2. Check browser console for errors
3. Review relevant section in IMPROVEMENTS.md
4. Check git diff to see what changed
5. Report issue with specific steps to reproduce
