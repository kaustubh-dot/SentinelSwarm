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
Weather desk: rainfall intensity increasing near Zone B for the next 90 minutes. Riverside Lane and the old bus depot area should be treated as high risk.
```

```txt
#field-reports
Zone B field update: water rising near Riverside Lane. 25 residents need evacuation support, including elderly residents and two children. Bridge access is blocked.
```

```txt
#routes
Zone B route update: Route R2 through Riverside Lane is blocked by overflow. Route R4 via Hill School Road is open for emergency vehicles.
```

```txt
#shelters
Hill School shelter has 18 free beds, generator backup, and blankets for Zone B evacuees tonight.
```

```txt
#supplies
Main depot has 40 water cans, 25 blankets, 12 first-aid kits, and a driver available if the route is confirmed.
```

```txt
#volunteers
Anika and Dev are available near Zone B with a 4x4 from 5pm to 9pm. Maya can coordinate phone check-ins for the next 3 hours.
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
@SentinelSwarm heavy rain near Zone B, water rising near Riverside Lane, 25 people need evacuation, Route R2 blocked
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
