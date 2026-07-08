# Demo Video Storyboard

Target length: 2:45 to 3:00.

## Scene 1: Slack Chaos

Time: 0:00-0:25

Show quick scans of `#alerts`, `#routes`, `#shelters`, `#supplies`, and `#volunteers`.

Narration:

```txt
During a monsoon flood response, the right facts are already in Slack, but they are scattered across channels. SentinelSwarm turns that stream into a verified, evidence-linked action plan while keeping a human coordinator in control.
```

## Scene 2: Trigger

Time: 0:25-0:45

Open `#field-reports` and send:

```txt
@SentinelSwarm analyze Zone B risk
```

Point out that app mentions are the safest demo trigger because Slack Real-Time Search bot calls require the event `action_token`.

## Scene 3: Incident Control Room

Time: 0:45-1:35

Show the Block Kit card in the thread.

Point to:

- Severity and confidence.
- RTS/weather/flood/planner status indicators.
- Evidence Ledger with Slack snippets.
- Priority incident.
- Route conflict.
- Volunteer, shelter, and supply matches.
- Recommended plan.

Narration:

```txt
The Incident Control Room explains why the recommendation exists. It combines Slack context, weather and flood signals, local resources, and deterministic planning into one concise coordination view.
```

## Scene 4: Approval Gate

Time: 1:35-2:05

Click `Approve Plan`.

Narration:

```txt
SentinelSwarm is decision support, not emergency authority. It never posts final assignments automatically.
```

## Scene 5: Coordination Post

Time: 2:05-2:35

Click `Post to Coordination`, then open `#coordination`.

Narration:

```txt
After approval, the team gets one clean final plan in the coordination channel, with routes, shelter assignment, supplies, volunteers, and the safety caveat.
```

## Scene 6: Close

Time: 2:35-2:55

Show the final post or return to the Incident Control Room.

Closing line:

```txt
SentinelSwarm makes Slack-native crisis response faster, more traceable, and safer to hand off.
```

## Backup Lines

If RTS is unavailable:

```txt
The workflow is fallback-safe. When live search is unavailable, SentinelSwarm uses seeded context and labels that status clearly.
```

If weather or flood calls fail:

```txt
External risk tools have deterministic local fallbacks, so the demo still produces a reviewable plan.
```

If LLM refinement is off:

```txt
The live path uses deterministic planning for reliability. Optional Gemini refinement is not required for the demo.
```

## Do Not Show

- `.env`, `.env.backup.local`, tokens, signing secrets, API keys, or Slack app token pages.
- Real emergencies, real victims, private addresses, phone numbers, or private workspace data.
- Claims that SentinelSwarm dispatches emergency services.
- Claims of certified flood prediction accuracy.
