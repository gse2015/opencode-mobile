import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { keyboardInsetFromSignals } from "./keyboard-inset.ts"

describe("keyboardInsetFromSignals", () => {
  it("returns the full IME inset when the window does not resize", () => {
    assert.equal(keyboardInsetFromSignals(320, 0), 320)
  })

  it("returns 0 when the window fully resized (OS already avoided the IME)", () => {
    assert.equal(keyboardInsetFromSignals(320, 320), 0)
  })

  it("returns the uncovered remainder for a partial window resize", () => {
    assert.equal(keyboardInsetFromSignals(320, 120), 200)
  })

  it("clamps at 0 when the shrink exceeds the reported inset", () => {
    assert.equal(keyboardInsetFromSignals(200, 320), 0)
  })

  it("is 0 when the keyboard is hidden regardless of shrink", () => {
    assert.equal(keyboardInsetFromSignals(0, 0), 0)
    assert.equal(keyboardInsetFromSignals(0, 320), 0)
  })
})
