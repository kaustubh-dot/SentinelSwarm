# SentinelSwarm Agent Instructions

## Project

SentinelSwarm is a Slack Agent for Good for monsoon flood, landslide, and crisis-response coordination.

It converts chaotic Slack field reports into verified, prioritized, human-approved action plans.

The app must feel Slack-native, not like a generic chatbot.

## Winning Principle

Build a reliable, polished 3-minute demo.

The demo story is intentionally narrow: monsoon flood response in Zone B for a campus, NGO, or volunteer response team.

The core experience must show:

1. Slack workspace chaos.
2. Real-Time Search context retrieval.
3. External weather or flood risk signal.
4. Incident extraction.
5. Severity ranking.
6. Volunteer, supply, shelter, and route matching.
7. Evidence Ledger with source snippets and Slack links when available.
8. Block Kit Incident Control Room.
9. Human approval.
10. Final post to `#coordination`.

## Stack

Use:

- Node.js.
- TypeScript with strict mode.
- Slack Bolt for JavaScript.
- Socket Mode for local demo reliability.
- Slack Web API.
- Zod for schemas.
- Local JSON data.
- Open-Meteo weather and flood APIs where available.
- OpenAI-compatible LLM adapter with deterministic mock fallback.

## Required Fallback Rule

Every external dependency must have a deterministic fallback.

Required fallbacks:

- RTS failure -> `src/data/mockContext.json`.
- Weather API failure -> `src/data/mockWeather.json`.
- Flood API failure -> `src/data/mockFlood.json`.
- LLM failure -> deterministic fallback planner.
- Missing Slack channel ID -> readable Slack error with setup hint.
- Invalid LLM JSON -> schema retry once, then fallback planner.

The demo must still work if RTS, weather, flood, and LLM calls all fail.

## Slack RTS Rule

Use the Real-Time Search API as the primary hackathon technology.

Use `assistant.search.context`.

Bot-token Real-Time Search calls require an `action_token`, so the safest demo trigger is `app_mention`:

```txt
@SentinelSwarm analyze Zone B risk
```

Do not rely on autonomous background RTS calls for the main demo.

## Human Approval Rule

Never post final assignments automatically.

The app may analyze and recommend, but it must require explicit button approval before posting to `#coordination`.

## UX Rules

Use Block Kit as the main UI.

The Incident Control Room card should include:

- Title.
- Risk summary.
- Source and evidence section.
- Evidence Ledger with 2-4 cited report snippets.
- Priority incidents.
- Route conflicts.
- Volunteer matches.
- Supply actions.
- Final recommended plan.
- Confidence level.
- Status indicators for RTS, weather, flood, and planner mode.
- Approval buttons.
- Disclaimer that this is decision support, not emergency authority.

Use buttons:

- `approve_plan`.
- `post_plan`.
- `generate_handover`.

Keep Slack messages concise, readable, and demo-friendly.

## Do Not Use

Do not use:

- Twitter/X API.
- Google Maps API.
- WhatsApp API.
- Paid-only APIs.
- Complex database.
- Production Slack Marketplace submission.
- Canvas-first UI.
- Fully autonomous dispatch.
- Private or sensitive user profiling.
- Sentiment surveillance as a core feature.
- MCP as a dependency for the first working demo.

MCP may be added only after the Slack mention, Incident Control Room, approval, posting, RTS attempt, and fallback paths already work.

## Repo Structure

Recommended structure:

```txt
src/
  app.ts
  config.ts

  slack/
    handlers.ts
    blocks.ts
    rts.ts
    postPlan.ts

  tools/
    weather.ts
    flood.ts
    localData.ts

  planner/
    schema.ts
    prompt.ts
    llm.ts
    planner.ts
    severity.ts
    fallbackPlanner.ts

  data/
    volunteers.json
    supplies.json
    routes.json
    shelters.json
    zones.json
    mockContext.json
    mockWeather.json
    mockFlood.json

tests/
  planner.test.ts
  severity.test.ts
  localData.test.ts

docs/
  PROJECT_PLAN.md
  REQUIREMENTS_TRACEABILITY.md
  TECH_RISK_REGISTER.md
  ARCHITECTURE.md
  IMPLEMENTATION_TASKS.md
  SUBMISSION_CHECKLIST.md
  DEMO_SCRIPT.md
  DEMO_SEED_MESSAGES.md
  DEMO_VIDEO_STORYBOARD.md
  DEVPOST_SUBMISSION_DRAFT.md
  JUDGE_QA.md
```

## Engineering Standards

- Validate environment variables at startup.
- Validate all LLM output with Zod.
- Do not let malformed API or JSON data crash the app.
- Keep network code isolated under `src/tools/` and `src/slack/`.
- Keep planning and scoring code isolated under `src/planner/`.
- Prefer small pure functions for severity scoring, incident normalization, volunteer matching, route conflict detection, and Block Kit rendering.
- Do not add risky APIs after the vertical slice works.

## Testing

At minimum, add tests for:

- Severity scoring.
- Local data loading.
- Fallback planner.
- LLM schema validation.
- Block Kit generation shape.

A feature is not done unless:

- TypeScript builds.
- Tests pass.
- App can run locally.
- Fallback path works.
- Slack demo path is documented.

## Demo-First Definition Of Done

The project is done when this exact flow works:

1. User types `@SentinelSwarm analyze Zone B risk`.
2. Bot replies with an Incident Control Room card.
3. Card shows weather/flood risk, field report evidence, shelter needs, route conflict, volunteer/supply match, and recommended action plan.
4. User clicks Approve Plan.
5. User clicks Post to Coordination.
6. Bot posts a clean final action plan to `#coordination`.
7. README explains setup.
8. Devpost submission assets are ready.
