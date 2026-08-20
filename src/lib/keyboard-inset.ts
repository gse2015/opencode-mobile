// Pure keyboard-avoidance math (zero runtime imports, unit-testable under
// plain `node --test` — same convention as sheet-keyboard.ts).

/**
 * Manual keyboard padding = the IME height that is STILL occluding the
 * window, after the OS's own window resize has already been accounted for.
 *
 * On devices whose window resizes when the IME opens, `windowShrink` is how
 * much the OS already moved the window up; adding the full IME height on top
 * double-counts and breaks every absolute-fill child (see the hook docstring).
 */
export function keyboardInsetFromSignals(eventInset: number, windowShrink: number): number {
  return Math.max(0, eventInset - windowShrink)
}
