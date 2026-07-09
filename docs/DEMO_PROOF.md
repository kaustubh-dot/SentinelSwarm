# Demo Proof

Use this page as the factual evidence log for the final live Slack smoke test. Do not mark an item as passed unless it was verified in the live Slack sandbox during the latest run.

## Latest Live Slack Smoke Test

- Date:
- Time:
- Time zone:
- Tester:
- Result: Not yet verified.

## Workspace / Sandbox

- Slack workspace name:
- Slack sandbox URL:
- Slack app name: SentinelSwarm
- Demo channels verified:
  - `#field-reports`:
  - `#volunteers`:
  - `#supplies`:
  - `#routes`:
  - `#shelters`:
  - `#alerts`:
  - `#coordination`:

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

- Open issue 1:
- Open issue 2:
- Open issue 3:

## Submission Sign-Off

- Build passed:
- Tests passed:
- Secret scan passed:
- Forced mock-mode run completed:
- Latest proof reviewed by:
- Ready for submission: No, pending live verification.
