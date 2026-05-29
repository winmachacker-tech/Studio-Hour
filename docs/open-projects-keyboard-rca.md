# Open Projects — Android Keyboard RCA

Last updated: 2026-05-29
Status: **Analysis only. No code changed.** Read this before adding any more keyboard patches.

---

## Executive summary

The Open Projects keyboard problems are **not** a series of unrelated bugs in individual fields. They are all symptoms of **one foundational mismatch**:

> **The app runs in Android edge-to-edge mode (`edgeToEdgeEnabled=true`, Expo SDK 56 / RN 0.85, enforced by the Android 15 target). Under edge-to-edge, `android:windowSoftInputMode="adjustResize"` no longer resizes the window when the keyboard opens. But our shared keyboard component is built on the explicit assumption that it does** — it sets `KeyboardAvoidingView behavior={undefined}` on Android "because adjustResize handles it." Under edge-to-edge it handles nothing, so on Android **no layout reacts to the keyboard at all**. The keyboard simply paints over the bottom of a full-height, unchanged ScrollView.

Every patch so far (fixed `scrollTo` offsets, forced-focus wrappers, `onLayout` capture, padding bumps) is a manual attempt to simulate the viewport change that the OS used to do for free. They work in the easy cases and fall apart at the edges (last card, fields stacked in a tall form, races between padding-change and scroll) because they are re-implementing window insets by hand, with hardcoded numbers, on top of an architecture (editable forms inline in a shared scroll list) that makes the correct numbers unknowable.

**Recommendation (detail below): do both halves of the real fix —**
1. **Fix the foundation** so the keyboard inset is actually consumed on Android (treat Android like iOS with `behavior="padding"`, or adopt a keyboard-inset library). This single change is what makes adjustResize-style behavior return.
2. **Reduce the surface** by moving project create/edit/subtasks off the shared scroll list into a **dedicated keyboard-aware surface** (detail screen or full-height sheet), so we stop needing per-field scroll math at all.

This lets us delete most of the current patch code rather than keep extending it.

---

## Component / layout map (Open Projects)

```
App (SafeAreaProvider → NavigationContainer)
└─ MainTabs  (createBottomTabNavigator, headerShown:false, tabBar height 64, NO tabBarHideOnKeyboard)
   └─ Screen "Open Work" → OpenWorkScreen
      └─ <View styles.container>                 flex:1, nightPlum bg
         ├─ <KeyboardSafeScrollView ref=scrollRef>
         │    └─ <KeyboardAvoidingView flex:1 behavior={iOS:"padding" | Android:undefined}>
         │         └─ <ScrollView                 keyboardShouldPersistTaps="handled"
         │              contentContainerStyle={ paddingTop: insets.top+20,
         │                 paddingBottom: (isStepInputFocused?400 : showForm?240 : 130) + insets.bottom }>
         │              ├─ Header (eyebrow/title/subtitle)
         │              ├─ FilterRow (horizontal ScrollView)         ← nested horizontal scroller
         │              ├─ {showForm} AddWorkForm        (inline Card with 5 TextInputs)
         │              ├─ {empty state}
         │              └─ items.map → either:
         │                   • EditWorkForm  (inline Card with 5 TextInputs)   ← when editingId===id
         │                   • WorkCard      (inline Card, + add-step TextInput when expanded)
         │              └─ foot text
         └─ {!showForm} <Pressable styles.fab>  position:absolute, bottom: 90 + insets.bottom
```

Key structural facts:
- **One scroll container** holds the header, an add form, N editable cards, and inline edit forms — all stacked vertically.
- **The FAB is absolutely positioned** as a sibling of the scroll view, offset by `insets.bottom`.
- **The bottom tab bar (64px) does not hide on keyboard**, so it occupies space above the keyboard and overlaps the bottom of the list.
- Inputs can appear at **any vertical offset** depending on list length, which card is expanded, and whether a form is open.

---

## Current keyboard-handling map

