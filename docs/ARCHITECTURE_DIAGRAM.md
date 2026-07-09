# Architecture Diagram

Use this diagram in the Devpost submission or as a quick screenshot during judging.

```mermaid
flowchart LR
  Responder["Responder in Slack"] --> Mention["@SentinelSwarm analyze Zone B risk"]
  Mention --> Bolt["Slack Bolt app<br/>Socket Mode"]
  Bolt --> RTS["assistant.search.context<br/>Real-Time Search"]
  RTS --> Evidence["Evidence Ledger<br/>Slack snippets + links"]
  RTS -. failure .-> MockContext["mockContext.json"]
  MockContext -. optional enrichment .-> SlackScan["Live Slack channel scan"]
  SlackScan --> Evidence
  Bolt --> RiskTools["Weather + flood adapters"]
  RiskTools --> Weather["Open-Meteo weather"]
  RiskTools --> Flood["Open-Meteo flood signal"]
  Weather -. failure .-> MockWeather["mockWeather.json"]
  Flood -. failure .-> MockFlood["mockFlood.json"]
  Bolt --> LocalData["Local JSON<br/>routes, shelters, supplies, volunteers"]
  Evidence --> Planner["Deterministic planner<br/>optional Gemini refinement"]
  MockContext --> Planner
  MockWeather --> Planner
  MockFlood --> Planner
  LocalData --> Planner
  Planner --> Zod["Zod validation"]
  Zod --> BlockKit["Block Kit Incident Control Room"]
  BlockKit --> Refresh["Refresh Analysis<br/>latest Slack context"]
  Refresh --> MockContext
  MockContext -. optional enrichment .-> SlackScan
  BlockKit --> Approval["Approve Plan button"]
  Approval --> Coordination["Post to #coordination"]
  BlockKit --> Handover["Generate Handover"]
```

## Fallback Contract

- RTS failure: use `src/data/mockContext.json` as the guaranteed fallback, then enrich with live Slack channel scan when available.
- Weather failure: use `src/data/mockWeather.json`.
- Flood failure: use `src/data/mockFlood.json`.
- LLM failure or invalid JSON: use deterministic planner after one repair attempt.
- Missing `SLACK_COORDINATION_CHANNEL_ID`: show a readable Slack setup hint and keep the plan in the source thread.

## Human-Control Boundary

SentinelSwarm recommends a plan, but it does not dispatch volunteers or post final assignments until a coordinator clicks approval and then posts to `#coordination`.
