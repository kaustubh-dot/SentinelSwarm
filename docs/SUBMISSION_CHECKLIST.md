# Submission Checklist

## Deadline

- Final deadline: July 13, 2026 at 5:00pm PDT.
- India time: July 14, 2026 at 5:30am IST.
- Freeze risky feature work at least 24 hours before the deadline.

## Devpost Fields

- Project name: SentinelSwarm.
- Track: Slack Agent for Good.
- Short tagline: Slack-native crisis coordination for floods, landslides, and local disaster response.
- Feature description includes:
  - Real-Time Search context retrieval.
  - Evidence-linked Incident Control Room.
  - Evidence Ledger with Slack source snippets.
  - Weather/flood risk signal.
  - Severity ranking.
  - Volunteer/supply/shelter/route matching.
  - Human approval before dispatch.
  - Final post to `#coordination`.
- Social impact explanation includes:
  - Disaster-response coordination.
  - Nonprofit, campus, and mutual-aid use cases.
  - Decision support, not emergency authority.
  - Faster handoffs and reduced duplicated work.
- Demo video link.
- Architecture diagram.
- Slack developer sandbox URL.
- Testing instructions.

## Demo Video Checklist

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
- Click Approve Plan.
- Click Post to Coordination.
- Show final `#coordination` post.
- End with impact sentence.

## Architecture Diagram Checklist

- Shows Slack Events API / Socket Mode.
- Shows Real-Time Search API.
- Shows local fallback context.
- Shows Open-Meteo weather/flood tools and mock fallbacks.
- Shows deterministic planner and optional LLM adapter.
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
- `OPENAI_API_KEY`
- `SENTINEL_USE_LLM`
- `SENTINEL_FORCE_MOCKS`
- `LOG_LEVEL`

Never commit real `.env` values.

## Final Smoke Test

Run these before recording and before submission:

- `npm run build`
- `npm test`
- Start app in Socket Mode.
- In Slack, run `@SentinelSwarm ping`.
- In Slack, run `@SentinelSwarm analyze Zone B risk`.
- Confirm the card appears in thread.
- Confirm status indicators are truthful.
- Click Approve Plan.
- Click Post to Coordination.
- Confirm `#coordination` receives final plan.
- Force mock mode and repeat once.
- Temporarily disable LLM and repeat once.
- Confirm no token or secret appears in logs or video.
- Confirm the project still makes sense if MCP is not used.

## Submission Freeze Rules

- After the vertical slice works, only fix bugs and polish copy/UI.
- Do not add new external APIs.
- Do not change Slack scopes unless setup is already verified.
- Do not refactor working approval flow late.
- If live RTS is unstable, keep it implemented but record the deterministic fallback flow with visible fallback badge.