| Mechanism | Where | What it does |
|---|---|---|
| `windowSoftInputMode="adjustResize"` | AndroidManifest | **Intended** to shrink the window on keyboard open. **Neutralized by edge-to-edge** (see root cause). |
| `edgeToEdgeEnabled=true` | `android/gradle.properties` | Draws behind system bars; sets `decorFitsSystemWindows=false`; converts the IME into a window inset instead of a resize. |
| `KeyboardAvoidingView behavior` | `KeyboardSafeScrollView` | iOS: `"padding"` (works). **Android: `undefined` → no-op.** |
| `keyboardShouldPersistTaps="handled"` | `KeyboardSafeScrollView` | Lets taps on Save/＋ register without first dismissing the keyboard. (Correct, keep.) |
| `keyboardDismissMode="on-drag"` | `KeyboardSafeScrollView` | Drag to dismiss. (Fine, keep.) |
| `scrollFieldAboveKeyboard(ref, y)` | shared util | `scrollTo({y})` fired at 100ms & 300ms. Manual viewport simulation. |
| Fixed `y` offsets | OpenWorkScreen | Add note `520`, add goal `340`; edit note `formBottom−300`, edit goal `formBottom−410`; add-step `cardBottom−300`. |
| `onLayout` capture | Card → WorkCard / EditWorkForm | Captures card/form top+height to compute a scroll target. |
| Forced focus | AddWorkForm/EditWorkForm/WorkCard | `Pressable onPressIn` → `ref.focus()` **and** the field's `onFocus` both fire the scroll callback. |
| `isStepInputFocused` padding bump | OpenWorkScreen | Grows `paddingBottom` to 400 so the last card isn't clamped at max-scroll. |

---

## Every TextInput on the page

| # | Field | Lives in | Position in scroll | Current handling |
|---|---|---|---|---|
| 1 | Add: title | `AddWorkForm` | top of form | none (high enough) |
| 2 | Add: project/client | `AddWorkForm` | upper form | none |
| 3 | Add: due date | `AddWorkForm` | mid form | none |
| 4 | Add: goal / intended outcome | `AddWorkForm` | mid-lower form | forced focus + `scrollTo(340)` |
| 5 | Add: "next small move" (note) | `AddWorkForm` | bottom of form | forced focus + `scrollTo(520)` |
| 6 | Edit: title | `EditWorkForm` | top of inline form | none |
| 7 | Edit: project/client | `EditWorkForm` | upper | none |
| 8 | Edit: due date | `EditWorkForm` | mid | none |
| 9 | Edit: goal | `EditWorkForm` | mid-lower | forced focus + `scrollTo(formBottom−410)` + padding bump |
| 10 | Edit: note | `EditWorkForm` | bottom | forced focus + `scrollTo(formBottom−300)` + padding bump |
| 11 | WorkCard add-step ("Add a step…") | `WorkCard` (expanded) | bottom of any card, anywhere in list | forced focus + `scrollTo(cardBottom−300)` + padding bump |

Eleven inputs, at unpredictable offsets, all inside one scroll view. That count alone is why per-field patching never converges.

---

## Exact root cause(s)

### Primary root cause — edge-to-edge neutralizes `adjustResize`
- `android/gradle.properties` has **`edgeToEdgeEnabled=true`**, and `styles.xml` sets transparent status/navigation bars. Expo SDK 54+ (this app is SDK 56) **enforces** edge-to-edge for the Android 15 target; it cannot be turned off.
- Edge-to-edge calls `WindowCompat.setDecorFitsSystemWindows(false)`. With decor-fits-system-windows **false**, the Android window **does not resize** when the IME (keyboard) appears. The keyboard is delivered as a **WindowInsets IME inset** that the app is responsible for consuming. `android:windowSoftInputMode="adjustResize"` is effectively a **no-op** in this mode.
- React Native's bundled `KeyboardAvoidingView` historically leaned on the window actually resizing on Android. Our `KeyboardSafeScrollView` **explicitly opts out on Android** (`behavior={undefined}`) on the stated assumption that "adjustResize handles it."
- **Net effect on Android:** nothing in the layout reacts to the keyboard. The ScrollView keeps full height; the keyboard paints over the bottom ~40%. Every lower field is occluded until manually scrolled.

This is the single fact that explains why iOS is fine (real `behavior="padding"`) and Android is broken (`undefined` + dead adjustResize).

### Secondary / contributing causes
1. **Manual scroll can't change the viewport.** Because the window never shrinks, `scrollTo` only moves content within a fixed-height ScrollView. There is no extra room at the bottom unless we *manufacture* it (the `paddingBottom` bumps), which is why the last card clamps (next cause).
2. **Max-scroll clamp.** Max scroll = `contentHeight − viewportHeight`. With no resize, a low/last field can't reach the top half unless `contentHeight` is inflated. The `isStepInputFocused ? 400` padding is a hand-rolled spacer to defeat the clamp — fragile and field-specific.
3. **Hardcoded `y` offsets are guesses.** `520`, `340`, `300`, `410` assume specific form layouts, font sizes, and that the field is at a known offset. Any layout change (added goal field, wrapped text, different device) invalidates them.
4. **Two focus triggers race.** Each field fires the scroll from both `Pressable onPressIn` *and* `TextInput onFocus`. They can double-fire `scrollTo` and (for edit/add-step) double-set state.
5. **State change after scroll starts.** `setIsStepInputFocused(true)` inflates `paddingBottom` on the *next render*, while `scrollFieldAboveKeyboard` is already scrolling against the *current* content height. The two are not ordered, so the scroll target is computed against a content height that is simultaneously changing — a built-in race the double-`setTimeout` only papers over.
6. **Bottom tab bar doesn't hide on keyboard** + **absolute FAB** + **safe-area `insets.bottom`** all consume or offset the very space the math is trying to reason about, so "above the keyboard" is a moving target.
7. **Architecture amplifies all of the above:** editable forms and editable cards live **inside the scrolling list**, so an input's absolute position depends on list length and expansion state and is only knowable via `onLayout` measurement — which is exactly the fragile path we keep extending.

