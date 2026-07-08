# Slack Setup

Use this guide to create the Slack side of SentinelSwarm. Codex can create the manifest and code, but you must create the Slack sandbox/app and copy the tokens.

## 1. Create The App

1. Open Slack app management.
2. Choose Create New App.
3. Choose From an app manifest.
4. Select your hackathon developer sandbox workspace.
5. Paste `manifest.yaml`.
6. Review and create the app.

Slack manifests are YAML/JSON app configuration bundles that can be pasted into the Slack app creation flow.

## 2. Enable Socket Mode

1. Go to Socket Mode.
2. Enable Socket Mode.
3. Create an app-level token.
4. Add scope:

```txt
connections:write
```

5. Copy the `xapp-` token into `.env` as:

```txt
SLACK_APP_TOKEN=xapp-...
```

## 3. Bot Token Scopes

The manifest requests:

```txt
app_mentions:read
channels:join
channels:read
channels:history
chat:write
search:read.public
```

Why:

- `app_mentions:read`: receive `@SentinelSwarm` commands.
- `channels:join`: let the bot join public demo channels during setup.
- `chat:write`: reply in threads and post to `#coordination`.
- `channels:read`: resolve public channel metadata when needed.
- `channels:history`: optional surrounding-context fallback/debug support.
- `search:read.public`: required public-channel scope for Real-Time Search.

Install or reinstall the app after changing scopes. Copy the `xoxb-` bot token into `.env`:

```txt
SLACK_BOT_TOKEN=xoxb-...
```

## 4. Events And Interactivity

Confirm:

- Socket Mode is enabled.
- Event subscription includes `app_mention`.
- Interactivity is enabled.

With Socket Mode, no public request URL is needed for the hackathon demo.

## 5. Demo Channels

Create:

- `#field-reports`
- `#volunteers`
- `#supplies`
- `#routes`
- `#shelters`
- `#alerts`
- `#coordination`

Invite SentinelSwarm to each channel.

Copy the channel ID for `#coordination` into `.env`:

```txt
SLACK_COORDINATION_CHANNEL_ID=C...
```

## 6. First Smoke Test

Run:

```bash
npm run dev
```

In Slack:

```txt
@SentinelSwarm ping
```

Expected:

```txt
SentinelSwarm is online.
```

Then:

```txt
@SentinelSwarm analyze Zone B risk
```

Expected:

- Threaded Incident Control Room appears.
- Evidence Ledger is visible.
- Approve Plan button works.
- Post to Coordination works after approval.

## 7. Real-Time Search Notes

Real-Time Search uses `assistant.search.context`.

Important:

- Bot-token RTS calls require an `action_token`.
- Slack can include `action_token` in `app_mention` events.
- This is why the main demo starts with `@SentinelSwarm analyze Zone B risk`.
- If the token, scopes, or workspace setup fail, SentinelSwarm falls back to mock context and marks that status in the UI.

## 8. Troubleshooting

### Bot Does Not Reply

- Confirm `npm run dev` is still running.
- Confirm Socket Mode is enabled.
- Confirm `SLACK_APP_TOKEN` starts with `xapp-`.
- Confirm `SLACK_BOT_TOKEN` starts with `xoxb-`.
- Confirm app event subscription includes `app_mention`.
- Invite the bot to the channel.

### Buttons Do Not Work

- Confirm Interactivity is enabled.
- Confirm Socket Mode is enabled.
- Restart `npm run dev`.

### Post To Coordination Fails

- Confirm `SLACK_COORDINATION_CHANNEL_ID` is a channel ID, not `#coordination`.
- Invite the bot to `#coordination`.
- Confirm `chat:write` is installed.

### RTS Falls Back

- Confirm `search:read.public` is installed.
- Confirm the app is internal or eligible for RTS.
- Confirm the app mention payload contains `action_token`.
- Keep going: fallback mode is expected to keep the demo working.

### Should I Connect Slack As MCP?

Not for the first build. Real-Time Search is already the required Slack technology. MCP can be added later as a small resource-tool layer, but the main demo should not depend on it.
