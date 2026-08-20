import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { join } from "node:path"

// Regression guard for the gorhom backdrop touch-eating bug.
//
// A `backdropComponent` whose value is an inline arrow/JSX is a NEW component
// type on every render, so React unmounts/remounts the backdrop subtree each
// time. Every remount resets the backdrop's internal pointerEvents state to
// 'auto' and re-rolls a mount race shipped in @gorhom/bottom-sheet (its
// useAnimatedReaction first fire can be skipped by the isMounted guard it
// documents as issue #1376); while the sheet stays closed the animation index
// never moves, the reaction never re-fires, and the backdrop stays 'auto'
// permanently — an invisible full-area layer that swallows every touch above
// the keyboard (the "chat screen dies when the IME shows" regression).
//
// The only sanctioned form is a stable module-level component (see
// SheetBackdrop.tsx), i.e. `backdropComponent={SomeIdentifier}`.

const root = fileURLToPath(new URL("../../..", import.meta.url))

// `backdropComponent={` followed by anything that is NOT the start of an
// identifier: inline arrow `(...)`, inline JSX `<...>`, object literal, etc.
const inline = /backdropComponent=\{(?![A-Za-z_$])/

function tsxFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) tsxFiles(full, out)
    else if (entry.name.endsWith(".tsx")) out.push(full)
  }
  return out
}

describe("sheet backdrop regression guard", () => {
  it("no screen or component passes an inline backdropComponent", () => {
    const offenders: string[] = []
    for (const dir of ["src", "app"]) {
      const base = join(root, dir)
      for (const file of tsxFiles(base)) {
        readFileSync(file, "utf8")
          .split("\n")
          .forEach((line, i) => {
            if (inline.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`)
          })
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `inline backdropComponent found — it remounts the gorhom backdrop on every render and re-rolls its pointerEvents mount race; use the stable SheetBackdrop component: ${offenders.join("\n")}`,
    )
  })

  it("no sheet uses keyboard-driven snapPoints/bottomInset", () => {
    // Fully revert the keyboard-avoidance experiment for sheets (commit
    // b3b7ce5). Two on-device-verified failure modes:
    // 1. A CLOSED sheet with bottomInset>0 (IME up) computes
    //    closedDetentPosition = containerHeight = winHeight - bottomInset,
    //    lifting its body onto the screen; the body is opacity:0 on Android
    //    but its frame stays touch-active, swallowing every tap/scroll above
    //    the keyboard ("everything above the input is dead").
    // 2. Changing snapPoints while the open animation runs makes gorhom's
    //    OnSnapPointsChange reaction snap the sheet back to the closed
    //    position ("the list flashes open then closes").
    // So sheets must keep static, keyboard-independent geometry and rely on
    // the library's own keyboardBehavior="interactive" for IME avoidance.
    const offenders: string[] = []
    for (const dir of ["src"]) {
      const base = join(root, dir)
      for (const file of tsxFiles(base)) {
        const lines = readFileSync(file, "utf8").split("\n")
        lines.forEach((line, i) => {
          if (line.includes("sheetKeyboardLayout") || /bottomInset=/.test(line)) {
            offenders.push(`${file}:${i + 1}: ${line.trim()}`)
          }
        })
      }
    }
    assert.deepEqual(
      offenders,
      [],
      `keyboard-driven sheet geometry found — sheets must keep static snapPoints (no sheetKeyboardLayout/bottomInset): ${offenders.join("\n")}`,
    )
  })
})
