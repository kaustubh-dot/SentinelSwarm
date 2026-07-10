# Railway Deployment

SentinelSwarm can run on Railway as a single long-running Docker service. The service connects outbound to Slack using Socket Mode; it does not require a public Slack Events webhook.

## Deploy

1. Push `main` to GitHub.
2. In Railway, choose **New Project** and **Deploy from GitHub Repo**.
3. Select the repository and the `main` branch.
4. Railway should report `Using detected Dockerfile!` because the repository has a root-level `Dockerfile`.
5. Add the variables below in the service's **Variables** tab.
6. Deploy the staged variable changes.

Required variables:

```txt
SLACK_BOT_TOKEN=xoxb-...
SLACK_APP_TOKEN=xapp-...
SLACK_COORDINATION_CHANNEL_ID=C...
SENTINEL_FORCE_MOCKS=false
SENTINEL_USE_LLM=false
LOG_LEVEL=info
```

Do not upload `.env` or add `GOOGLE_API_KEY` for the judged demo.

## Verify

The Railway-provided `PORT` automatically enables the safe health server. Generate a Railway public domain and open `/healthz`. The response contains only app status, runtime mode, fallback mode, LLM mode, and uptime.

Then inspect the logs for:

```txt
SentinelSwarm is running in Socket Mode.
```

Stop any local Socket Mode process before testing Railway so two listeners do not compete for Slack events.

## Slack smoke test

Run the following in the sandbox after Railway is healthy:

```txt
@SentinelSwarm ping
@SentinelSwarm analyze Zone B risk
```

Verify Incident Control Room, Refresh Analysis, Approve Plan, Post to Coordination, and Generate Handover.

## Rollback

Use Railway's previous successful deployment if a new deployment fails. The local Socket Mode process remains the emergency recording fallback.
