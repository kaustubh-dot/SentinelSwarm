# Next Tasks

## What Is Already Created

- Slack app manifest draft: `manifest.yaml`.
- Environment template: `.env.example`.
- Slack setup guide: `docs/SLACK_SETUP.md`.
- Manual setup checklist: `docs/MANUAL_SETUP.md`.
- Runnable Node.js + TypeScript Slack app skeleton.
- Seeded Zone B demo data.
- Deterministic fallback planner.
- Block Kit Incident Control Room with Evidence Ledger.
- Approve Plan, Post to Coordination, and Generate Handover handlers.
- Real-Time Search wrapper with fallback to mock context.
- Open-Meteo weather/flood wrappers with mock fallback.
- Basic tests for severity, fallback planner, and Block Kit rendering.

## Your Immediate Manual Tasks

Do these in Slack/Devpost:

1. Join the Devpost hackathon.
2. Create or open your Slack developer sandbox.
3. Create a Slack app from `manifest.yaml`.
4. Enable Socket Mode.
5. Create an app-level token with `connections:write`.
6. Install the app to the workspace.
7. Create these channels:
   - `#field-reports`
   - `#volunteers`
   - `#supplies`
   - `#routes`
   - `#shelters`
   - `#alerts`
   - `#coordination`
8. Invite SentinelSwarm to all demo channels.
9. Copy token values into `.env`.
10. Copy the channel ID for `#coordination` into `.env`.

## Local Commands

After `.env` is filled:

```bash
npm run dev
```

In Slack:

```txt
@SentinelSwarm ping
```

Then:

```txt
@SentinelSwarm analyze Zone B risk
```

## Next Coding Task

After your Slack app tokens are in `.env`, run the live Slack smoke test.

Expected result:

```txt
@SentinelSwarm ping
-> bot replies

@SentinelSwarm analyze Zone B risk
-> Incident Control Room appears
-> Approve Plan works
-> Post to Coordination works
```

If Slack setup fails, capture the exact Slack error and fix setup before adding LLM or MCP.

## MCP Decision

Do not connect Slack as MCP now.

Only add MCP if the core demo is already stable. If added, make it a tiny SentinelSwarm resource MCP server for shelter/supply/weather data, not a second Slack integration.
