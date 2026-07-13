# Architecture Diagram

The submission-ready, editable source is [`assets/sentinelswarm-architecture.svg`](assets/sentinelswarm-architecture.svg). Convert that file to PNG, JPG, or PDF for the Devpost upload.

The Mermaid version below is kept as a compact, text-diffable reference for the same runtime architecture.

```mermaid
flowchart LR
  Responder["Responder in Slack"] --> Mention["@SentinelSwarm analyze Zone B risk"]
  Mention --> Bolt["Slack Bolt app<br/>Socket Mode + temporary plan state"]
  Bolt --> RTS["assistant.search.context<br/>Real-Time Search"]
  RTS --> Evidence["Evidence Ledger<br/>Slack snippets + links"]
  RTS -. unavailable or no result .-> MockContext["mockContext.json<br/>guaranteed fallback"]
  MockContext -. optional enrichment .-> SlackScan["Live Slack channel scan"]
  SlackScan --> Evidence
  Bolt --> RiskTools["Weather + flood adapters"]
  RiskTools --> Weather["Open-Meteo weather"]
  RiskTools --> Flood["Open-Meteo flood signal"]
  Weather -. failure .-> MockWeather["mockWeather.json"]
  Flood -. failure .-> MockFlood["mockFlood.json"]
  Bolt --> LocalData["Local JSON<br/>routes, shelters, supplies, volunteers"]
  Evidence --> Planner["Deterministic planner<br/>evidence fusion, severity ranking, resource matching<br/>optional Gemini refinement"]
  MockContext --> Planner
  MockWeather --> Planner
  MockFlood --> Planner
  LocalData --> Planner
  Planner -->|"Evidence-backed draft plan"| BlockKit["Block Kit Incident Control Room"]
  BlockKit --> Refresh["Refresh Analysis<br/>safe enrichment + replan"]
  Refresh --> MockContext
  BlockKit --> Approval["Approve Plan button"]
  Approval --> Coordination["Post to #coordination"]
  BlockKit --> Handover["Generate Handover"]
```

## Fallback Contract

- RTS failure: use `src/data/mockContext.json` as the guaranteed fallback, then apply optional live Slack channel enrichment when available.
- Weather failure: use `src/data/mockWeather.json`.
- Flood failure: use `src/data/mockFlood.json`.
- LLM failure or invalid JSON: use deterministic planner after one repair attempt.
- Planner output is validated with Zod before the Incident Control Room is rendered.
- Missing `SLACK_COORDINATION_CHANNEL_ID`: show a readable Slack setup hint and keep the plan in the source thread.

## Human-Control Boundary

SentinelSwarm analyzes evidence and recommends actions. It does not dispatch volunteers or post to `#coordination` until a coordinator explicitly approves the plan.
