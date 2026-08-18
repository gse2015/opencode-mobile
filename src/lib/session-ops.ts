import type { Message, Part } from "./sdk"

// Fork picker item — a user message the session can be forked from.
export interface ForkableMessage {
  id: string
  text: string
  time: number
}

// Message IDs are lexicographically sortable (same comparison the TUI uses) —
// a pending revert hides everything at/after revertMessageID. Optimistic
// "temp-" IDs are assigned client-side before the server responds and aren't
// part of that sort order, so they're always excluded from server-visible
// picks (undo/fork) and only kept for rendering.
function isVisible(msg: Message, revertMessageID?: string): boolean {
  if (msg.id.startsWith("temp-")) return false
  if (revertMessageID && msg.id >= revertMessageID) return false
  return true
}

// The last user message, skipping assistant messages, optimistic temp- ones,
// and anything hidden behind a pending revert. Returns null when there is
// nothing to undo/fork from.
export function findLastUserMessage(messages: Message[], revertMessageID?: string): Message | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]
    if (msg.role !== "user" || !isVisible(msg, revertMessageID)) continue
    return msg
  }
  return null
}

// Candidate fork points for the picker: visible user messages with a text
// preview (concatenated text parts, trimmed) and their creation time.
// Messages without a created timestamp are dropped.
export function buildForkableMessages(
  messages: Message[],
  parts: Record<string, Part[]>,
  revertMessageID?: string,
): ForkableMessage[] {
  return messages
    .filter((msg) => msg.role === "user" && isVisible(msg, revertMessageID))
    .map((msg) => {
      const text = (parts[msg.id] || [])
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join(" ")
      return { id: msg.id, text: text.trim(), time: msg.time.created }
    })
    .filter((m) => m.time > 0)
}

// Maps an API error status to a user-facing failure reason for session
// operations. 404 means the server doesn't support the operation; 401/403
// mean the credentials were rejected. 503 (session busy) only matters for
// compaction — pass busyAsBusy to surface it distinctly.
export type SessionOpFailure = "unsupported" | "auth" | "busy" | "error"

export function classifySessionOpError(status: number, busyAsBusy = false): SessionOpFailure {
  if (status === 404) return "unsupported"
  if (status === 401 || status === 403) return "auth"
  if (status === 503 && busyAsBusy) return "busy"
  return "error"
}
