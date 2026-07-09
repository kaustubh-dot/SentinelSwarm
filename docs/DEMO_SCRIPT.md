# Demo Script

Target length: 2:45 to 2:55.

Demo story: monsoon flood response in Zone B for a campus, NGO, or volunteer coordination team.

## Demo Setup

Create these Slack channels:

- `#field-reports`
- `#volunteers`
- `#supplies`
- `#routes`
- `#shelters`
- `#alerts`
- `#coordination`

Use fictional data only.

## Seed Messages

Post these messages before recording.

### `#field-reports`

```txt
Zone B update: water is rising near Riverside Lane. Two homes requesting evacuation support. Elderly residents present.
```

```txt
Field team reports knee-deep water near the old bus depot in Zone B. Need route check before sending volunteers.
```

```txt
Zone A looks stable for now. No new requests after the last shelter transfer.
```

### `#routes`

```txt
Route R2 through Riverside Lane is blocked by debris and standing water. Avoid for the next 4 hours.
```

```txt
Route R4 via Hill School Road is open for light vehicles. Best access to Zone B shelter.
```

### `#shelters`

```txt
Hill School shelter has 18 spaces, blankets available, needs drinking water by evening.
```

```txt
Community Hall shelter is full and cannot accept more families right now.
```

### `#volunteers`

```txt
Anika and Dev are available with a 4x4 from 5pm to 9pm. First-aid trained.
```

```txt
Maya can coordinate phone check-ins for Zone B households for the next 3 hours.
```

### `#supplies`

```txt
Depot has 40 water cans, 25 blankets, 12 first-aid kits. Driver available if route is confirmed.
```

```txt
Portable lights are low. Only 3 units available for field teams tonight.
```

### `#alerts`

```txt
Weather alert: heavy rain expected this evening. Monitor low-lying Zone B routes closely.
```

## Exact App Mention

```txt
@SentinelSwarm analyze Zone B risk
```

## Expected Bot Response

The bot should reply in thread with an Incident Control Room showing:

- Zone B risk summary.
- RTS used or fallback used.
- Evidence Ledger with 2-4 cited Slack snippets.
- Weather/flood live or mock status.
- Priority incident: Riverside Lane evacuation support.
- Route conflict: R2 blocked.
- Safer route: R4 via Hill School Road.
- Shelter match: Hill School shelter.
- Volunteer match: Anika, Dev, and Maya.
- Supply action: send water cans, blankets, first-aid kits.
- Confidence level.
- Human approval disclaimer.
- Initial buttons: Approve Plan, Refresh Analysis, Generate Handover. Post to Coordination appears only after approval.

## Video Timeline

### 0:00-0:20 Problem

Say:

```txt
During monsoon flooding, response teams often have critical updates scattered across Slack: field reports, blocked routes, shelter capacity, supplies, and volunteers. SentinelSwarm turns that chaos into a verified action plan without removing human approval.
```

Show the seeded channels quickly.

### 0:20-0:40 Trigger

Type:

```txt
@SentinelSwarm analyze Zone B risk
```

Say:

```txt
The app is triggered from a Slack mention so it can use the event context and Real-Time Search action token when available.
```

### 0:40-1:35 Incident Control Room

Show the thread response.

Say:

```txt
SentinelSwarm searches relevant Slack context, combines it with local operational data and live or fallback weather and flood signals, then creates this Incident Control Room.
```

Point out:

- Evidence/status indicators.
- Evidence Ledger.
- Severity ranking.
- Route conflict.
- Volunteer and supply match.
- Human approval disclaimer.

### 1:35-2:10 Approval

Click Approve Plan.

Say:

```txt
The app does not dispatch automatically. A human coordinator must approve the recommendation first.
```

Show that `Post to Coordination` appears only after approval.

Click Post to Coordination.

### 2:10-2:35 Final Coordination Post

Switch to `#coordination`.

Say:

```txt
The approved plan is posted cleanly to the coordination channel, ready for responders to act on and hand off.
```

### 2:35-2:55 Impact Close

Say:

```txt
For NGOs, campus safety teams, and mutual-aid groups, this can reduce time lost searching through messages and make crisis handoffs clearer, safer, and more accountable.
```

## Backup Demo Path

If live RTS, weather, flood, or LLM calls fail:

1. Turn on mock mode.
2. Keep the same Slack command.
3. Show the status indicators that say fallback mode was used.
4. Say:

```txt
Every external dependency has a deterministic fallback, so the demo and the workflow still function under real hackathon conditions.
```
