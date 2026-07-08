# SentinelSwarm Roadmap

## North Star

Build SentinelSwarm as a Slack Agent for Good that turns monsoon flood response chaos in Zone B into an evidence-linked, prioritized, human-approved action plan inside Slack.

The demo must work even if Real-Time Search, weather/flood APIs, and the LLM all fail.

## Critical Path

### Milestone 1: Slack Setup Proof

Goal: remove the biggest unknown first.

Deliver:

- Slack sandbox created.
- Slack app installed.
- Socket Mode enabled.
- `app_mention` subscribed.
- Interactivity enabled.
- `@SentinelSwarm ping` reaches the local app.
- Confirmation whether `app_mention` includes `action_token`.

Success test:

```txt
@SentinelSwarm ping
-> bot replies in Slack
```

### Milestone 2: Deterministic Local Brain

Goal: make the demo independent of APIs.

Deliver:

- Local JSON for Zone B, shelters, routes, volunteers, supplies, mock context, mock weather, and mock flood risk.
- Deterministic planner.
- Severity scoring.
- Evidence Ledger structure.

Success test:

```txt
npm test
-> fallback planner produces a complete Zone B incident plan
```

### Milestone 3: Incident Control Room

Goal: make the Slack response feel premium and specific.

Deliver:

- Block Kit Incident Control Room.
- Evidence Ledger.
- Risk summary.
- Route conflict.
- Shelter, supply, and volunteer matches.
- Status indicators for RTS/weather/flood/planner.
- Human approval disclaimer.

Success test:

```txt
@SentinelSwarm analyze Zone B risk
-> thread contains a readable Incident Control Room
```

### Milestone 4: Approval And Coordination

Goal: complete the end-to-end workflow.

Deliver:

- Approve Plan button.
- Post to Coordination button.
- In-memory plan state.
- Final clean `#coordination` post.

Success test:

```txt
Approve Plan
-> plan marked approved
Post to Coordination
-> #coordination receives final plan
```

### Milestone 5: RTS Integration

Goal: satisfy and showcase the required Slack technology.

Deliver:

- `assistant.search.context` wrapper.
- `action_token` extraction.
- RTS status badge.
- Evidence snippets from RTS results when available.
- Graceful fallback to `mockContext.json`.

Success test:

```txt
@SentinelSwarm analyze Zone B risk
-> card shows either "Real-Time Search used" or "Fallback context used"
```

### Milestone 6: Weather/Flood Signal

Goal: add real-world context without adding demo risk.

Deliver:

- Open-Meteo weather fetch.
- Open-Meteo flood fetch where feasible.
- Short timeout and mock fallback.
- Status indicators.

Success test:

```txt
Network off or API fails
-> demo still works with mock risk data
```

### Milestone 7: Judge-Ready Polish

Goal: make the project easy to understand in under 3 minutes.

Deliver:

- README.
- `docs/SLACK_SETUP.md`.
- Final `docs/DEMO_SCRIPT.md`.
- Architecture diagram export.
- Devpost copy.
- Demo video.
- Judge sandbox access.

Success test:

```txt
Fresh viewer understands the problem, Slack-native solution, RTS usage, and social impact in the first 60 seconds.
```

## Optional After Core Works

### Optional LLM Adapter

Add only after the deterministic planner works end to end.

The app must run without `OPENAI_API_KEY`.

### Optional MCP Server

Do not connect Slack as MCP for the first version.

If there is time, add a small SentinelSwarm MCP server for local crisis resources:

- `get_zone_resource_status`
- `get_shelter_capacity`
- `get_supply_inventory`
- `get_weather_risk_snapshot`

This gives a clean MCP story without duplicating Slack auth or risking the main demo.

## Freeze Rule

Once Milestone 4 works, do not add risky platform features until the demo video is recorded.
