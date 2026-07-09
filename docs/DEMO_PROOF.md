# Demo Proof

Use this page as the factual evidence log for the final live Slack smoke test. Do not mark an item as passed unless it was verified in the live Slack sandbox during the latest run.

## Latest Live Slack Smoke Test

- Date: 2026-07-09
- Time: 15:37
- Time zone: IST (UTC+05:30)
- Tester: Codex CLI smoke test with live Slack credentials
- Result: Slack smoke preflight passed. Full hosted Incident Control Room approval/post run is not yet verified.

## Workspace / Sandbox

- Slack workspace name: SentinelSwarm
- Slack sandbox URL:
- Slack app name: SentinelSwarm
- Demo channels verified:
  - `#field-reports`: bot member and history readable (`C0BFGD0MPDM`)
  - `#volunteers`: bot member and history readable (`C0BFZMNTS6M`)
  - `#supplies`: bot member and history readable (`C0BFRGTSSMR`)
  - `#routes`: bot member and history readable (`C0BGS4H4J5N`)
  - `#shelters`: bot member and history readable (`C0BFUFE8UG5`)
  - `#alerts`: bot member and history readable (`C0BFVPYD0UE`)
  - `#coordination`: bot member and history readable (`C0BG1G78DFE`)

## Command Tested

```txt
@SentinelSwarm analyze Zone B risk
```

- Trigger channel:
- Thread or channel response:
- App running in Socket Mode:
- App log reference:

## Dependency Status

| Dependency | Live result | Fallback result | Notes |
| --- | --- | --- | --- |
| Real-Time Search (`assistant.search.context`) | Not yet verified | Not yet verified | Fallback should use `src/data/mockContext.json`; live Slack scan may enrich fallback evidence when available. |
| Weather | Not yet verified | Not yet verified | Fallback should use `src/data/mockWeather.json`. |
| Flood | Not yet verified | Not yet verified | Fallback should use `src/data/mockFlood.json`. |
| Planner | Not yet verified | Not yet verified | Invalid or unavailable LLM output should fall back to deterministic planner. |

Smoke note: `npm.cmd run smoke:slack` passed on 2026-07-09 at 15:37 IST. It verified Slack tokens, Socket Mode app token, public demo channel access, and `#coordination` target membership. It did not exercise the Incident Control Room buttons.

## Incident Control Room Checks

- Card appears after app mention:
- Risk summary is shown:
- Evidence Ledger includes 2-4 snippets:
- Status indicators are truthful:
- Priority incidents are shown:
- Route conflicts are shown:
- Volunteer matches are shown:
- Supply actions are shown:
- Final recommended plan is shown:
- Confidence level is shown:
- Decision-support disclaimer is shown:
- Refresh Analysis click tested:
- What Changed section appears after refresh when context changes:
- Generate Handover click tested:

## Human Approval Checks

- `approve_plan` button visible:
- Approve Plan click tested:
- Card state after approval:
- `post_plan` button hidden before approval:
- `post_plan` button visible after approval:
- Final plan was not posted before approval:

## Coordination Post Check

- `#coordination` channel ID configured:
- Post to Coordination click tested:
- Final `#coordination` post created:
- Final post timestamp/link:

## Screenshot / Video References

- Incident Control Room screenshot:
- Evidence Ledger screenshot:
- Approval state screenshot:
- Final `#coordination` post screenshot:
- Demo video file/link:
- Devpost demo video link:

## Known Issues Before Submission

- Open issue 1: Hosted Render run is not verified yet. Local Socket Mode remains the fallback for recording.
- Open issue 2:
- Open issue 3:

## Submission Sign-Off

- Build passed:
- Tests passed:
- Secret scan passed:
- Forced mock-mode run completed:
- Latest proof reviewed by:
- Ready for submission: No, pending live verification.
