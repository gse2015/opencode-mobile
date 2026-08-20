/**
 * The version of the app that is running, from build metadata.
 *
 * Read from `app.json` (inlined by Metro at build time) — the same source
 * Sentry uses for its `release` identifier, so the two always agree.
 */
import appJson from "../../app.json"

export const CURRENT_VERSION = (appJson as { expo?: { version?: string } }).expo?.version ?? "unknown"
