// Pure response-shape checks, extracted so they're unit-testable under plain
// `node --test` without pulling in expo/fetch (sdk.ts is RN-only) — same
// pattern as api-error.ts / session-ops.ts. Zero runtime imports by
// convention for modules that are driven by node:test (source-file imports
// carry no .ts extension for Metro, which node cannot resolve).
//
// Why this exists: opencode servers that also serve the web UI answer
// *unmatched* routes with the SPA shell — HTTP 200 + text/html. A 200 whose
// body is not JSON is not a success for any client endpoint: JSON.parse
// throws a raw SyntaxError that none of the error classifiers understand, so
// the user saw a generic "operation failed" alert. That is exactly how the
// /session/:id/compact failure presented — the route did not exist on
// current server builds, the SPA fallback answered 200 + HTML, and the
// compact alert reported a bogus failure (the real endpoint is
// POST /session/:id/summarize).
// sdk.ts's request() turns a true result into an ApiError(404, …) so the
// session-ops classifier degrades to the "server does not support this" UI
// path instead of a bogus failure.

/**
 * True when a successful (2xx) response's content-type says the body is not
 * JSON — i.e. the server answered with the SPA shell of an unknown route.
 *
 * A missing/empty content-type is tolerated (returns false): some proxies
 * strip the header, and a real JSON body will still parse fine.
 */
export function isNonJsonBody(contentType: string | null | undefined): boolean {
  const ct = (contentType ?? "").toLowerCase()
  if (!ct) return false
  return !ct.includes("application/json")
}
