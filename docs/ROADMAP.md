# Roadmap

SentinelSwarm is a demo-first Slack Agent for Good. The roadmap below separates must-finish demo work from future product ideas so the 3-minute submission stays reliable.

## Milestone 1: Core Slack Workflow

Status: mostly implemented.

Done:

- Slack Bolt app in Socket Mode.
- App mention handler.
- Incident Control Room Block Kit renderer.
- Approve, Post to Coordination, and Generate Handover button handlers.
- Local plan store for approval state.

Remaining:

- Run live smoke test in the Slack sandbox.
- Confirm button interactivity works in the installed app.
- Confirm final post succeeds in `#coordination`.

## Milestone 2: Evidence Retrieval

Status: implemented, needs live verification.

Done:

- `assistant.search.context` RTS attempt from app mention `action_token`.
- Slack channel scan fallback.
- Local `mockContext.json` fallback.
- Source status line in the card.

Remaining:

- Confirm whether the live app mention payload includes `action_token`.
- Record what happens when RTS is unavailable.
- Make sure seeded Slack messages create a strong Evidence Ledger.

## Milestone 3: Risk And Planning

Status: implemented for the demo story.

Done:

- Weather adapter with mock fallback.
- Flood adapter with mock fallback.
- Severity scoring.
- Incident parsing.
- Route, shelter, volunteer, and supply matching.
- Deterministic fallback planner.
- Optional Gemini refinement with schema validation and retry.

Remaining:

- Keep the main recording on deterministic mode unless Gemini has been tested separately.
- Add one or two more handler-level tests if time allows.
- Avoid adding new APIs before recording.

## Milestone 4: Judge-Ready Materials

Status: mostly implemented.

Done:

- README.
- Slack setup docs.
- Manual setup docs.
- Demo seed messages.
- Demo video storyboard.
- Devpost submission draft.
- Judge Q&A.
- Architecture docs and diagram.
- Submission checklist.

Remaining:

- Capture live demo video.
- Add final video link to Devpost.
- Final no-secrets review.
- Confirm repo is public or judge-accessible.

## Future Work After Submission

- Multi-zone incident views.
- Admin UI for updating local resources.
- Better handover export for shift changes.
- More calibrated flood-risk source integration.
- Optional MCP resource server only after the Slack-native path remains stable.
- Persistent storage for plan history and audit trails.

## Freeze Rule

Once the live Slack flow is working, stop feature work and record. Bug fixes, copy edits, and no-secrets checks are allowed; new platform integrations are not.
