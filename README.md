# SentinelSwarm

SentinelSwarm is a Slack-native crisis coordination agent for the Slack Agent Builder Challenge. The demo story is monsoon flood response in Zone B: scattered field reports, route updates, shelter capacity, volunteers, and supplies become an evidence-linked, human-approved action plan inside Slack.

## Core Demo

```txt
@SentinelSwarm analyze Zone B risk
-> Incident Control Room appears
-> Evidence Ledger shows why the plan was created
-> Approve Plan
-> Post to Coordination
-> #coordination receives the final action plan
```

## Why It Is Roadblock-Safe

The app is designed to work even if external services fail:

- Real-Time Search failure -> live Slack channel scan when available -> local `mockContext.json`
- Weather API failure -> local `mockWeather.json`
- Flood API failure -> local `mockFlood.json`
- Planner currently runs deterministically; optional LLM mode is planned, and deterministic planning remains the fallback.

## Setup

1. Create a Slack app from `manifest.yaml`.
2. Enable Socket Mode and create an app-level token with `connections:write`.
3. Install the app to your Slack developer sandbox.
4. Invite the bot to the demo channels.
5. Copy `.env.example` to `.env` and fill the Slack tokens.
6. Install dependencies and run:

```bash
npm install
npm run dev
```

See [docs/SLACK_SETUP.md](docs/SLACK_SETUP.md) and [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md).

## Test

```bash
npm test
npm run build
npm run smoke:slack
```

`npm run smoke:slack` checks Slack tokens, Socket Mode token validity, demo channel access, and `#coordination` setup without printing secrets.

Use the opt-in write check only when you are comfortable posting a harmless test message to `#coordination`:

```bash
npm run smoke:slack -- --post-test
```

## MCP Stance

MCP is optional. The main required hackathon technology is Real-Time Search API. Add a small SentinelSwarm resource MCP server only after the Slack demo is stable.
