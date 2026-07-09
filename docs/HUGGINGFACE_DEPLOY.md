# Hugging Face Docker Space Deploy

Use this only after the local green checks pass. Hugging Face hosting is a backup/public proof path; local Socket Mode remains the fastest fallback for recording.

## Space

- Account: `CooLBoT22`
- Space repo: `CooLBoT22/sentinelswarm-slack-bot`
- SDK: Docker
- App port: `7860`
- Do not use Hugging Face Jobs for hosting. Jobs are finite workloads, not a durable Slack Socket Mode listener.

## Required Space Secrets

Add these in the Space settings as secrets or private variables:

- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_COORDINATION_CHANNEL_ID`
- `SENTINEL_FORCE_MOCKS=false`
- `SENTINEL_USE_LLM=false`
- `LOG_LEVEL=info`

Do not add `GOOGLE_API_KEY` for the judged demo.

## Deploy

1. Commit the current local green state.
2. Create a Docker Space named `sentinelswarm-slack-bot`.
3. Push this repo to the Space repository.
4. Wait for the Space build to finish.
5. Open the Space URL and confirm the health JSON is available.

Expected health fields:

```json
{
  "app": "SentinelSwarm",
  "ok": true,
  "runtime": "slack-socket-mode",
  "socketMode": true,
  "forceMocks": false,
  "useLlm": false
}
```

The health endpoint must not show Slack tokens, channel IDs, team IDs, or raw environment values.

## Hosted Slack Test

Before testing the hosted Space, stop any local `npm.cmd run dev` process. Two Socket Mode listeners can race and make Slack replies confusing.

Then test in Slack:

```txt
@SentinelSwarm ping
@SentinelSwarm analyze Zone B risk
```

Verify:

- Incident Control Room appears.
- Source line uses the current `*Sources:* ...` format.
- `Post to Coordination` is hidden before approval.
- `Approve Plan` reveals `Post to Coordination`.
- `Post to Coordination` creates the approved dispatch handoff in `#coordination`.
- `Generate Handover` posts a thread reply.
- `Refresh Analysis` resets approval and shows `What Changed` when route context changes.

After the run, use Slack MCP as an optional read-only proof helper to read the fresh thread and `#coordination` post. Manual Slack screenshots, message links, and the demo video are equally valid proof sources. Update `docs/DEMO_PROOF.md` only with evidence you actually observed.

## Rollback

If the Space sleeps, restarts, or fails to receive Slack events:

1. Stop relying on the Space for recording.
2. Start the local app with `npm.cmd run dev`.
3. Run the same Slack flow locally.
4. Record the local Socket Mode run and note the HF issue in `docs/DEMO_PROOF.md`.
