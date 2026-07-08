# Next Tasks

This file tracks the immediate work that remains before recording and submission. Keep it updated as the live Slack demo changes.

## Current Status

- Node.js/TypeScript Slack Bolt app exists.
- Socket Mode app entrypoint exists.
- `@SentinelSwarm ping` and `@SentinelSwarm analyze Zone B risk` handlers exist.
- Incident Control Room Block Kit card exists.
- RTS attempt, live Slack channel scan fallback, and mock context fallback exist.
- Weather/flood adapters and mock fallbacks exist.
- Deterministic planner exists; optional Gemini refinement is guarded by fallbacks.
- Approval, post to coordination, and handover button handlers exist.
- Unit tests, typecheck, and build currently pass.
- Handler edge-case tests cover pre-approval posting, missing coordination channel setup hint, and handover threading.
- A tracked-file no-secrets check exists: `npm.cmd run check:secrets`.

## Immediate Manual Tasks

1. Run the Slack smoke test with real local `.env` values:

```powershell
npm.cmd run smoke:slack
```

2. Fix any `FAIL` result from the smoke test before recording.
3. Invite the bot to all demo channels:
   - `#field-reports`
   - `#alerts`
   - `#routes`
   - `#shelters`
   - `#supplies`
   - `#volunteers`
   - `#coordination`
4. Confirm `SLACK_COORDINATION_CHANNEL_ID` is a channel ID like `C...`, not `#coordination`.
5. Seed fictional messages from `docs/DEMO_SEED_MESSAGES.md`.
   - Preview with `npm.cmd run seed:slack`.
   - Post intentionally with `npm.cmd run seed:slack -- --post`.
6. Start the app:

```powershell
npm.cmd run dev
```

7. Test the exact flow:

```txt
@SentinelSwarm analyze Zone B risk
Approve Plan
Post to Coordination
Generate Handover
```

## Coding Tasks Still Worth Doing

- Optional: add one mocked end-to-end test for app mention -> plan store -> button actions if there is time after live rehearsal.
- Review Slack Block Kit payload sizes after any future LLM prompt or schema changes.

## Do Not Add Before Recording

- New external APIs.
- Autonomous background dispatch.
- Database or queue infrastructure.
- MCP dependency in the core demo path.
- Any feature that requires new Slack scopes unless the existing live demo is already recorded.
