# Demo Video Storyboard

Target length: 2:45 to 3:00.

## Recording Setup

- Use only fictional disaster-response data from `docs/DEMO_SEED_MESSAGES.md`.
- Use the Zone A scenario for the primary take. Use Zone B if fallback fixtures need to line up exactly with the current local mock context.
- Open Slack at a readable zoom level.
- Prepare channels: `#alerts`, `#field-reports`, `#routes`, `#shelters`, `#supplies`, `#volunteers`, and `#coordination`.
- Keep `.env`, token pages, Slack app settings, and terminal logs off screen.
- Before recording, run `npm test` and `npm run build`.

## Scene 1: Problem

Time: 0:00-0:20

Show: Quick scan across seeded Slack channels.

Narration:

```txt
During a flood response, critical information gets scattered across Slack: field reports, routes, shelter capacity, supplies, alerts, and volunteer availability. SentinelSwarm turns that scattered context into a single evidence-linked action plan, while keeping a human coordinator in control.
```

On-screen callout to mention: "Slack-native"

## Scene 2: Workspace Context

Time: 0:20-0:40

Show: `#alerts`, `#routes`, `#shelters`, and `#volunteers` messages.

Narration:

```txt
Here the team has posted a weather alert, a blocked bridge, an open bypass route, shelter capacity, supplies, and volunteer availability. These are normal Slack updates, but in a crisis they are easy to miss when they live in separate channels.
```

On-screen callout to mention: "Evidence-linked"

## Scene 3: Incident Report

Time: 0:40-1:00

Show: Open `#field-reports` and paste the Zone A trigger.

Exact trigger:

```txt
@SentinelSwarm analyze Zone A risk: heavy rain near Zone A, water rising, 25 people need evacuation, route bridge blocked
```

Narration:

```txt
A coordinator can trigger the workflow from the field report. SentinelSwarm reads the requested zone, gathers available context, and prepares a structured plan inside Slack.
```

## Scene 4: Incident Control Room

Time: 1:00-1:45

Show: Thread response with the Incident Control Room.

Narration:

```txt
This is the Incident Control Room. It shows severity, confidence, source status, an evidence ledger, the priority incident, route guidance, resource matches, and a recommended plan. The key point is that the coordinator can see why the recommendation exists instead of receiving a black-box answer.
```

Point to:

- Severity and confidence.
- Evidence Ledger.
- Blocked route and safer route.
- Shelter recommendation.
- Supplies and volunteer matches.
- Status line for Real-Time Search or fallback context.

On-screen callouts to mention: "Evidence-linked", "Fallback-safe"

## Scene 5: Human Approval

Time: 1:45-2:10

Show: Click Approve Plan.

Narration:

```txt
SentinelSwarm is decision support, not an autonomous emergency dispatcher. The app keeps a human coordinator in control, so the final plan cannot be posted until it is approved.
```

On-screen callout to mention: "Human-approved"

## Scene 6: Coordination Post

Time: 2:10-2:35

Show: Click Post to Coordination, then open `#coordination`.

Narration:

```txt
After approval, the plan is posted to the coordination channel, where the response team can act from one shared version of the plan. That makes handoffs clearer and reduces duplicated search across channels.
```

## Scene 7: Impact Close

Time: 2:35-2:55

Show: Final `#coordination` post or the Incident Control Room.

Narration:

```txt
For response teams, NGOs, mutual-aid groups, and campus safety teams, SentinelSwarm turns Slack from a stream of scattered updates into a traceable coordination surface. It is Slack-native, evidence-linked, human-approved, and fallback-safe.
```

On-screen callout to mention: "Built for response teams, NGOs, and campus safety"

## Backup Takes

- If Zone A live context does not look strong, switch to the Zone B trigger:

```txt
@SentinelSwarm analyze Zone B risk
```

- If Real-Time Search, weather, flood, or LLM behavior is unavailable, say:

```txt
The demo is designed to degrade gracefully. When live context is unavailable, SentinelSwarm uses seeded fallback context and deterministic planning so the coordinator still gets an explainable plan.
```

- If the coordination channel post is not configured, stop on the approved Incident Control Room and say:

```txt
In the live submission setup, the approved plan posts to #coordination. The important safety gate is that the plan remains visible and reviewable before posting.
```

## What Not To Show

- Do not show `.env`, `.env.backup.local`, token pages, app-level tokens, bot tokens, signing secrets, or API keys.
- Do not show real emergencies, real victims, real phone numbers, private addresses, or private workspace data.
- Do not claim SentinelSwarm dispatches emergency services.
- Do not claim certified flood prediction accuracy.
- Do not claim production readiness for life-critical operations.
- Do not mention MCP as complete unless the team implements it before submission.
