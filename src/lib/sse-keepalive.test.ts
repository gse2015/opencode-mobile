import { test } from "node:test"
import assert from "node:assert/strict"
import { shouldProbe } from "./sse-keepalive.ts"

test("shouldProbe returns true when foreground and no event for >= staleAfterMs", () => {
  assert.equal(shouldProbe({ lastEventAt: 0, now: 120_000, appActive: true }, 120_000), true)
})

test("shouldProbe returns false before the stale threshold", () => {
  assert.equal(shouldProbe({ lastEventAt: 0, now: 119_999, appActive: true }, 120_000), false)
})

test("shouldProbe returns false when app is in background even past threshold", () => {
  assert.equal(shouldProbe({ lastEventAt: 0, now: 500_000, appActive: false }, 120_000), false)
})

test("shouldProbe uses the caller-supplied threshold", () => {
  assert.equal(shouldProbe({ lastEventAt: 1_000, now: 3_000, appActive: true }, 2_000), true)
  assert.equal(shouldProbe({ lastEventAt: 1_000, now: 2_999, appActive: true }, 2_000), false)
})
