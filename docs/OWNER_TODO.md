# Owner TODO

Use this as the live owner checklist. It intentionally includes work that is not done yet.

## Local Verification

- [x] `npm.cmd run typecheck` passes.
- [x] `npm.cmd test` passes.
- [x] `npm.cmd run build` passes.
- [ ] `npm.cmd run smoke:slack` passes with live Slack credentials.
- [ ] Optional write smoke test posts a harmless message to `#coordination`.
- [ ] `npm.cmd run seed:slack` previews the seed plan.
- [ ] `npm.cmd run seed:slack -- --post` posts fictional demo messages when ready.

## Slack Setup

- [ ] Slack app is installed in the sandbox workspace.
- [ ] Socket Mode is enabled.
- [ ] Interactivity is enabled.
- [ ] `app_mention` event subscription is installed.
- [ ] Bot is invited to `#field-reports`.
- [ ] Bot is invited to `#alerts`.
- [ ] Bot is invited to `#routes`.
- [ ] Bot is invited to `#shelters`.
- [ ] Bot is invited to `#supplies`.
- [ ] Bot is invited to `#volunteers`.
- [ ] Bot is invited to `#coordination`.
- [ ] `.env` has `SLACK_BOT_TOKEN`.
- [ ] `.env` has `SLACK_APP_TOKEN`.
- [ ] `.env` has `SLACK_COORDINATION_CHANNEL_ID`.
- [ ] `.env` keeps `SENTINEL_USE_LLM=false` for the primary recording.

## Live Demo Validation

- [ ] `@SentinelSwarm ping` replies.
- [ ] `@SentinelSwarm analyze Zone B risk` opens the Incident Control Room.
- [ ] Status line truthfully shows RTS, Slack scan, or mock context.
- [ ] Evidence Ledger shows 2-4 useful snippets.
- [ ] Weather and flood signals show live or mock status.
- [ ] Route guidance identifies blocked/caution/open routes.
- [ ] Volunteer, shelter, and supply matches are present.
- [ ] Approve Plan updates the card state.
- [ ] Post to Coordination refuses to post before approval.
- [ ] Post to Coordination succeeds after approval.
- [ ] Missing or wrong coordination channel produces a readable setup hint.
- [ ] Generate Handover posts a concise thread reply.

## Recording Checklist

- [ ] Use fictional seed messages only.
- [ ] Seed messages are posted by script or checked manually against `docs/DEMO_SEED_MESSAGES.md`.
- [ ] Hide tokens, browser notifications, private channels, and real user data.
- [ ] Video is under 3 minutes.
- [ ] Show workspace chaos before the trigger.
- [ ] Show the exact app mention.
- [ ] Show the Incident Control Room.
- [ ] Show approval before posting.
- [ ] Show final `#coordination` post.
- [ ] End with the human-safety boundary: decision support, not emergency authority.

## Submission Checklist

- [ ] README is current.
- [ ] Devpost draft is current.
- [ ] Architecture diagram is included.
- [ ] Judge Q&A is included.
- [ ] Demo video link is ready.
- [ ] Repository has no committed secrets.
- [ ] Final `git status --short` is reviewed before commit.
