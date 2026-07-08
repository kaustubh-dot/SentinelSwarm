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
- LLM refinement is optional and off by default. If the API key is missing, the compatible API fails, or the LLM returns invalid JSON after one schema-repair retry, SentinelSwarm uses the deterministic fallback planner.

## Setup

1. Create a Slack app from `manifest.yaml`.
2. Enable Socket Mode and create an app-level token with `connections:write`.
3. Install the app to your Slack developer sandbox.
4. Invite the bot to the demo channels.
5. Copy `.env.example` to `.env` and fill the Slack tokens.
   - For live recording, set `SENTINEL_FORCE_MOCKS=false`.
   - Use `SENTINEL_FORCE_MOCKS=true` only for fallback rehearsal.
   - Leave `SENTINEL_USE_LLM=false` for the most reliable demo path.
6. Install dependencies and run:

```bash
npm install
npm run dev
```

See [docs/SLACK_SETUP.md](docs/SLACK_SETUP.md) and [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md).

## Optional LLM Refinement

The live Slack demo does not require an LLM. Keep the main Zone B run focused on:

```txt
SENTINEL_FORCE_MOCKS=false
SENTINEL_USE_LLM=false
@SentinelSwarm analyze Zone B risk
```

To experiment with an OpenAI-compatible refinement layer after the deterministic demo works, set:

```txt
SENTINEL_USE_LLM=true
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5.4-mini
```

This layer may polish or refine the structured plan, but it is never required for the demo. Missing credentials, API errors, timeouts, and invalid LLM JSON all fall back to the deterministic planner so approval and posting still work.

Privacy note: enable LLM refinement only when your Slack demo data is fictional or you are allowed to send it to the configured provider. SentinelSwarm redacts raw Slack user IDs, channel IDs, permalinks, and URLs before the optional LLM call, but the report text is still included for planning context.

## Test

```bash
npm test
npm run build
npm run smoke:slack
```

On Windows PowerShell, prefer the `.cmd` forms if script execution policy blocks npm shims:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run smoke:slack
npm.cmd run dev
```

`npm run smoke:slack` checks Slack tokens, Socket Mode token validity, demo channel access, and `#coordination` setup without printing secrets.

Use the opt-in write check only when you are comfortable posting a harmless test message to `#coordination`:

```bash
npm run smoke:slack -- --post-test
```

## MCP Stance

MCP is optional. The main required hackathon technology is Real-Time Search API. Add a small SentinelSwarm resource MCP server only after the Slack demo is stable.
