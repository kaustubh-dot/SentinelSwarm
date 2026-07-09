# Render Deploy

Use Render as the hosted backup path for the judged demo. Local Socket Mode remains the fastest fallback for recording if the hosted service is asleep, restarting, or unavailable.

## Service

- Runtime: Node
- Service type: Web Service
- Branch: `codex/sentinelswarm-winning-upgrades`
- Health endpoint: `/healthz`
- Start command: `npm run start`
- Build command: `npm ci && npm run build && npm prune --omit=dev`

## Required Environment Variables

Add these in Render service settings. Keep token values secret.

- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_COORDINATION_CHANNEL_ID`
- `SENTINEL_FORCE_MOCKS=false`
- `SENTINEL_HEALTH_SERVER=true`
- `SENTINEL_USE_LLM=false`
- `LOG_LEVEL=info`

Do not add `GOOGLE_API_KEY` for the judged demo.

## Deploy

1. Confirm the local branch is green.
2. Create a Render Web Service from the GitHub repo.
3. Select branch `codex/sentinelswarm-winning-upgrades`.
4. Set the build and start commands above.
5. Add the required environment variables.
6. Deploy the service.
7. Open `https://<service-name>.onrender.com/healthz`.

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

Before testing Render, stop any local `npm.cmd run dev` process. Two Socket Mode listeners can race and make Slack replies confusing.

Render free services may sleep after inactivity. Wake the service by opening `/healthz` before the recording.

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

If Render sleeps, restarts, or fails to receive Slack events:

1. Stop relying on Render for recording.
2. Start the local app with `npm.cmd run dev`.
3. Run the same Slack flow locally.
4. Record the local Socket Mode run and note the hosted issue in `docs/DEMO_PROOF.md`.
