# Owner TODO: Live SentinelSwarm

This checklist tracks the live Slack product path. Target the primary recording with live Slack evidence when stable; if RTS or Slack retrieval is unavailable, record the deterministic fallback flow only with visible source/status labels.

## Live Product Goal

- [ ] Primary demo attempts Slack Real-Time Search first.
- [ ] Live Slack channel scan is the labeled fallback when RTS is unavailable.
- [ ] Mock mode exists only as fallback.
- [ ] Incident Control Room changes when Slack channel evidence changes.
- [ ] Full flow works: `#field-reports` -> bot plan -> approval -> `#coordination`.

## Slack Live Setup

- [ ] Bot installed in workspace.
- [ ] Bot invited to `#field-reports`.
- [ ] Bot invited to `#coordination`.
- [ ] Bot invited to `#alerts`.
- [ ] Bot invited to `#routes`.
- [ ] Bot invited to `#shelters`.
- [ ] Bot invited to `#supplies`.
- [ ] Bot invited to `#volunteers`.
- [ ] Interactivity enabled.
- [ ] Socket Mode enabled.
- [ ] Required scopes installed or reinstalled.
- [ ] `.env` has bot token, app token, and coordination channel ID.

## Local Verification

- [ ] `npm.cmd test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run dev` starts.
- [ ] `@SentinelSwarm ping` replies.
- [ ] Analyze command works.
- [ ] Natural incident report works.
- [ ] Approve Plan works.
- [ ] Post to Coordination works.
- [ ] Generate Handover works.

## Live Evidence Proof

- [ ] With `SENTINEL_FORCE_MOCKS=false`, bot attempts Real-Time Search.
- [ ] Required demo uses `SENTINEL_USE_LLM=false` unless deliberately recording the optional refinement path.
- [ ] If RTS is unavailable, bot uses live Slack channel scan.
- [ ] Card labels the actual evidence source truthfully.
- [ ] Planner status truthfully labels deterministic fallback or optional LLM refinement.
- [ ] Evidence snippets come from real Slack messages.
- [ ] Changing a route/shelter message changes the generated plan.
- [ ] Mock fallback is tested separately.
- [ ] Missing `OPENAI_API_KEY`, API failure, or invalid LLM JSON does not block approval or posting.

## Demo Recording

- [ ] Channels seeded with realistic messages.
- [ ] No secrets visible.
- [ ] Browser and desktop notifications hidden.
- [ ] Video is under 3 minutes.
- [ ] Video shows working Slack flow.
- [ ] Video shows final `#coordination` post.

## Submission

- [ ] GitHub repo updated.
- [ ] Repo public or judge-accessible.
- [ ] Devpost text ready.
- [ ] Architecture diagram ready.
- [ ] Slack sandbox URL ready.
- [ ] Judge accounts invited.
- [ ] Final no-secrets check complete.
