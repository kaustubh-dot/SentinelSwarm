# Demo Proof

Use this page as the factual evidence log for the final live Slack smoke test. Do not mark an item as passed unless it was verified in the live Slack sandbox during the latest run.

## Latest Live Slack Smoke Test

- Date: 2026-07-09
- Time: 20:59
- Time zone: IST (UTC+05:30)
- Tester: Codex + live Slack sandbox operator
- Result: Local Socket Mode preflight passed, full approval/post/handover path verified, and Refresh Analysis verified after the route-update fix.

## Workspace / Sandbox

- Slack workspace name: SentinelSwarm
- Slack sandbox URL: Pending Devpost entry
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

- Trigger channel: `#field-reports` (`C0BFGD0MPDM`)
- Thread or channel response: Incident Control Room appeared in the `#field-reports` thread.
- Latest full post run thread: `1783606755.870279`
- Refresh-fixed verification thread: `1783610881.384279`
- App running in Socket Mode: Yes.
- App log reference: `.logs/sentinelswarm-dev.out.log` showed `SentinelSwarm is running in Socket Mode.`

## Dependency Status

| Dependency | Live result | Fallback result | Notes |
| --- | --- | --- | --- |
| Real-Time Search (`assistant.search.context`) | Attempted, unavailable in latest captured card | Verified | Card showed `RTS unavailable | mock fallback | Slack scan +6`; live Slack scan supplied route evidence. |
| Weather | Verified live | Not needed in latest run | Card showed `live weather`. |
| Flood | Verified live | Not needed in latest run | Card showed `live flood`. |
| Planner | Deterministic planner verified | Verified by default mode | Card showed `deterministic`; `.env` had `SENTINEL_USE_LLM=false`. |

Smoke note: `npm.cmd run smoke:slack` passed on 2026-07-09 at 20:59 IST. It verified Slack tokens, Socket Mode app token, public demo channel access, and `#coordination` target membership.

## Incident Control Room Checks

- Card appears after app mention: Yes.
- Risk summary is shown: Yes.
- Evidence Ledger includes 2-4 snippets: Yes; latest refresh-fixed card showed current Slack report and route-update evidence.
- Status indicators are truthful: Yes; card showed `RTS unavailable | mock fallback | Slack scan +6 | live weather | live flood | deterministic`.
- Priority incidents are shown: Yes.
- Route conflicts are shown: Yes; latest refresh-fixed card showed `R2 OPEN` and `R4 BLOCKED` from Slack evidence.
- Volunteer matches are shown: Yes.
- Supply actions are shown: Yes.
- Final recommended plan is shown: Yes.
- Confidence level is shown: Yes.
- Decision-support disclaimer is shown: Yes.
- Refresh Analysis click tested: Yes.
- What Changed section appears after refresh when context changes: Yes.
- Generate Handover click tested: Yes; handover reply appeared in the thread.

## Human Approval Checks

- `approve_plan` button visible: Yes.
- Approve Plan click tested: Yes.
- Card state after approval: Yes.
- `post_plan` button hidden before approval: Yes.
- `post_plan` button visible after approval: Yes.
- Final plan was not posted before approval: Yes.

## Coordination Post Check

- `#coordination` channel ID configured: Yes, `C0BG1G78DFE`.
- Post to Coordination click tested: Yes.
- Final `#coordination` post created: Yes.
- Final post timestamp/link: `1783606802.373519` / `https://sentinelswarm.slack.com/archives/C0BG1G78DFE/p1783606802373519`

## Screenshot / Video References

- Incident Control Room screenshot: Pending final recording capture.
- Evidence Ledger screenshot: Pending final recording capture.
- Approval state screenshot: Pending final recording capture.
- Final `#coordination` post screenshot: Pending final recording capture.
- Demo video file/link: Pending final recording upload.
- Devpost demo video link: Pending final recording upload.

## Known Issues Before Submission

- Open issue 1: Final public demo video link is still pending.
- Open issue 2: Judge sandbox invites must be confirmed before submission.
- Open issue 3: Forced mock-mode rehearsal should be run once before final submission.

## Submission Sign-Off

- Build passed: Yes.
- Tests passed: Yes.
- Secret scan passed: Yes.
- Forced mock-mode run completed: Pending.
- Latest proof reviewed by: Codex + live Slack operator.
- Ready for submission: No, pending final video link, judge invites, and forced mock rehearsal.
