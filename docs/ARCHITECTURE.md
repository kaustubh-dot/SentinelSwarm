# Architecture

## Overview

SentinelSwarm is a Slack Socket Mode app. Slack is the primary interface; the backend receives app mentions and button actions, searches Slack context when possible, combines that with local operational data and weather/flood signals, then renders an Incident Control Room with human approval gates.

## Component Diagram

```mermaid
flowchart LR
  User["Responder in Slack"] --> Mention["@SentinelSwarm analyze Zone B risk"]
  Mention --> Slack["Slack Events API via Socket Mode"]
  Slack --> Bolt["Bolt JS App"]

  Bolt --> RTS["Real-Time Search: assistant.search.context"]
  RTS -->|success| Context["Retrieved Slack evidence"]
  RTS -->|failure or missing token| MockContext["mockContext.json"]

  Bolt --> LocalData["Local JSON: zones, routes, shelters, volunteers, supplies"]
  Bolt --> Weather["Open-Meteo Weather API"]
  Weather -->|failure| MockWeather["mockWeather.json"]
  Bolt --> Flood["Open-Meteo Flood API"]
  Flood -->|failure| MockFlood["mockFlood.json"]

  Context --> Planner["Planner Orchestrator"]
  MockContext --> Planner
  LocalData --> Planner
  Weather --> Planner
  MockWeather --> Planner
  Flood --> Planner
  MockFlood --> Planner

  Planner --> Fallback["Deterministic Fallback Planner"]
  Planner --> LLM["Optional LLM Adapter"]
  LLM --> Schema["Zod Plan Schema"]
  Fallback --> Schema

  Schema --> Blocks["Block Kit Incident Control Room"]
  Blocks --> Thread["Slack Thread Reply"]
  Thread --> Approve["Approve Plan Button"]
  Approve --> Post["Post to Coordination Button"]
  Post --> Coordination["#coordination final action plan"]
```

## Runtime Flow

1. User mentions the app in Slack.
2. Bolt receives an `app_mention` event through Socket Mode.
3. Handler extracts the zone and `action_token`.
4. RTS client tries `assistant.search.context`.
5. If RTS fails or returns weak results, local `mockContext.json` is used.
6. Local operational data is loaded from JSON.
7. Weather and flood tools fetch live data with short timeouts.
8. Mock weather/flood data replaces failed calls.
9. Planner creates a structured `IncidentPlan`.
10. Zod validates the plan.
11. Block renderer creates a Slack Incident Control Room.
12. User approves the plan.
13. User posts the approved plan to `#coordination`.

## Slack Event Flow

```mermaid
sequenceDiagram
  participant U as User
  participant S as Slack
  participant A as SentinelSwarm
  participant R as RTS API

  U->>S: @SentinelSwarm analyze Zone B risk
  S->>A: app_mention event with action_token when available
  A->>R: assistant.search.context(query, action_token)
  alt RTS succeeds
    R-->>A: messages, files, permalinks
  else RTS unavailable
    A->>A: load mockContext.json
  end
  A->>A: combine context + local resources + risk signals
  A-->>S: Threaded Block Kit Incident Control Room
  U->>S: Click Approve Plan
  S->>A: block_actions approve_plan
  A-->>S: Mark plan approved
  U->>S: Click Post to Coordination
  S->>A: block_actions post_plan
  A-->>S: Post final plan to #coordination
```

## Approval Flow

The planner never posts final assignments directly.

Plan state should include:

- `planId`.
- `status`: `draft`, `approved`, or `posted`.
- `approvedBy`.
- `approvedAt`.
- `threadTs`.
- `coordinationChannelId`.

For the hackathon MVP, state can live in memory. If the process restarts, the user can rerun the analysis.

## Fallback Flow

```mermaid
flowchart TD
  Start["Analyze request"] --> TryRTS["Try RTS"]
  TryRTS -->|ok| Evidence["Use Slack evidence"]
  TryRTS -->|error| MockEvidence["Use mockContext.json"]
  Evidence --> TryWeather["Try weather/flood APIs"]
  MockEvidence --> TryWeather
  TryWeather -->|ok| LiveRisk["Use live risk"]
  TryWeather -->|error| MockRisk["Use mock risk JSON"]
  LiveRisk --> TryLLM["Try LLM planner if configured"]
  MockRisk --> TryLLM
  TryLLM -->|valid schema| Render["Render Block Kit"]
  TryLLM -->|missing/invalid/error| Deterministic["Use fallback planner"]
  Deterministic --> Render
```

## Planned Module Boundaries

- `src/app.ts`: bootstraps Bolt app.
- `src/config.ts`: validates env vars and feature flags.
- `src/slack/handlers.ts`: event and action handlers.
- `src/slack/rts.ts`: Real-Time Search wrapper.
- `src/slack/blocks.ts`: Block Kit rendering.
- `src/slack/postPlan.ts`: final coordination post.
- `src/tools/localData.ts`: JSON loading and validation.
- `src/tools/weather.ts`: Open-Meteo weather client with fallback.
- `src/tools/flood.ts`: Open-Meteo flood client with fallback.
- `src/planner/schema.ts`: Zod schemas.
- `src/planner/severity.ts`: severity scoring.
- `src/planner/fallbackPlanner.ts`: deterministic planner.
- `src/planner/llm.ts`: optional LLM adapter.

## Environment Variables

- `SLACK_BOT_TOKEN`: `xoxb-` bot token.
- `SLACK_APP_TOKEN`: `xapp-` Socket Mode app token.
- `SLACK_SIGNING_SECRET`: optional for future HTTP mode.
- `SLACK_COORDINATION_CHANNEL_ID`: channel ID for final approved posts.
- `OPENAI_API_KEY`: optional; app must run without it.
- `SENTINEL_USE_LLM`: optional feature flag.
- `SENTINEL_FORCE_MOCKS`: force deterministic demo mode.
- `LOG_LEVEL`: app logging level.
