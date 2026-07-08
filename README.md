# SentinelSwarm

SentinelSwarm is a Slack-native crisis coordination agent for monsoon flood response. It turns scattered updates from field reports, routes, shelters, supplies, alerts, and volunteers into an evidence-linked Incident Control Room with human approval before the final plan is posted to `#coordination`.

SentinelSwarm is a decision-support agent, not an autonomous emergency dispatcher.

## What It Does

- Receives a Slack app mention such as `@SentinelSwarm analyze Zone A risk`.
- Searches Slack context when available, or uses seeded fallback evidence for demos.
- Combines evidence with fictional local resource data for zones, routes, shelters, supplies, and volunteers.
- Adds weather and flood risk signals with roadblock-safe mock fallbacks.
- Produces a structured Incident Control Room in Slack using Block Kit.
- Requires coordinator approval before posting the final plan to `#coordination`.
- Supports a handover summary for shift changes.

## Why It Matters

During a flood response, the right facts may already be in Slack, but spread across different channels and threads. Coordinators need a fast way to connect field reports with route status, shelter capacity, supply availability, and volunteer coverage. SentinelSwarm reduces time lost searching across messages while keeping the human coordinator responsible for decisions.

## Why Slack

Slack is where the response team is already working. SentinelSwarm uses Slack as the frontend and operating record:

- Channels hold field reports, alerts, routes, shelters, supplies, and volunteer updates.
- App mentions trigger the analysis in context.
- Real-Time Search or fallback evidence powers the Evidence Ledger.
- Block Kit renders the Incident Control Room.
- Button actions support human approval.
- `#coordination` receives the approved plan.

## Demo Flow

Primary demo path:

```txt
#field-reports receives Zone A incident report
-> @SentinelSwarm analyze Zone A risk: heavy rain near Zone A, water rising, 25 people need evacuation, route bridge blocked
-> Incident Control Room appears in thread
-> Coordinator reviews evidence, routes, shelter, supplies, volunteers, and severity
-> Coordinator clicks Approve Plan
-> Coordinator clicks Post to Coordination
-> #coordination receives the final approved plan
```

Backup demo path:

```txt
@SentinelSwarm analyze Zone B risk
```

Zone B currently has the strongest local fallback fixtures, so it is a good backup recording path if live Slack context is unavailable.

## Architecture

SentinelSwarm is a TypeScript Slack Bolt app running in Socket Mode.

```txt
Slack channels
-> Bolt + Socket Mode app
-> zone parsing + Real-Time Search or fallback context
-> local resource fixtures + weather/flood adapters
-> deterministic planner + Zod validation
-> Block Kit Incident Control Room
-> human approval
-> #coordination final plan
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md).

## Roadblock-Safe Design

The demo is built to degrade gracefully:

- Real-Time Search unavailable -> use local `mockContext.json`.
- Weather API unavailable -> use local `mockWeather.json`.
- Flood API unavailable -> use local `mockFlood.json`.
- LLM missing or unavailable -> use the deterministic fallback planner.
- Coordination posting not configured -> keep the plan visible in the source thread.

The response shows source status so judges can tell whether live or fallback inputs were used.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a Slack app from `manifest.yaml`.
3. Enable Socket Mode and install the app in a Slack developer sandbox.
4. Invite the bot to the demo channels:

```txt
#alerts
#field-reports
#routes
#shelters
#supplies
#volunteers
#coordination
```

5. Copy `.env.example` to `.env` and fill in local placeholder values with your own Slack app credentials.
6. Start the app:

```bash
npm run dev
```

Detailed setup is in [docs/SLACK_SETUP.md](docs/SLACK_SETUP.md) and [docs/MANUAL_SETUP.md](docs/MANUAL_SETUP.md).

## Environment Variables

Use placeholder values only in docs and examples. Never commit real tokens.

```txt
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-level-token
SLACK_COORDINATION_CHANNEL_ID=C0123456789
SLACK_SIGNING_SECRET=optional-signing-secret
OPENAI_API_KEY=optional-api-key
SENTINEL_USE_LLM=false
SENTINEL_FORCE_MOCKS=false
LOG_LEVEL=info
```

## Test

```bash
npm test
npm run build
```

## Documentation

- [Friend Agent Playbook](docs/FRIEND_AGENT_PLAYBOOK.md)
- [Demo Seed Messages](docs/DEMO_SEED_MESSAGES.md)
- [Demo Video Storyboard](docs/DEMO_VIDEO_STORYBOARD.md)
- [Devpost Submission Draft](docs/DEVPOST_SUBMISSION_DRAFT.md)
- [Architecture Diagram](docs/ARCHITECTURE_DIAGRAM.md)
- [Judge QA](docs/JUDGE_QA.md)
- [Submission Checklist](docs/SUBMISSION_CHECKLIST.md)
- [Requirements Traceability](docs/REQUIREMENTS_TRACEABILITY.md)
- [Roadmap](docs/ROADMAP.md)

## Project Status

Hackathon MVP:

- Slack mention handler.
- Incident Control Room Block Kit response.
- Evidence Ledger from Slack context or fallback context.
- Local fictional response resources.
- Weather/flood mock fallback behavior.
- Deterministic planner.
- Human approval before coordination posting.
- Handover summary action.

Future work:

- Stronger natural-language incident parsing.
- Persistent plan state outside memory.
- Role-based approval and audit history.
- More scenario fixtures and tests.
- Hardened production security and operations review.
- Optional MCP resource layer if it is implemented after the core Slack demo is stable.

## Safety Note

SentinelSwarm is built for a fictional hackathon demo. It does not dispatch emergency services, provide certified flood forecasts, or replace local incident command. Any real-world pilot would require security review, reliability testing, operational governance, and trained human oversight.
