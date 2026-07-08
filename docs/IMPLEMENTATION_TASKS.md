# Implementation Tasks

This is the engineering task ledger. Keep completed work visible, but keep the remaining work honest.

## Completed

- Project scaffold:
  - `package.json`
  - `tsconfig.json`
  - `.gitignore`
  - `.env.example`
  - `manifest.yaml`
- Runtime stack:
  - Node.js
  - TypeScript strict mode
  - Slack Bolt
  - Slack Web API
  - Zod
  - Vitest
- Core app:
  - `src/app.ts`
  - `src/config.ts`
  - environment validation
  - Socket Mode startup
- Slack workflow:
  - app mention handler
  - ping response
  - incident analysis trigger
  - approve plan button
  - post plan button
  - generate handover button
  - local plan store
- Retrieval and fallbacks:
  - RTS wrapper using `assistant.search.context`
  - live Slack channel scan fallback
  - mock context fallback
  - weather mock fallback
  - flood mock fallback
  - deterministic planner fallback
  - invalid LLM JSON retry once, then fallback
- Planning:
  - incident parser
  - severity scorer
  - fallback planner
  - optional Gemini refinement
  - Zod plan schema validation
- Demo data:
  - zones
  - routes
  - shelters
  - supplies
  - volunteers
  - mock context
  - mock weather
  - mock flood
- Demo automation:
  - opt-in Slack seed script with dry-run default
  - tests for seed channel resolution and posting order
- Tests:
  - severity
  - local data
  - fallback planner
  - incident parser
  - RTS fallback
  - risk tools
  - planner/LLM fallback
  - Block Kit shape and size guard
  - post plan formatting
  - plan store

## Remaining Implementation Work

### Slack Handler Tests

- Add test coverage for missing `SLACK_COORDINATION_CHANNEL_ID`.
- Add test coverage for attempting `post_plan` before approval.
- Add test coverage for missing stored plan ID on each button action.
- Add test coverage for `generate_handover` thread behavior.

### Demo Robustness

- Run `npm.cmd run smoke:slack` with live credentials.
- Run optional `npm.cmd run smoke:slack -- --post-test` before recording.
- Run `npm.cmd run seed:slack -- --post` after channels are created and bot is invited.
- Confirm app mention events include or omit `action_token` and document the observed behavior.
- Confirm RTS failure labels fallback status clearly.
- Confirm live Slack channel scan changes the Evidence Ledger when seed messages change.

### Polish

- Review final Block Kit card in real Slack after seed messages are posted.
- Trim any Slack section that looks too dense during the live demo.
- Add final no-secrets checklist before commit/submission.
- Update Devpost draft after recording.

### Submission

- Record demo video.
- Add video link to Devpost.
- Attach architecture diagram.
- Confirm Slack sandbox judge access.
- Confirm repo is public or judge-accessible.

## Out Of Scope For This Demo

- Production database.
- Google Maps.
- WhatsApp.
- Twitter/X.
- Autonomous dispatch.
- Background monitoring.
- Required MCP dependency.
- Marketplace submission.
