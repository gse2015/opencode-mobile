// Pure snapshot calculation for @gorhom/bottom-sheet keyboard avoidance,
// extracted so it's unit-testable under plain `node --test` (same pattern as
// api-error.ts / session-ops.ts — zero runtime imports by convention).
//
// Why this exists: bottom-sheet's `keyboardBehavior="interactive"` measures
// the keyboard via `SCREEN_HEIGHT - height - screenY` (see
// useAnimatedKeyboard in node_modules). Under Android edge-to-edge the
// keyboardDidShow screenY is reported as the full-screen bottom, so that
// term cancels the keyboard height to ~0 and the sheet never pans up —
// inputs inside the sheet (ModelPicker search, DirectorySwitcher path
// input, DirectoryBrowserSheet jump input) end up covered. The fix mirrors
// the chat-composer fix: drive avoidance from the accurate IME inset
// (endCoordinates.height, see use-keyboard-inset.ts) via the sheet's
// `bottomOffset` prop, with `keyboardBehavior="none"` so the broken
// library math can't also move the sheet.
//
// Detent handling: with the sheet's bottom lifted `keyboardInset` px, a tall
// nominal detent ("80%") can overshoot the top of the screen. While the
// keyboard is up we cap every detent to the visible area (container height
// minus inset, minus a margin). With the keyboard down we return the
// nominal snap points untouched, so existing sheet sizes never change.

export interface SheetKeyboardLayoutInput {
  /** Nominal snap points as the sheet declares them, e.g. ["50%", "80%"] */
  nominalSnapPoints: string[]
  /** Container (window) height in pixels */
  containerHeight: number
  /** Measured keyboard inset in pixels (0 = keyboard hidden) */
  keyboardInset: number
  /** Extra px to keep clear above the keyboard (default 8) */
  margin?: number
}

export interface SheetKeyboardLayout {
  snapPoints: string[]
  /** px to pass to the sheet's `bottomInset` (5.2.x prop that lifts the sheet's bottom edge) */
  bottomInset: number
}

export function sheetKeyboardLayout(input: SheetKeyboardLayoutInput): SheetKeyboardLayout {
  const { nominalSnapPoints, containerHeight, keyboardInset } = input
  const margin = input.margin ?? 8
  // Keyboard hidden (or a degenerate measurement): leave the sheet alone.
  if (!keyboardInset || keyboardInset <= 0 || containerHeight <= 0) {
    return { snapPoints: nominalSnapPoints, bottomInset: 0 }
  }
  const visible = Math.max(containerHeight - keyboardInset, 240)
  const snapPoints = nominalSnapPoints.map((point) => {
    // Absolute (px) detents stay as-is; only percentage detents are re-based
    // against the visible area.
    if (!point.endsWith("%")) return point
    const px = Math.round(Math.min((parseFloat(point) / 100) * containerHeight, visible - margin))
    return `${Math.max(px, 120)}px`
  })
  return { snapPoints, bottomInset: keyboardInset }
}
