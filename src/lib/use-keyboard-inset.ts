import { useEffect, useState } from "react"
import { Keyboard, Platform, useWindowDimensions } from "react-native"
import { keyboardInsetFromSignals } from "./keyboard-inset"

/**
 * Keyboard height in pixels, for bottom-padding containers — 0 when the
 * keyboard is hidden or on non-Android platforms.
 *
 * Why manual instead of KeyboardAvoidingView: under Android edge-to-edge
 * (window no longer resizes on newer RN/Expo builds), the keyboardDidShow
 * event's screenY is reported as the full-screen bottom, so KAV's
 * "padding"/"height" math yields 0 and input stays hidden behind the
 * keyboard (issue #147 follow-up — the chat composer in app/session/[id].tsx
 * was fixed with exactly this technique and verified on-device).
 *
 * Two signals, SUBTRACT (not max — see below):
 * 1. keyboardDidShow's endCoordinates.height (accurate IME insets).
 * 2. Window shrink: on devices/OEM ROMs that still resize the window when
 *    the keyboard opens, the window shrinks by the keyboard's height.
 *    Tracking the tallest observed window height minus the current one
 *    measures how much the OS already moved the window out of the way.
 *
 * The manual inset must be the keyboard height that is STILL occluding the
 * window: windowShrink is the part the OS already handled, so the padding we
 * add is `eventInset - windowShrink`. Taking the max instead double-counts:
 * the window is already smaller by KB, and padding another KB on top makes
 * the usable height `winHeight - KB - KB` — which pushes gorhom's closed
 * sheet body (translateY = containerHeight = winHeight - bottomInset) up
 * onto the screen, where its invisible, touch-active frame swallows every
 * tap/scroll above the keyboard ("everything above the input is dead").
 * Concretely: window resize KB → inset 0 (OS already avoided it);
 * no resize → inset KB; partial resize → the difference.
 */
export function useKeyboardInset(): number {
  const [eventInset, setEventInset] = useState(0)
  const { height: winHeight } = useWindowDimensions()
  // Tallest observed window height (= keyboard hidden). Adjusted during
  // render — the React-sanctioned "adjust state when a prop changes"
  // pattern (a ref can't be read during render, and setState-in-effect
  // triggers the react-hooks/set-state-in-effect rule).
  const [maxWinHeight, setMaxWinHeight] = useState(winHeight)
  if (winHeight > maxWinHeight) setMaxWinHeight(winHeight)

  useEffect(() => {
    if (Platform.OS !== "android") return
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setEventInset(e.endCoordinates.height)
    })
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setEventInset(0)
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  if (Platform.OS !== "android") return 0
  const shrinkInset = Math.max(0, maxWinHeight - winHeight)
  // The OS already shrank the window by `shrinkInset`; only pad the rest.
  // Clamp at 0 — a full window resize means the keyboard is already avoided.
  return keyboardInsetFromSignals(eventInset, shrinkInset)
}
