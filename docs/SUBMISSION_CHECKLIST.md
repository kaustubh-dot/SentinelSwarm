# Submission Checklist

## Deadline

- Final deadline: July 13, 2026 at 5:00pm PDT.
- India time: July 14, 2026 at 5:30am IST.
- Freeze risky feature work at least 24 hours before the deadline.

## Required Assets

- [ ] Devpost text completed from `docs/DEVPOST_SUBMISSION_DRAFT.md`.
- [ ] Demo video recorded and under 3 minutes.
- [ ] Architecture diagram attached or screenshotted from `docs/ARCHITECTURE_DIAGRAM.md`.
- [ ] GitHub repo is public or accessible if required by the hackathon.
- [ ] Slack developer sandbox URL is available.
- [ ] Required judge access granted by the primary teammate.
- [ ] Slack App ID recorded by the primary teammate.
- [ ] Screenshots captured for Devpost.
- [ ] No secrets committed.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.

## Devpost Fields

- [ ] Project name: SentinelSwarm.
- [ ] Track: Slack Agent for Good.
- [ ] Short tagline: Slack-native crisis coordination for floods and local disaster response.
- [ ] One-line summary: SentinelSwarm turns scattered flood-response updates into an evidence-linked, human-approved action plan.
- [ ] Feature description includes:
  - [ ] Real-Time Search context retrieval or clearly labeled fallback evidence.
  - [ ] Evidence-linked Incident Control Room.
  - [ ] Evidence Ledger with Slack source snippets.
  - [ ] Weather/flood risk signal.
  - [ ] Severity ranking.
  - [ ] Volunteer, supply, shelter, and route matching.
  - [ ] Human approval before posting the plan.
  - [ ] Final post to `#coordination`.
- [ ] Social impact explanation includes:
  - [ ] Disaster-response coordination.
  - [ ] Nonprofit, campus, and mutual-aid use cases.
  - [ ] Decision support, not emergency authority.
  - [ ] Faster handoffs and reduced duplicated work.
- [ ] Technical architecture is concise and non-engineer readable.
- [ ] Roadblock-safe fallback story is included.
- [ ] Limitations and future work are honest.
- [ ] Demo video link added.
- [ ] Architecture diagram added.
- [ ] Slack developer sandbox URL added.
- [ ] Testing instructions added.

## Demo Video Checklist

- [ ] Length is 2:45 to 3:00.
- [ ] Video shows the working Slack project, not only slides.
- [ ] No secrets, tokens, private data, copyrighted music, or real personal information are visible.
- [ ] Seeded channel context is visible briefly.
- [ ] Primary Zone A trigger is shown:

```txt
@SentinelSwarm analyze Zone A risk: heavy rain near Zone A, water rising, 25 people need evacuation, route bridge blocked
```

- [ ] Backup Zone B trigger is ready if needed:

```txt
@SentinelSwarm analyze Zone B risk
```

- [ ] Incident Control Room card is shown.
- [ ] Evidence Ledger is shown.
- [ ] Source/status indicators are shown.
- [ ] Route conflict is shown.
- [ ] Shelter, supply, and volunteer matches are shown.
- [ ] Human approval message is shown.
- [ ] Approve Plan is clicked.
- [ ] Post to Coordination is clicked.
- [ ] Final `#coordination` post is shown.
- [ ] Close includes: Slack-native, evidence-linked, human-approved, fallback-safe.

## Architecture Diagram Checklist

- [ ] Shows Slack demo channels.
- [ ] Shows Bolt + Socket Mode app.
- [ ] Shows Real-Time Search API or fallback evidence.
- [ ] Shows local fallback context.
- [ ] Shows local routes, shelters, supplies, and volunteers.
- [ ] Shows weather/flood adapters with mock fallbacks.
- [ ] Shows deterministic planner.
- [ ] Shows Zod validation.
- [ ] Shows Block Kit Incident Control Room.
- [ ] Shows human approval and final coordination post.
- [ ] Mentions MCP only as future work unless implemented.
- [ ] Does not include secrets or token values.

## Slack Sandbox Access Checklist

Primary teammate owns this section.

- [ ] Join Slack Developer Program and create or access sandbox.
- [ ] Create Slack app in sandbox.
- [ ] Enable Socket Mode.
- [ ] Generate app-level token with `connections:write`.
- [ ] Enable Events API.
- [ ] Subscribe to `app_mention`.
- [ ] Enable interactivity.
- [ ] Install app to workspace.
- [ ] Invite app to demo channels.
- [ ] Create or verify channels:
  - [ ] `#field-reports`
  - [ ] `#volunteers`
  - [ ] `#supplies`
  - [ ] `#routes`
  - [ ] `#shelters`
  - [ ] `#alerts`
  - [ ] `#coordination`
- [ ] Invite judges before submission:
  - [ ] `slackhack@salesforce.com`
  - [ ] `testing@devpost.com`
- [ ] Confirm both judge accounts can access the workspace and relevant channels.
- [ ] Record Slack App ID for submission notes.

## Environment Variable Checklist

Required locally:

- [ ] `SLACK_BOT_TOKEN`
- [ ] `SLACK_APP_TOKEN`
- [ ] `SLACK_COORDINATION_CHANNEL_ID`

Optional:

- [ ] `SLACK_SIGNING_SECRET`
- [ ] `OPENAI_API_KEY`
- [ ] `SENTINEL_USE_LLM`
- [ ] `SENTINEL_FORCE_MOCKS`
- [ ] `LOG_LEVEL`

Safety:

- [ ] Never commit real `.env` values.
- [ ] Never show tokens in the demo video.
- [ ] Confirm `.env` and `.env.backup.local` do not appear in `git status --short`.

## Final Smoke Test

Run these before recording and before submission:

- [ ] `npm test`
- [ ] `npm run build`
- [ ] Start app in Socket Mode.
- [ ] In Slack, run `@SentinelSwarm ping`.
- [ ] In Slack, run the Zone A primary trigger.
- [ ] Confirm the card appears in thread.
- [ ] Confirm status indicators are truthful.
- [ ] Confirm Evidence Ledger is readable.
- [ ] Click Approve Plan.
- [ ] Click Post to Coordination.
- [ ] Confirm `#coordination` receives final plan.
- [ ] Run the Zone B backup trigger once.
- [ ] Force mock mode and repeat once.
- [ ] Temporarily disable LLM and repeat once if LLM support is configured.
- [ ] Confirm no token or secret appears in logs or video.
- [ ] Confirm the project still makes sense if MCP is not used.

## Secret Scan

Run before final handoff:

```bash
git status --short
git grep -n "xoxb-" -- .
git grep -n "xapp-" -- .
git grep -n "OPENAI_API_KEY=" -- .
```

Acceptable matches are placeholders or explanatory docs only, never real values.

## Submission Freeze Rules

- [ ] After the vertical slice works, only fix bugs and polish copy/UI.
- [ ] Do not add new external APIs.
- [ ] Do not change Slack scopes unless setup is already verified.
- [ ] Do not refactor working approval flow late.
- [ ] If live Real-Time Search is unstable, keep it implemented but record the deterministic fallback flow with visible fallback status.

## Final Handoff

Send the primary teammate:

- [ ] Completed docs list.
- [ ] Verification results for `npm test`.
- [ ] Verification results for `npm run build`.
- [ ] Secret scan results.
- [ ] Live Slack items they still need to verify.
- [ ] Claims that should stay marked as future work.
