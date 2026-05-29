import React, { forwardRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
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
 * - On iOS, lifts content with `KeyboardAvoidingView` `behavior="padding"`.
 *   On Android the app relies on the manifest's
 *   `android:windowSoftInputMode="adjustResize"`, so KeyboardAvoidingView is a
 *   passthrough there — stacking both would create a double gap above the
 *   keyboard.
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
 * Fires twice so it lands whether Android's adjustResize is fast or slow: once
 * early, once after the window has finished shrinking. `y` is a fixed offset
 * tuned per form (the field's approximate distance from the top of the scroll
 * content). Reliability-over-elegance — a fixed scrollTo is far more dependable
 * on Android than native measurement.
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
