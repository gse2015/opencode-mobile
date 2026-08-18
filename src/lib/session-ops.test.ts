import { describe, it } from "node:test"
import assert from "node:assert/strict"
import type { Message, Part } from "./sdk.ts"
import { buildForkableMessages, classifySessionOpError, findLastUserMessage, type ForkableMessage } from "./session-ops.ts"

function user(id: string, created: number): Message {
  return { id, sessionID: "s1", role: "user", time: { created } }
}

function assistant(id: string, created: number): Message {
  return { id, sessionID: "s1", role: "assistant", time: { created } }
}

function textPart(id: string, text: string): Part {
  return { id, messageID: id, type: "text", text }
}

describe("findLastUserMessage", () => {
  it("returns null for empty messages", () => {
    assert.equal(findLastUserMessage([]), null)
  })

  it("returns null when there are only assistant messages", () => {
    assert.equal(findLastUserMessage([assistant("a1", 1), assistant("a2", 2)]), null)
  })

  it("returns null when only optimistic temp- messages exist", () => {
    assert.equal(findLastUserMessage([user("temp-1", 1)]), null)
  })

  it("returns the last user message in a mixed list", () => {
    const messages = [assistant("a1", 1), user("u1", 2), assistant("a2", 3), user("u2", 4)]
    assert.equal(findLastUserMessage(messages)?.id, "u2")
  })

  it("skips temp- messages even when they appear last", () => {
    const messages = [user("u1", 2), assistant("a2", 3), user("temp-4", 4)]
    assert.equal(findLastUserMessage(messages)?.id, "u1")
  })

  it("skips messages at/after the pending revert point", () => {
    const messages = [user("u1", 1), assistant("a1", 2), user("u2", 3), assistant("a2", 4)]
    assert.equal(findLastUserMessage(messages, "u2")?.id, "u1")
  })

  it("keeps user messages strictly before the revert point", () => {
    const messages = [user("u1", 1), user("u2", 2), user("u3", 3)]
    assert.equal(findLastUserMessage(messages, "u3")?.id, "u2")
  })
})

describe("buildForkableMessages", () => {
  const parts: Record<string, Part[]> = {
    u1: [textPart("p1", "  hello "), textPart("p2", "world  ")],
    u2: [textPart("p3", "only text")],
    u3: [],
  }

  it("returns an empty list for no messages", () => {
    assert.deepEqual(buildForkableMessages([], {}), [])
  })

  it("builds entries with trimmed concatenated text and creation time", () => {
    const messages = [user("u1", 100), assistant("a1", 200), user("u2", 300)]
    const result = buildForkableMessages(messages, parts)
    assert.deepEqual(result, [
      { id: "u1", text: "hello  world", time: 100 },
      { id: "u2", text: "only text", time: 300 },
    ])
  })

  it("excludes assistant messages and temp- user messages", () => {
    const messages = [assistant("a1", 1), user("temp-5", 2), user("u1", 3)]
    const result = buildForkableMessages(messages, parts)
    assert.deepEqual(result.map((m: ForkableMessage) => m.id), ["u1"])
  })

  it("excludes messages hidden behind a pending revert", () => {
    const messages = [user("u1", 1), user("u2", 2), user("u3", 3)]
    const result = buildForkableMessages(messages, parts, "u2")
    assert.deepEqual(result.map((m: ForkableMessage) => m.id), ["u1"])
  })

  it("drops messages without a created timestamp", () => {
    const messages = [user("u0", 0), user("u1", 5)]
    const result = buildForkableMessages(messages, parts)
    assert.deepEqual(result.map((m: ForkableMessage) => m.id), ["u1"])
  })

  it("treats missing parts as empty text", () => {
    const messages = [user("uX", 7)]
    const result = buildForkableMessages(messages, parts)
    assert.deepEqual(result, [{ id: "uX", text: "", time: 7 }])
  })
})

describe("classifySessionOpError", () => {
  it("maps 404 to unsupported", () => {
    assert.equal(classifySessionOpError(404), "unsupported")
  })

  it("maps 401 and 403 to auth", () => {
    assert.equal(classifySessionOpError(401), "auth")
    assert.equal(classifySessionOpError(403), "auth")
  })

  it("maps 503 to error by default and to busy when busyAsBusy is set", () => {
    assert.equal(classifySessionOpError(503), "error")
    assert.equal(classifySessionOpError(503, true), "busy")
  })

  it("maps anything else to error", () => {
    assert.equal(classifySessionOpError(500), "error")
    assert.equal(classifySessionOpError(0), "error")
  })
})
