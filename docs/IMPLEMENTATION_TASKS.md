# Implementation Tasks

## Phase 0: Planning Baseline

Status: complete when these docs exist and are committed.

- Create `AGENTS.md`.
- Create planning docs under `docs/`.
- Lock MVP flow and non-goals.
- Confirm the deadline and submission artifacts.

Acceptance criteria:

- Later Codex work can start from this repo without re-reading the brainstorm.
- Highest roadblocks are captured in `docs/TECH_RISK_REGISTER.md`.

## Phase 1: App Skeleton

- Create `package.json`, `tsconfig.json`, `.gitignore`, `.env.example`, and `README.md`.
- Install runtime dependencies: `@slack/bolt`, `@slack/web-api`, `zod`, `dotenv`.
- Install dev dependencies: `typescript`, `tsx`, `vitest`, `@types/node`.
- Add `src/app.ts` and `src/config.ts`.
- Validate env vars at startup.
- Add `npm run dev`, `npm run build`, `npm test`, and `npm run typecheck`.
- Add `manifest.yaml` draft early.
- Add `docs/SLACK_SETUP.md` early.

Acceptance criteria:

- `npm run build` works.
- App starts in Socket Mode when Slack env vars exist.
- Missing env vars produce readable errors.
- Slack setup docs list exact manual steps before implementation gets deep.

## Phase 1A: Slack Setup Spike

- Create the Slack sandbox app manually.
- Enable Socket Mode.
- Subscribe to `app_mention`.
- Enable interactivity.
- Install app to the sandbox.
- Invite app to demo channels.
- Verify `@SentinelSwarm ping` can be received before building advanced features.
- Capture whether `app_mention` events include `action_token`.

Acceptance criteria:

- Slack app can receive at least one mention event.
- Button interactivity endpoint/socket handling is configured.
- Any RTS/action-token gap is known early, not discovered during final polish.

## Phase 2: Seeded Data And Fallback Planner

- Add `src/data/zones.json`.
- Add `src/data/volunteers.json`.
- Add `src/data/supplies.json`.
- Add `src/data/routes.json`.
- Add `src/data/shelters.json`.
- Add `src/data/mockContext.json`.
- Add `src/data/mockWeather.json`.
- Add `src/data/mockFlood.json`.
- Add `src/tools/localData.ts`.
- Add `src/planner/schema.ts`.
- Add `src/planner/severity.ts`.
- Add `src/planner/fallbackPlanner.ts`.

Acceptance criteria:

- A local function can generate a complete Zone B plan with no Slack, no network, and no LLM.
- Tests cover severity and fallback planner shape.

## Phase 3: Slack Mention Flow

- Add `src/slack/handlers.ts`.
- Respond to `@SentinelSwarm ping`.
- Respond to `@SentinelSwarm analyze Zone B risk`.
- Parse zone names conservatively.
- Reply in the originating thread.

Acceptance criteria:

- Mentioning the bot in Slack produces a response.
- Analyze command returns a plan using local fallback data.

## Phase 4: Block Kit UI

- Add `src/slack/blocks.ts`.
- Render Incident Control Room sections:
  - Header.
  - Risk summary.
  - Status indicators.
  - Evidence Ledger with source snippets and permalinks when available.
  - Priority incidents.
  - Route conflicts.
  - Volunteer/supply/shelter matches.
  - Recommended action plan.
  - Human-approval disclaimer.
  - Approve/Post/Handover actions.

Acceptance criteria:

- Slack accepts the generated blocks.
- Card is readable in a thread and not too long.
- Tests assert block shape and key text.
- Card visibly answers: what happened, why we believe it, what to do, and who must approve.

## Phase 5: Approval And Posting

- Add `approve_plan` action handler.
- Add `post_plan` action handler.
- Add `src/slack/postPlan.ts`.
- Track plan state in memory by `planId`.
- Require approval before final posting.
- Post final plan to `SLACK_COORDINATION_CHANNEL_ID`.

Acceptance criteria:

- Approve button updates the thread.
- Post button posts to `#coordination`.
- Posting without approval is blocked.

## Phase 6: Real-Time Search Integration

- Add `src/slack/rts.ts`.
- Extract `action_token` from app mention payload when available.
- Call `assistant.search.context`.
- Query with zone-specific terms and public channel types first.
- Include source permalinks when available.
- Show "RTS used" or "RTS fallback" in the card.

Acceptance criteria:

- RTS attempt does not crash the app.
- Missing token, missing scope, and API errors fall back to `mockContext.json`.
- Live RTS success produces evidence entries.

## Phase 7: Weather And Flood Tools

- Add `src/tools/weather.ts`.
- Add `src/tools/flood.ts`.
- Use zone coordinates from local data.
- Fetch Open-Meteo forecast and flood signals with short timeouts.
- Validate responses and fallback to mock JSON.

Acceptance criteria:

- Live fetch works when network is available.
- Mock mode works without network.
- Card displays live/mock status.

## Phase 8: Judge-Ready Polish

- Improve README pitch and setup.
- Update `docs/DEMO_SCRIPT.md`.
- Export architecture diagram.
- Add screenshot placeholders.
- Run final smoke test.
- Record demo video.
- Invite judges.

Acceptance criteria:

- The non-negotiable flow works:

```txt
@SentinelSwarm analyze Zone B risk
-> Incident Control Room appears
-> Evidence Ledger is visible
-> Approve Plan button works
-> Post to Coordination button works
-> #coordination receives a clean final response plan
```

## Phase 9: Optional LLM Adapter

- Add `src/planner/llm.ts`.
- Add `src/planner/prompt.ts`.
- Make LLM opt-in through `SENTINEL_USE_LLM=true`.
- Support Gemini configuration through `GOOGLE_API_KEY` and `GEMINI_MODEL`.
- Validate LLM output with Zod.
- Retry once for schema repair.
- Fall back to deterministic planner.
- Keep the live Slack demo instructions centered on `SENTINEL_FORCE_MOCKS=false` and `@SentinelSwarm analyze Zone B risk`; the LLM is refinement only.

Acceptance criteria:

- App works without `GOOGLE_API_KEY`.
- App works when `SENTINEL_USE_LLM=false`, even if all Gemini variables are empty.
- API failures, timeouts, and provider errors cannot block the demo.
- Invalid LLM output cannot break the demo.
- Invalid LLM JSON triggers one schema-repair retry, then falls back to deterministic planning.
- Card displays "LLM-refined planner" or "deterministic planner".

## Phase 10: Optional MCP Server

- Add only if the app is already demo-stable.
- Do not connect Slack as MCP in the first version.
- If used, expose a tiny crisis-resource MCP server wrapping local demo data and weather/flood tools.
- Possible tools:
  - `get_zone_resource_status`
  - `get_shelter_capacity`
  - `get_supply_inventory`
  - `get_weather_risk_snapshot`

Acceptance criteria:

- MCP is a bonus story, not required for the main demo.
- Removing MCP does not break the Slack demo.

## Phase 11: Optional Post-Submission Cleanup

- Clean docs.
- Add screenshots.
- Add deployment notes.
- Prepare a short architecture walkthrough.
