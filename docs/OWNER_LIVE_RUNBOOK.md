# Owner Live Runbook

Use this when you are operating the live SentinelSwarm Slack demo. This is your step-by-step path from local preflight to recording.

## 1. Preflight

Run from the repo root:

```powershell
cd C:\Kaustubh\Projects\Slack-hackathon
npm.cmd run build
npm.cmd test
npm.cmd run smoke:slack
```

Interpret `npm.cmd run smoke:slack`:

- `PASS`: good for live testing.
- `WARN`: the app may still run, but live evidence or coordination posting may be limited.
- `FAIL`: fix before recording.

Optional write-path check:

```powershell
npm.cmd run smoke:slack -- --post-test
```

This posts a harmless test message to `#coordination`.

Before opening Slack, confirm:

- Bot is installed in the Slack sandbox.
- Socket Mode is enabled.
- Interactivity is enabled.
- Bot is invited to `#field-reports`, `#routes`, `#shelters`, `#supplies`, `#volunteers`, `#alerts`, and `#coordination`.
- `SLACK_COORDINATION_CHANNEL_ID` is a channel ID like `C...`, not `#coordination`.

Start the app:

```powershell
npm.cmd run dev
```

Keep that terminal running.

## 2. Seed Channels

Post short, realistic messages before recording. Prefer the seed script so the sandbox story is consistent across rehearsals.

Use fictional data only. Do not use real personal information, phone numbers, addresses, or secrets.

Preview what will be posted:

```powershell
npm.cmd run seed:slack
```

When the channels exist and the bot is invited, post the fictional seed pack:

```powershell
npm.cmd run seed:slack -- --post
```

The script does not post the bot mention. Trigger SentinelSwarm manually from `#field-reports`.

Manual fallback: paste the full seed pack from `docs/DEMO_SEED_MESSAGES.md`. Keep the manual messages aligned with that file so the expected route, shelter, volunteer, and supply story stays consistent.

## 3. Live Test Flow

In Slack, test:

```txt
@SentinelSwarm ping
```

Expected:

```txt
SentinelSwarm is online.
```

Then run the main demo message in `#field-reports`:

```txt
@SentinelSwarm analyze Zone B risk
```

Expected:

- Incident Control Room appears in a thread.
- Evidence Ledger shows cited snippets.
- Card includes evidence source, weather/flood status, incident, route guidance, volunteers, supplies, shelters, confidence, and human-approval disclaimer.
- `Approve Plan` works.
- `Refresh Analysis` reruns the plan and resets approval if new route/shelter context is posted.
- `Post to Coordination` works after approval.
- Final action plan appears in `#coordination`.
- `Generate Handover` posts a handover summary in the thread.

## 4. RTS And Fallback Interpretation

Treat source labels as part of the product story:

- `RTS N`: Real-Time Search returned usable Slack evidence.
- `RTS tried | mock fallback`: SentinelSwarm attempted RTS and used deterministic `mockContext.json`.
- `Slack scan +N`: optional live channel-history enrichment added evidence on top of the guaranteed mock fallback.
- `mock weather` / `mock flood`: Open-Meteo was unavailable or mock mode was forced.
- `live weather` / `live flood`: Open-Meteo returned live signals.

If RTS falls back, do not panic. Say:

```txt
SentinelSwarm attempts Slack Real-Time Search first, then gracefully falls back while clearly labeling the evidence source.
```

For a strong proof that the app is not hardcoded, use `SENTINEL_FORCE_MOCKS=false` and verify the card status shows `RTS N` or `Slack scan +N`:

1. Change the `#routes` message.
2. Click `Refresh Analysis` in the existing Incident Control Room.
3. Confirm the route recommendation changes and the card returns to awaiting approval.

Example alternate route seed:

```txt
Zone B route update: Route R2 through Riverside Lane is now open for emergency vehicles. Route R4 via Hill School Road is blocked by stalled traffic.
```

## 5. Recording Checklist

Record under 3 minutes.

Recommended sequence:

1. Briefly show seeded Slack channel chaos.
2. Open `#field-reports`.
3. Send the Zone B natural incident message.
4. Show the Incident Control Room.
5. Point to Evidence Ledger and source/status indicators.
6. Add the alternate route update and click `Refresh Analysis`.
7. Click `Approve Plan`.
8. Click `Post to Coordination`.
9. Show final `#coordination` post.
10. End with:

```txt
SentinelSwarm turns chaotic disaster-response Slack reports into evidence-linked, human-approved coordination plans.
```

Before recording:

- Hide desktop/browser notifications.
- Do not show `.env`.
- Do not show tokens.
- Do not show logs with secrets.
- Use only fictional data.
- If live RTS is unstable, record fallback mode with the fallback badge visible.

## 6. Roadblock Troubleshooting

### Bot Does Not Reply

- Confirm `npm.cmd run dev` is still running.
- Confirm Socket Mode is enabled.
- Confirm `SLACK_APP_TOKEN` starts with `xapp-`.
- Confirm `SLACK_BOT_TOKEN` starts with `xoxb-`.
- Confirm app has `app_mention` event.
- Invite bot to the channel.

### Buttons Fail

- Enable Interactivity.
- Confirm Socket Mode is enabled.
- Restart `npm.cmd run dev`.

### Posting Fails

- Use a channel ID for `SLACK_COORDINATION_CHANNEL_ID`.
- Invite bot to `#coordination`.
- Confirm `chat:write` scope is installed.

### Live Evidence Falls Back

- Confirm `search:read.public` is installed.
- Confirm `channels:history` is installed.
- Invite the bot to every demo channel.
- Reinstall the app after scope changes.
- Trigger via app mention.
- Continue with fallback if needed; it is acceptable if labeled truthfully.

## 7. Owner Priority

Get one clean full Slack flow recorded before chasing more features.

After the first clean recording, only polish copy/UI and fix bugs.
