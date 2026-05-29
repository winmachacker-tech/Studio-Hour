import React, { forwardRef } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from "react-native";

type Props = ScrollViewProps & {
  children: React.ReactNode;
};

/**
 * App-wide keyboard-safe scroll container.
 *
 * - Renders a ScrollView with the standard keyboard props so taps on buttons
 *   register while the keyboard is open (`keyboardShouldPersistTaps="handled"`)
 *   and dragging the list dismisses it (`keyboardDismissMode="on-drag"`).
 * - Lifts content with `KeyboardAvoidingView` `behavior="padding"` on BOTH
 *   platforms. The app runs Android edge-to-edge (`edgeToEdgeEnabled=true`),
 *   which makes `android:windowSoftInputMode="adjustResize"` a no-op — the
 *   window no longer shrinks when the keyboard opens. So Android can't rely on
 *   the OS resizing; `behavior="padding"` listens to keyboard events and pads
 *   by the IME height, which is what actually works under edge-to-edge.
 *   (See docs/open-projects-keyboard-rca.md.)
 *
 * Use it exactly like a ScrollView: pass `style`, `contentContainerStyle`
 * (including any paddingTop/paddingBottom) and children. Forward a ref to drive
 * `scrollTo` for focusing lower form fields (see `scrollFieldAboveKeyboard`).
 *
 * Place floating siblings (e.g. a FAB) in an outer container View around this,
 * not inside it.
 */
const KeyboardSafeScrollView = forwardRef<ScrollView, Props>(
  function KeyboardSafeScrollView({ children, ...scrollProps }, ref) {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          ref={ref}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
);

/**
 * Scroll a focused lower form field above the keyboard.
 *
 * KeyboardSafeScrollView (behavior="padding") makes lower fields scrollable
 * once the keyboard opens, but does not auto-scroll the focused field into
 * view — so callers nudge it up here. Fires twice so it lands whether the
 * keyboard animates in fast or slow: once early, once after the keyboard inset
 * has settled. `y` is a fixed offset tuned per form (the field's approximate
 * distance from the top of the scroll content). Reliability-over-elegance — a
 * fixed scrollTo is far more dependable than native measurement.
 */
export function scrollFieldAboveKeyboard(
  ref: React.RefObject<ScrollView | null>,
  y: number
) {
  const run = () => ref.current?.scrollTo({ y, animated: true });
  setTimeout(run, 100);
  setTimeout(run, 300);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default KeyboardSafeScrollView;
