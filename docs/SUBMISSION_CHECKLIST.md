# Submission Checklist

## Deadline

- Final deadline: July 13, 2026 at 5:00pm PDT.
- India time: July 14, 2026 at 5:30am IST.
- Freeze risky feature work at least 24 hours before the deadline.

## Devpost Fields

- Draft source: `docs/DEVPOST_SUBMISSION_DRAFT.md`.
- Project name: SentinelSwarm.
- Track: Slack Agent for Good.
- Short tagline: Slack-native crisis coordination for floods, landslides, and local disaster response.
- Feature description includes:
  - Real-Time Search integration with visible status, plus labeled Slack/mock fallback when RTS is unavailable.
  - Evidence-linked Incident Control Room.
  - Evidence Ledger with Slack source snippets.
  - Weather/flood risk signal.
  - Severity ranking.
  - Volunteer/supply/shelter/route matching.
  - Refresh Analysis that reruns the plan after Slack context changes.
  - Human approval before dispatch.
  - Final post to `#coordination`.
- Social impact explanation includes:
  - Disaster-response coordination.
  - Nonprofit, campus, and mutual-aid use cases.
  - Decision support, not emergency authority.
  - Faster handoffs and reduced duplicated work.
- Demo video link.
- Architecture diagram.
- Screenshot or GIF of the Incident Control Room, if available after recording.
- Slack developer sandbox URL.
- Testing instructions.

## Demo Video Checklist

- Storyboard source: `docs/DEMO_VIDEO_STORYBOARD.md`.
- Seed message source: `docs/DEMO_SEED_MESSAGES.md`.
- Optional seed command: `npm.cmd run seed:slack -- --post`.
- Length is under 3 minutes.
- Video shows the working Slack project, not only slides.
- No secrets, tokens, private data, copyrighted music, or real personal information are visible.
- Show seeded channel chaos briefly.
- Show the exact app mention:

```txt
@SentinelSwarm analyze Zone B risk
```

- Show Incident Control Room card.
- Show Evidence Ledger.
- Show source/status indicators.
- Show Refresh Analysis after a route update if it fits the 3-minute edit.
- Click Approve Plan.
- Click Post to Coordination.
- Show final `#coordination` post.
- End with impact sentence.

## Architecture Diagram Checklist

- Shows Slack Events API / Socket Mode.
- Shows Real-Time Search API.
- Shows local fallback context.
- Shows Open-Meteo weather/flood tools and mock fallbacks.
- Shows deterministic planner; include optional LLM adapter only if implemented.
- Shows Zod validation.
- Shows Block Kit UI.
- Shows human approval and final coordination post.
- Shows MCP only if it is implemented as an optional external-resource layer.

## Slack Sandbox Access Checklist

- Join Slack Developer Program and create/access sandbox.
- Create Slack app in sandbox.
- Enable Socket Mode.
- Generate app-level token with `connections:write`.
- Enable Events API.
- Subscribe to `app_mention`.
- Enable interactivity.
- Install app to workspace.
- Invite app to demo channels.
- Create or verify channels:
  - `#field-reports`
  - `#volunteers`
  - `#supplies`
  - `#routes`
  - `#shelters`
  - `#alerts`
  - `#coordination`
- Invite judges before submission:
  - `slackhack@salesforce.com`
  - `testing@devpost.com`
- Confirm both judge accounts can access the workspace and relevant channels.

## Environment Variable Checklist

Required:

- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_COORDINATION_CHANNEL_ID`

Optional:

- `SLACK_SIGNING_SECRET`
- `SENTINEL_FORCE_MOCKS`
- `LOG_LEVEL`

Only if an LLM adapter is implemented:

- `GOOGLE_API_KEY`
- `GEMINI_MODEL`
- `SENTINEL_USE_LLM`

Never commit real `.env` values.

## Final Smoke Test

Run these before recording and before submission:

- Record latest evidence in `docs/DEMO_PROOF.md`.
- `npm run build`
- `npm test`
- `npm run check:secrets`
- Start app in Socket Mode.
- Seed Slack with `npm.cmd run seed:slack -- --post` or manually paste `docs/DEMO_SEED_MESSAGES.md`.
- In Slack, run `@SentinelSwarm ping`.
- In Slack, run `@SentinelSwarm analyze Zone B risk`.
- Confirm the card appears in thread.
- Confirm status indicators are truthful.
- Add the alternate route update and click Refresh Analysis.
- Confirm the refreshed card returns to awaiting approval.
- Click Approve Plan.
- Click Post to Coordination.
- Confirm `#coordination` receives final plan.
- Force mock mode and repeat once.
- Confirm the card labels mock context/weather/flood when mock mode is forced.
- Confirm the card shows `Deterministic planner` when `SENTINEL_USE_LLM=false`.
- Confirm no token or secret appears in logs or video.
- Confirm the project still makes sense if MCP is not used.

## Submission Freeze Rules

- After the vertical slice works, only fix bugs and polish copy/UI.
- Do not add new external APIs.
- Do not change Slack scopes unless setup is already verified.
- Do not refactor working approval flow late.
- If live RTS is unstable, keep it implemented but record the deterministic fallback flow with visible fallback badge.
