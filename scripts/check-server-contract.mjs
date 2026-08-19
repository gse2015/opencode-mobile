#!/usr/bin/env node
// Server API contract check — run against a REAL opencode server before
// shipping a release, to catch the class of bug where an endpoint the app
// depends on silently changed: on current server builds, unmatched routes
// fall through to the web-UI SPA and answer HTTP 200 + text/html, which
// looked like a "success" to the client (this is how /compact broke — the
// route never existed; the real endpoint is POST /session/:id/summarize).
//
// Usage:
//   node scripts/check-server-contract.mjs --url http://host:4096 [--password <pw>]
//
// Verdicts per endpoint:
//   ok            2xx and JSON
//   json-error    non-2xx but a real JSON error  (route exists, bad input — fine for probes)
//   spa-fallback  2xx with a non-JSON body  (route does NOT exist on this server)
//   fail          network error / non-JSON non-fallback (e.g. 500 with HTML)
//
// "core" endpoints must be ok or json-error (never spa-fallback) — otherwise
// the script exits 1. "optional" endpoints (unshare/legacy compact) are
// reported but not fatal: the app degrades to a "not supported" alert for them.
//
// No dependencies — plain node (>=18) with global fetch.

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  if (i === -1) return null
  return args[i + 1] ?? null
}

const url = (flag("--url") ?? "").replace(/\/+$/, "")
const password = flag("--password")

if (!url) {
  console.error("usage: node scripts/check-server-contract.mjs --url http://host:4096 [--password <pw>]")
  process.exit(2)
}

const auth = password ? "Basic " + Buffer.from(`opencode:${password}`).toString("base64") : null

async function probe(method, path, body, label) {
  const t0 = Date.now()
  try {
    const res = await fetch(url + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await res.text()
    const isHtml = /<html|<!doctype/i.test(text.slice(0, 200))
    let isJson = false
    if (!isHtml) {
      try {
        JSON.parse(text)
        isJson = true
      } catch {
        isJson = false
      }
    }
    let verdict
    if (isJson) verdict = res.ok ? "ok" : "json-error"
    else if (res.ok) verdict = "spa-fallback"
    else verdict = "fail"
    const ms = Date.now() - t0
    console.log(`${verdict.padEnd(12)} ${String(res.status).padStart(3)} ${String(ms).padStart(5)}ms  ${label}  (${method} ${path})`)
    return { verdict, status: res.status, isJson, body: text }
  } catch (e) {
    console.log(`fail         —    —      ms  ${label}  (${method} ${path})  -> ${e.message}`)
    return { verdict: "fail", status: 0, isJson: false, body: "" }
  }
}

async function main() {
  console.log(`Checking API contract against ${url}\n`)
  let sessionID = null
  const problems = []
  const notes = []

  const coreChecks = []

  // --- no-session-needed core endpoints ---
  coreChecks.push(probe("GET", "/global/health", undefined, "[core] server health"))
  coreChecks.push(probe("GET", "/session", undefined, "[core] session list"))
  coreChecks.push(probe("GET", "/command", undefined, "[core] user commands"))
  coreChecks.push(probe("GET", "/agent", undefined, "[core] agent list"))
  coreChecks.push(probe("GET", "/provider", undefined, "[core] provider list"))

  // --- create a throwaway session ---
  const created = await probe("POST", "/session", {}, "[core] create session")
  if (created.isJson) {
    try {
      const j = JSON.parse(created.body)
      sessionID = j?.id ?? j?.data?.id ?? null
    } catch {
      sessionID = null
    }
  }
  if (!sessionID) {
    console.log("\nCould not create a probe session — skipping per-session checks.")
  } else {
    console.log(`\nProbe session: ${sessionID}\n`)
    coreChecks.push(await probe("GET", `/session/${sessionID}/message`, undefined, "[core] session messages"))
    // The compaction endpoint. The body model is only valid when the server
    // has that model — any JSON answer (200 or 4xx) satisfies the contract;
    // an SPA fallback means the route does not exist (the incident).
    coreChecks.push(
      await probe(
        "POST",
        `/session/${sessionID}/summarize`,
        { sessionID, providerID: "probe", modelID: "none" },
        "[core] compaction (summarize)",
      ),
    )
    // Optional operations — reported, not fatal.
    const unshare = await probe("POST", `/session/${sessionID}/unshare`, {}, "[opt] unshare")
    if (unshare.verdict === "spa-fallback") notes.push("unshare route not on this server — app will show 'not supported'")
    const legacyCompact = await probe("POST", `/session/${sessionID}/compact`, undefined, "[opt] legacy /compact (unused by app)")
    if (legacyCompact.verdict === "spa-fallback") notes.push("legacy /compact absent (expected on current builds — app uses /summarize)")

    // Cleanup: delete the throwaway session (best effort).
    await probe("DELETE", `/session/${sessionID}`, undefined, "[info] delete probe session")
  }

  const core = coreChecks.filter((c) => c.label?.includes("[core]"))
  for (const c of core) {
    if (c.verdict === "spa-fallback") problems.push(`${c.label}: route answered with the SPA shell (200 + HTML) — endpoint missing on this server`)
    if (c.verdict === "fail") problems.push(`${c.label}: no usable response`)
  }

  console.log("")
  for (const n of notes) console.log(`note: ${n}`)
  if (problems.length) {
    console.log("")
    for (const p of problems) console.log(`FAIL: ${p}`)
    process.exit(1)
  }
  console.log(`all core endpoints answered with JSON — contract holds for ${url}`)
}

main().catch((e) => {
  console.error("check crashed:", e)
  process.exit(1)
})