---

## Why the current patches are fragile

- They **simulate** a viewport change the OS should provide. Simulation with constants can't match every device/keyboard height/font scale.
- They are **position-dependent** in a list where positions are dynamic.
- They **fight themselves**: dual focus triggers, padding-state vs. scroll-timing races, and a manual spacer that only exists to beat a clamp that only exists because the window didn't resize.
- They **don't compose**: each new field (goal was the latest) needs its own offset and its own callback, so the patch surface grows linearly with inputs (now 11).
- They are **invisible to TypeScript and untestable without a device**, so every change is a guess validated only by manual on-device retry.

---

## Recommended structural solution

**Two layers. Do the foundation first; it alone fixes most cases. Then reduce the surface.**

### Layer 1 — Make the keyboard inset actually apply on Android (the real fix)
Pick one:

- **1a (smallest, no deps): stop opting out on Android.** Set `KeyboardAvoidingView behavior="padding"` on **both** platforms in `KeyboardSafeScrollView` (or `"height"` on Android if padding misbehaves). Under edge-to-edge, `KeyboardAvoidingView` "padding" listens to `Keyboard` events and pads by the IME height — which is the mechanism that still works when `adjustResize` doesn't. This restores automatic avoidance and lets us delete the per-field scroll math.
  - Caveat: RN's built-in KAV under edge-to-edge can still be slightly janky for inputs very low in a long scroll; verify on device.
- **1b (most robust, adds a dependency): adopt `react-native-keyboard-controller`** (`KeyboardAwareScrollView` / `KeyboardAvoidingView`). It reads true IME insets/height and is the community standard precisely for the edge-to-edge era. This is the "correct" fix but conflicts with the current "no new dependencies" guardrail, so it needs explicit approval.
- **Also:** set `tabBarHideOnKeyboard: true` on the Android tab bar to reclaim the 64px tab strip while typing.

### Layer 2 — Get editable inputs out of the shared scroll list
Move project **create + edit + subtasks** into a **dedicated full-height surface** (a detail screen via the navigator, or a full-screen modal/sheet) that contains a single focused form with one keyboard-aware scroller. This removes inputs #1–#11 from the list entirely, so:
- No per-card `onLayout`, no fixed offsets, no padding bumps, no clamp.
- The list screen becomes read-only (status chip, progress, due chip, edit button) — trivial keyboard-wise.

---

## Option comparison

| Option | What it is | Fixes root cause? | Effort | Verdict |
|---|---|---|---|---|
| **A. Keep improving KeyboardSafeScrollView + focus-scroll callbacks** | More offsets/refs/padding | **No** — still simulates the missing resize | Ongoing, never converges | ❌ Stop doing this |
| **B. Add/Edit forms in a dedicated keyboard-aware modal/sheet** | Forms leave the list into a full-height sheet | Partially — only if the sheet uses a real keyboard-aware container (Layer 1). RN `Modal` + edge-to-edge has its own IME-inset quirks | Medium | ✅ Good for forms; pair with Layer 1 |
| **C. Project editing/subtasks in a dedicated detail screen** | Push a real screen for create/edit/subtasks | Yes when combined with Layer 1; biggest reduction in surface | Medium | ✅✅ **Best structural direction** |
| **D. FlatList with keyboard-aware footer/spacer** | Convert list to FlatList | **No** — doesn't address the missing inset; still inline inputs | Medium-high (rewrites list) | ❌ Wrong lever |

### Clear recommendation
**Do Layer 1a now (foundation), then Option C (detail screen) for editing/subtasks; keep Add as a sheet (Option B) or also route it through the detail screen.**

Reasoning:
- **Layer 1a is the actual root-cause fix** and is dependency-free: flipping Android off `undefined` onto `behavior="padding"` is what makes keyboard avoidance work again under edge-to-edge. Most reported cases (note, goal, the add form) will resolve from this alone.
- **Option C removes the hardest cases** (add-step on the last card, inline edit forms at arbitrary offsets) by taking them out of the shared list. A single-purpose screen with one keyboard-aware scroller has no position math.
- **Option A is a treadmill** — it grows with every field and never fixes the cause.
- **Option D** rewrites the list for no root-cause benefit.
- **`react-native-keyboard-controller` (1b)** is the gold standard if we're willing to add a dependency; recommend it as a fast-follow if 1a proves janky on device.

