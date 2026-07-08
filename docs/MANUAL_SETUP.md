# Manual Setup Checklist

These are the things you should do manually. Codex can write code and docs, but these require accounts, browser access, Slack UI work, or human judgment.

## 1. Devpost

- Join the hackathon on Devpost.
- Create or confirm your Devpost account.
- Keep the submission page open early; do not wait until the final day.
- Confirm your team details if you are working with anyone else.

## 2. Slack Developer Program And Sandbox

- Join the Slack Developer Program.
- Create or open the free Slack developer sandbox for the hackathon.
- Save the sandbox workspace URL for Devpost.
- Create the demo channels:
  - `#field-reports`
  - `#volunteers`
  - `#supplies`
  - `#routes`
  - `#shelters`
  - `#alerts`
  - `#coordination`

## 3. Slack App Configuration

- Create a new Slack app named `SentinelSwarm`.
- Enable Socket Mode.
- Create an app-level token with `connections:write`.
- Add bot scopes:
  - `app_mentions:read`
  - `channels:join`
  - `chat:write`
  - `channels:read`
  - `channels:history` if needed for fallback/debug retrieval
  - `groups:read` only if private channels are used
  - `groups:history` only if private channels are used
  - `search:read.public` for Real-Time Search public-channel context
  - any RTS/assistant-specific scope Slack requires in the app config
- Subscribe to bot event:
  - `app_mention`
- Enable interactivity for buttons.
- Install the app to the sandbox workspace.
- Invite the app to all demo channels.

## 4. Early Slack Smoke Test

Do this before adding advanced features:

```txt
@SentinelSwarm ping
```

Confirm:

- The local app receives the event.
- The bot replies.
- Button actions can be received.
- The app mention payload includes or does not include `action_token`; document what you see.

## 5. Real-Time Search Check

After the app mention flow works:

- Trigger `@SentinelSwarm analyze Zone B risk`.
- Confirm whether RTS succeeds.
- If RTS fails, capture the exact error text.
- Check scopes and app eligibility.
- Keep fallback mode working no matter what.

## 6. Seed Demo Data

Manually post the scripted fictional messages from `docs/DEMO_SCRIPT.md` into the demo channels.

Use fictional names and fictional locations. Do not use real emergency reports or personal data.

## 7. Environment Variables

Create local `.env` from `.env.example` after implementation exists.

You will manually fill:

- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`
- `SLACK_COORDINATION_CHANNEL_ID`
- `SLACK_SIGNING_SECRET` if used
- `GOOGLE_API_KEY` only if optional Gemini refinement is enabled

Never commit `.env`.

## 8. Judge Access

Before submission:

- Invite `slackhack@salesforce.com`.
- Invite `testing@devpost.com`.
- Confirm both can access the sandbox workspace.
- Confirm relevant demo channels are visible.
- Confirm the app is installed and usable.

## 9. Demo Video

You should record this manually.

Checklist:

- Keep it under 3 minutes.
- Hide tokens and private browser tabs.
- Show Slack, not only code.
- Show the exact command:

```txt
@SentinelSwarm analyze Zone B risk
```

- Show the Incident Control Room.
- Show the Evidence Ledger.
- Click Approve Plan.
- Click Post to Coordination.
- Show the final `#coordination` post.

## 10. Should You Connect Slack As MCP?

No, not for the first working build.

Reasons:

- RTS already satisfies the hackathon required-technology rule.
- Your main roadblock risk is Slack auth/config, so duplicating Slack through MCP adds avoidable complexity.
- A Slack app plus RTS is the native path for this product.
- MCP is better as a bonus for external tools or local crisis resources, not as another way to read Slack.

If the core demo is finished early, add a tiny MCP server for SentinelSwarm resources, not Slack itself.
