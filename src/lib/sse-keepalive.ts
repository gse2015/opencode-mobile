export interface KeepaliveState {
  lastEventAt: number
  now: number
  appActive: boolean
}

// Probe the server only when foregrounded and no SSE event has arrived for a
// while. In the background the JS thread is frozen anyway; probing there is
// wasted work. The probe distinguishes "connection really dead" from "server
// alive but idle" so we don't churn reconnects on an idle session screen.
export function shouldProbe(state: KeepaliveState, staleAfterMs: number): boolean {
  return state.appActive && state.now - state.lastEventAt >= staleAfterMs
}
