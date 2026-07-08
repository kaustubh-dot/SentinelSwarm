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

Post short, realistic messages before recording.

Use fictional data only. Do not use real personal information, phone numbers, addresses, or secrets.

Suggested live seed pack:

```txt
#alerts
Weather desk: rainfall intensity increasing near Zone A for the next 90 minutes. Low-lying lanes near the canal should be treated as high risk.
```

```txt
#field-reports
Zone A field update: water rising near Canal Road. 25 residents need evacuation support, including elderly residents and two children. Bridge access is blocked.
```

```txt
#routes
Zone A route update: Route R2 over Canal Bridge is blocked by overflow. Route R4 via East Bypass is open for emergency vehicles.
```

```txt
#shelters
Hill School annex has 80 free beds, generator backup, and drinking water for Zone A evacuees tonight.
```

```txt
#supplies
Ward 12 storage has 120 water bottles, 45 blankets, 18 first-aid kits, and 6 portable lights ready for dispatch.
```

```txt
#volunteers
8 trained volunteers are available near Zone A. 3 have first-aid training, 2 have pickup vehicles, and 1 can coordinate phone check-ins.
```

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
@SentinelSwarm heavy rain near Zone A, water rising, 25 people need evacuation, route bridge blocked
```

Expected:

- Incident Control Room appears in a thread.
- Evidence Ledger shows cited snippets.
- Card includes evidence source, weather/flood status, incident, route guidance, volunteers, supplies, shelters, confidence, and human-approval disclaimer.
- `Approve Plan` works.
- `Post to Coordination` works after approval.
- Final action plan appears in `#coordination`.
- `Generate Handover` posts a handover summary in the thread.

## 4. RTS And Fallback Interpretation

Treat source labels as part of the product story:

- `Evidence source: Slack Real-Time Search`: RTS worked.
- `Evidence source: Live Slack channel context`: RTS was unavailable, but SentinelSwarm still used live Slack channel history.
- `Evidence source: Demo fallback context`: live retrieval was unavailable or mock mode was forced.

If RTS falls back, do not panic. Say:

```txt
SentinelSwarm attempts Slack Real-Time Search first, then gracefully falls back while clearly labeling the evidence source.
```

For a strong proof that the app is not hardcoded:

1. Change the `#routes` message.
2. Rerun the incident.
3. Confirm the route recommendation changes.

Example alternate route seed:

```txt
Zone A route update: Route R2 over Canal Bridge is now open for emergency vehicles. Route R4 via East Bypass is blocked by stalled traffic.
```

## 5. Recording Checklist

Record under 3 minutes.

Recommended sequence:

1. Briefly show seeded Slack channel chaos.
2. Open `#field-reports`.
3. Send the Zone A natural incident message.
4. Show the Incident Control Room.
5. Point to Evidence Ledger and source/status indicators.
6. Click `Approve Plan`.
7. Click `Post to Coordination`.
8. Show final `#coordination` post.
9. End with:

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
