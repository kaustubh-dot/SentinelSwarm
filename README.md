# SentinelSwarm

SentinelSwarm is a Slack-native crisis coordination agent for the Slack Agent Builder Challenge. The demo story is monsoon flood response in Zone B: scattered field reports, route updates, shelter capacity, volunteers, and supplies become an evidence-linked, human-approved action plan inside Slack.

## Core Demo

```txt
@SentinelSwarm analyze Zone B risk
-> Incident Control Room appears
-> Evidence Ledger shows why the plan was created
-> Refresh Analysis can rerun after a new route update
-> Approve Plan, which reveals Post to Coordination
-> Post to Coordination
-> #coordination receives the final action plan
```

## 3-Minute Judge Flow

1. Show seeded Slack chaos across `#alerts`, `#field-reports`, `#routes`, `#shelters`, `#supplies`, and `#volunteers`.
2. In `#field-reports`, run `@SentinelSwarm analyze Zone B risk`.
3. Review the Block Kit Incident Control Room: evidence, source statuses, risk signals, severity, routes, shelter, volunteers, supplies, and recommended plan.
4. Add a changed route update and click `Refresh Analysis` to show the plan updates from Slack context.
5. Click `Approve Plan`.
6. Click `Post to Coordination`.
7. Show the final approved plan in `#coordination`.

## Why It Is Roadblock-Safe

The app is designed to work even if external services fail:

- Real-Time Search failure -> local `mockContext.json`, with live Slack channel scan used only as optional enrichment when available
- Weather API failure -> local `mockWeather.json`
- Flood API failure -> local `mockFlood.json`
- Gemini refinement is optional and off by default. If the API key is missing, Gemini fails, or the model returns invalid JSON after one schema-repair retry, SentinelSwarm uses the deterministic fallback planner.

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
For the hosted backup run, see [docs/RENDER_DEPLOY.md](docs/RENDER_DEPLOY.md).

## Demo And Submission Assets

- [Demo seed messages](docs/DEMO_SEED_MESSAGES.md)
- [Demo script](docs/DEMO_SCRIPT.md)
- [Demo video storyboard](docs/DEMO_VIDEO_STORYBOARD.md)
- [Devpost submission draft](docs/DEVPOST_SUBMISSION_DRAFT.md)
- [Architecture diagram](docs/ARCHITECTURE_DIAGRAM.md)
- [Render deploy notes](docs/RENDER_DEPLOY.md)
- [Judge Q&A](docs/JUDGE_QA.md)
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md)

Operator proof and live-run docs such as `DEMO_PROOF.md`, `OWNER_TODO.md`, and `OWNER_LIVE_RUNBOOK.md` are kept in `docs/` so the remaining live-demo work stays visible without duplicating old status ledgers.

## Seed The Demo Workspace

Preview the fictional Zone B seed pack without touching Slack:

```powershell
npm.cmd run seed:slack
```

After the sandbox channels exist and the bot is invited, post the seed pack intentionally:

```powershell
npm.cmd run seed:slack -- --post
```

The seed command never sends the bot mention. Trigger the demo yourself from `#field-reports` with `@SentinelSwarm analyze Zone B risk`.

## Optional Gemini Refinement

The live Slack demo does not require an LLM. Keep the main Zone B run focused on:

```txt
SENTINEL_FORCE_MOCKS=false
SENTINEL_USE_LLM=false
@SentinelSwarm analyze Zone B risk
```

To experiment with Gemini refinement after the deterministic demo works, set these only in your local ignored `.env` file:

```txt
SENTINEL_USE_LLM=true
GOOGLE_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash
```

This layer may polish or refine the structured plan, but it is never required for the demo. Missing credentials, API errors, timeouts, and invalid LLM JSON all fall back to the deterministic planner so approval and posting still work.

Privacy note: enable Gemini refinement only when your Slack demo data is fictional or you are allowed to send it to Google. SentinelSwarm redacts raw Slack user IDs, channel IDs, permalinks, and URLs before the optional Gemini call, but the report text is still included for planning context. Never commit `GOOGLE_API_KEY`.

## Test

```bash
npm test
npm run build
npm run smoke:slack
```

On Windows PowerShell, prefer the `.cmd` forms if script execution policy blocks npm shims:

```powershell
npm.cmd test
npm.cmd run check:secrets
npm.cmd run build
npm.cmd run seed:slack
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