---

## Minimal implementation plan (when approved)

**Phase 1 — Foundation (small, reversible, validates the RCA):**
1. In `KeyboardSafeScrollView`, change Android from `behavior={undefined}` to `behavior="padding"` (test `"height"` as fallback). Update the doc comment (it currently states the now-false adjustResize assumption).
2. Set `tabBarHideOnKeyboard: true` for Android in `MainTabs`.
3. On device, retest all 11 inputs. Expectation: most now stay visible with **zero** manual scrolling.

**Phase 2 — Remove the simulation (after Phase 1 verified):**
4. Delete `scrollFieldAboveKeyboard` usage and the `onFocus*Field` / `onFocusAddStep` callbacks; delete `isStepInputFocused` and the padding bump; drop the forced-focus `Pressable` wrappers and the `onLayout` capture in `WorkCard`/`EditWorkForm`. Keep `keyboardShouldPersistTaps` / `keyboardDismissMode`.

**Phase 3 — Reduce surface (structural):**
5. Introduce a dedicated **Project detail/edit surface** (screen or full-height sheet) that hosts create/edit/subtasks with a single keyboard-aware scroller. Make the list card read-only + "edit" → opens the surface.
6. Remove `AddWorkForm`/`EditWorkForm`/add-step inputs from the inline list.

> Phase 1 is independently shippable and is the cheapest way to confirm the root cause empirically. Do not proceed to deleting patches (Phase 2) until Phase 1 is verified on device.

---

## Risks & tradeoffs

- **`behavior="padding"` on Android can over- or under-pad** for inputs deep in a long scroll; if jank appears, that's the signal to adopt `react-native-keyboard-controller` (1b).
- **Removing patches before verifying Phase 1** would regress the cases that currently work. Sequence matters.
- **Detail screen (Option C) is a UX change** — editing leaves the list. That's arguably better (more room, clearer focus) but should be confirmed with Danielle/Mark; it also overlaps with the planned Phase 2 "project detail view" ticket, so it's not throwaway work.
- **`tabBarHideOnKeyboard`** changes a small visual behavior (tab bar disappears while typing) — almost always desirable.
- **Dependency guardrail:** 1b needs explicit approval; 1a respects "no new deps."

---

## What to remove / replace from the current patched approach

Once Phase 1 is verified, these become dead weight and should be removed:
- `scrollFieldAboveKeyboard` (shared util) — delete or keep only as an escape hatch.
- All `onFocusNextMoveField` / `onFocusGoalField` / `onFocusNoteField` / `onFocusAddStep` callbacks and their `OpenWorkScreen` wiring.
- `isStepInputFocused` state and the `paddingBottom` bump logic (`400`/`240`/`130` ladder → revert to a single normal padding).
- Forced-focus `Pressable` wrappers around the note/goal/add-step inputs.
- `onLayout` position capture in `WorkCard` and `EditWorkForm` (and the `Card` `onLayout` prop, if no longer used).
- The hardcoded offsets `520 / 340 / 300 / 410`.
- **Fix the stale comment** in `KeyboardSafeScrollView` that asserts Android relies on adjustResize.

Keep: `keyboardShouldPersistTaps="handled"`, `keyboardDismissMode="on-drag"`, and the `KeyboardSafeScrollView` wrapper itself (with the corrected Android behavior).

---

## Testing checklist (per build, on a real Android device + one iOS)

Foundation must hold with **no manual dragging**:
- [ ] Add form: tap **title** → visible.
- [ ] Add form: tap **project/client** → visible.
- [ ] Add form: tap **due date** → visible.
- [ ] Add form: tap **goal** → visible, Save reachable.
- [ ] Add form: tap **note** → visible, Save reachable.
- [ ] Edit form on a **top** card: each field visible; Save tappable without dismissing keyboard.
- [ ] Edit form on the **last** card: goal + note visible; Save reachable (the old clamp case).
- [ ] WorkCard **add-step** on a top card → input visible; ＋ tappable.
- [ ] WorkCard **add-step** on the **last** card → input visible (the original clamp failure).
- [ ] Tab bar hides while typing (Android) and restores on dismiss.
- [ ] Keyboard dismiss on drag still works.
- [ ] iOS: all of the above still pass (no regression from the Android behavior change).
- [ ] Small device + large system font scale: lowest field still reachable.
- [ ] Rotate not applicable (portrait-locked) — confirm no layout assumptions on rotation.

---

*Analysis only. No app code, build, install, or commit performed.*
