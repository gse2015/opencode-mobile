import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { sheetKeyboardLayout } from "./sheet-keyboard.ts"

const H = 852 // typical phone window height

describe("sheetKeyboardLayout", () => {
  it("returns the nominal snap points untouched when the keyboard is hidden", () => {
    const layout = sheetKeyboardLayout({
      nominalSnapPoints: ["50%", "80%"],
      containerHeight: H,
      keyboardInset: 0,
    })
    assert.deepEqual(layout, { snapPoints: ["50%", "80%"], bottomInset: 0 })
  })

  it("applies the IME inset as bottomInset when the keyboard is up", () => {
    const layout = sheetKeyboardLayout({
      nominalSnapPoints: ["50%", "80%"],
      containerHeight: H,
      keyboardInset: 320,
    })
    assert.equal(layout.bottomInset, 320)
    assert.ok(layout.snapPoints.length === 2)
    // Every detent, measured from the lifted bottom, must fit in the visible area.
    for (const point of layout.snapPoints) {
      const px = Number(point.replace("px", ""))
      assert.ok(px + layout.bottomInset <= H - 8, `detent ${point} overshoots the top edge`)
    }
  })

  it("caps a tall detent so the sheet cannot overshoot the top of the screen", () => {
    const layout = sheetKeyboardLayout({
      nominalSnapPoints: ["80%"],
      containerHeight: H,
      keyboardInset: 320,
    })
    // 80% of 852 = 682px; visible area is 532px, so the detent must shrink.
    assert.ok(Number(layout.snapPoints[0].replace("px", "")) < 682)
    assert.ok(Number(layout.snapPoints[0].replace("px", "")) + layout.bottomInset <= H - 8)
  })

  it("keeps a low detent at its nominal size when the visible area is ample", () => {
    const layout = sheetKeyboardLayout({
      nominalSnapPoints: ["30%"],
      containerHeight: H,
      keyboardInset: 200,
    })
    // 30% of 852 = 256px fits in the 644px visible area without capping.
    assert.equal(layout.snapPoints[0], "256px")
  })

  it("clamps to a usable minimum when the keyboard covers most of the screen", () => {
    const layout = sheetKeyboardLayout({
      nominalSnapPoints: ["50%", "80%"],
      containerHeight: H,
      keyboardInset: 800,
    })
    for (const point of layout.snapPoints) {
      const px = Number(point.replace("px", ""))
      assert.ok(px >= 120, "detent must never collapse to useless size")
    }
  })

  it("passes through non-percentage snap points verbatim", () => {
    const layout = sheetKeyboardLayout({
      nominalSnapPoints: ["300px"],
      containerHeight: H,
      keyboardInset: 320,
    })
    assert.deepEqual(layout.snapPoints, ["300px"])
  })
})
