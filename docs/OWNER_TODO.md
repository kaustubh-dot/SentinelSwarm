# Owner TODO

Use this as the live owner checklist. It intentionally includes work that is not done yet.

## Local Verification

- [x] `npm.cmd run typecheck` passes.
- [x] `npm.cmd test` passes.
- [x] `npm.cmd run build` passes.
- [x] `npm.cmd run check:secrets` passes.
- [x] `npm.cmd run smoke:slack` passes with live Slack credentials.
- [ ] Optional write smoke test posts a harmless message to `#coordination`.
- [x] `npm.cmd run seed:slack` previews the seed plan.
- [x] `npm.cmd run seed:slack -- --post` posts fictional demo messages when ready.

## Slack Setup

- [x] Slack app is installed in the sandbox workspace.
- [x] Socket Mode is enabled.
- [x] Interactivity is enabled.
- [x] `app_mention` event subscription is installed.
- [x] Bot is invited to `#field-reports`.
- [x] Bot is invited to `#alerts`.
- [x] Bot is invited to `#routes`.
- [x] Bot is invited to `#shelters`.
- [x] Bot is invited to `#supplies`.
- [x] Bot is invited to `#volunteers`.
- [x] Bot is invited to `#coordination`.
- [x] `.env` has `SLACK_BOT_TOKEN`.
- [x] `.env` has `SLACK_APP_TOKEN`.
- [x] `.env` has `SLACK_COORDINATION_CHANNEL_ID`.
- [x] `.env` sets `SENTINEL_FORCE_MOCKS=false` for the live recording.
- [x] `.env` keeps `SENTINEL_USE_LLM=false` for the primary recording.

## Live Demo Validation

- [x] `@SentinelSwarm ping` replies.
- [x] `@SentinelSwarm analyze Zone B risk` opens the Incident Control Room.
- [x] Status line truthfully shows RTS, Slack scan, or mock context.
- [x] Evidence Ledger shows 2-4 useful snippets.
- [x] Weather and flood signals show live or mock status.
- [x] Route guidance identifies blocked/caution/open routes.
- [x] Volunteer, shelter, and supply matches are present.
- [x] Approve Plan updates the card state.
- [x] Post to Coordination is hidden before approval, and stale/direct clicks before approval are refused.
- [x] Post to Coordination succeeds after approval.
- [ ] Missing or wrong coordination channel produces a readable setup hint.
- [x] Generate Handover posts a concise thread reply.

## Recording Checklist

- [x] Use fictional seed messages only.
- [x] Seed messages are posted by script or checked manually against `docs/DEMO_SEED_MESSAGES.md`.
- [ ] Hide tokens, browser notifications, private channels, and real user data.
- [ ] Video is under 3 minutes.
- [x] Show workspace chaos before the trigger.
- [x] Show the exact app mention.
- [x] Show the Incident Control Room.
- [x] Show approval before posting.
- [x] Show final `#coordination` post.
- [ ] End with the human-safety boundary: decision support, not emergency authority.

## Submission Checklist

- [x] README is current.
- [x] Devpost draft is current.
- [x] Architecture diagram is included.
- [x] Judge Q&A is included.
- [ ] Demo video link is ready.
- [x] Repository has no committed secrets.
- [x] Final `git status --short` is reviewed before commit.
