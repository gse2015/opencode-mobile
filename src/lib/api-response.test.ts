import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { isNonJsonBody } from "./api-response.ts"
import { classifySessionOpError } from "./session-ops.ts"

describe("isNonJsonBody", () => {
  it("accepts plain application/json", () => {
    assert.equal(isNonJsonBody("application/json"), false)
  })

  it("accepts application/json with charset", () => {
    assert.equal(isNonJsonBody("application/json; charset=utf-8"), false)
  })

  it("accepts uppercase media type", () => {
    assert.equal(isNonJsonBody("Application/JSON"), false)
  })

  it("flags the SPA fallback (text/html)", () => {
    assert.equal(isNonJsonBody("text/html"), true)
  })

  it("flags text/html with a charset parameter (case-insensitive)", () => {
    assert.equal(isNonJsonBody("text/html; charset=UTF-8"), true)
  })

  it("flags a plain-text answer (e.g. a proxy error page)", () => {
    assert.equal(isNonJsonBody("text/plain"), true)
  })

  it("flags an unrelated media type such as a CSS response", () => {
    assert.equal(isNonJsonBody("text/css"), true)
  })

  it("tolerates a missing content-type (proxy that strips headers)", () => {
    assert.equal(isNonJsonBody(null), false)
    assert.equal(isNonJsonBody(undefined), false)
    assert.equal(isNonJsonBody(""), false)
  })
})

// The full incident link: an SPA fallback is raised as a 404 by sdk.ts's
// request() (sdk.ts is RN-only and not imported here — this pins the other
// end), which must classify as "unsupported" so the UI shows the
// "server does not support this" path instead of a bogus failure.
describe("SPA fallback degrades to unsupported (wiring)", () => {
  it("404 (what the SPA-fallback guard raises) classifies as unsupported", () => {
    assert.equal(classifySessionOpError(404, false), "unsupported")
  })

  it("503 still classifies as busy for compact", () => {
    assert.equal(classifySessionOpError(503, true), "busy")
  })
})
