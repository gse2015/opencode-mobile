import { useEffect, useState } from "react"
import { Keyboard, Platform } from "react-native"

/**
 * Keyboard height in pixels, measured from IME insets — 0 when the keyboard
 * is hidden or on non-Android platforms. Callers pad the bottom of a
 * container (or a scroll content container) with the returned value.
 *
 * Why manual instead of KeyboardAvoidingView: under Android edge-to-edge
 * (window no longer resizes on newer RN/Expo builds), the keyboardDidShow
 * event's screenY is reported as the full-screen bottom, so KAV's
 * "padding"/"height" math yields 0 and input stays hidden behind the
 * keyboard (issue #147 follow-up — the chat composer in app/session/[id].tsx
 * was fixed with exactly this technique and verified on-device). The event's
 * endCoordinates.height comes from IME insets and IS accurate.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0)
  useEffect(() => {
    if (Platform.OS !== "android") return
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setInset(e.endCoordinates.height)
    })
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setInset(0)
    })
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])
  return inset
}
