# Devpost Submission Draft

## Project Name

SentinelSwarm

## Tagline

Slack-native crisis coordination for monsoon flood response.

## What It Does

SentinelSwarm turns chaotic Slack field reports into a verified, prioritized, human-approved action plan. In the demo, a coordinator asks:

```txt
@SentinelSwarm analyze Zone B risk
```

The app gathers Slack context with Real-Time Search when available, combines it with weather/flood signals and local resource data, then renders a Block Kit Incident Control Room. The card shows evidence snippets, severity, route conflicts, shelter needs, supply actions, volunteer matches, confidence, refresh status, and source status indicators. A human must approve before the final plan can be posted to `#coordination`.

## Inspiration

During floods and landslides, response teams often already have the facts they need, but those facts are scattered across Slack channels. SentinelSwarm helps coordinators find the operational picture quickly without turning the system into an autonomous dispatcher.

## How We Built It

- Node.js and TypeScript in strict mode.
- Slack Bolt for JavaScript with Socket Mode.
- Slack Web API and `assistant.search.context` for Real-Time Search.
- Block Kit for the Incident Control Room.
- Zod schemas for local data, planner output, and LLM validation.
- Local JSON fixtures for volunteers, supplies, shelters, routes, zones, and fallback context.
- Open-Meteo weather/flood adapters where available.
- Optional Gemini-compatible LLM refinement with deterministic fallback.

## Demo Flow

1. Seed Slack channels with fictional Zone B reports.
2. Trigger `@SentinelSwarm analyze Zone B risk`.
3. Review the Incident Control Room.
4. Optionally add a new route update and click `Refresh Analysis` to prove the plan responds to live Slack changes.
5. Click `Approve Plan`.
6. Click `Post to Coordination`.
7. Confirm the final plan appears in `#coordination`.

## Slack Technologies Used

- App mentions as the reliable user trigger.
- Real-Time Search API through `assistant.search.context`.
- Block Kit for the main interface.
- Button interactivity for refresh, approval, posting, and handover.
- Socket Mode for reliable local demo execution. No public inbound webhook or public backend URL is required; the Node.js app connects outbound to Slack.

## Fallback-Safe Design

The demo works even if services fail:

- RTS failure falls back to `mockContext.json`, then optionally enriches with live Slack channel scan when available.
- Weather failure falls back to `mockWeather.json`.
- Flood failure falls back to `mockFlood.json`.
- LLM failure or invalid JSON falls back to deterministic planning.
- Missing coordination channel ID produces a readable Slack setup hint instead of crashing.

## Human Safety Boundary

SentinelSwarm is decision support, not emergency authority. It does not autonomously dispatch volunteers or post final assignments. Approval and posting are separate human actions.

## Challenges

The hardest part was keeping the demo Slack-native and reliable while still showing real retrieval and external signals. We chose a narrow Zone B flood-response story, strong local fallbacks, and visible source status indicators so judges can see what is live, mocked, or deterministic.

## Accomplishments

- End-to-end Slack mention to Incident Control Room.
- Evidence Ledger with Slack snippets and links when available.
- Refresh Analysis button that reruns the plan against latest Slack context.
- Weather/flood risk integration with local fallbacks.
- Route, shelter, supply, and volunteer matching.
- Human approval before final coordination post.
- Tests for planner behavior, parsing, local data, RTS fallback, Block Kit shape, plan store, and posting.

## What Is Next

- Expand from one demo zone into a multi-zone operations view.
- Add richer handover export for shift changes.
- Add optional MCP resources only after the core Slack path remains stable.
- Improve calibration of flood-risk signals for real deployments.
- Add admin controls for local resource fixture updates.
