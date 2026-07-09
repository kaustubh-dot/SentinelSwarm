# Demo Seed Messages

Post these fictional messages into the Slack sandbox before recording. They make the workspace look busy enough for Real-Time Search while keeping the story narrow: monsoon flood response in Zone B.

## Recommended Seed Command

Preview the seed plan without posting:

```powershell
npm.cmd run seed:slack
```

Post the seed messages only when the sandbox channels exist and the bot is invited:

```powershell
npm.cmd run seed:slack -- --post
```

The script posts the channel messages below, but it does not post the `@SentinelSwarm` trigger. Send the bot mention manually from `#field-reports` when you are ready to test or record.

## Channels

- `#alerts`
- `#field-reports`
- `#routes`
- `#shelters`
- `#supplies`
- `#volunteers`
- `#coordination`

## Manual Paste Order

1. `#alerts`
2. `#routes`
3. `#shelters`
4. `#supplies`
5. `#volunteers`
6. `#field-reports`
7. Trigger SentinelSwarm from `#field-reports`

## Zone B Scenario

### `#alerts`

```txt
Weather desk: rainfall intensity is increasing near Zone B for the next 90 minutes. Riverside Lane and the old bus depot area should be treated as high risk.
```

```txt
Drainage watch: runoff is backing up near the low-lying blocks in Zone B. Recheck access routes before sending volunteer vehicles.
```

### `#routes`

```txt
Zone B route update: Route R2 via Riverside Lane is blocked by debris and standing water. Avoid for the next 4 hours.
```

```txt
Route R4 via Hill School Road is open for light vehicles and is the safest path to the Zone B shelter.
```

```txt
Route R6 via Market Road is passable but slow because of waterlogging near the bus depot.
```

### `#shelters`

```txt
Hill School shelter has 18 free spaces, blankets available, and needs drinking water by evening for Zone B evacuees.
```

```txt
Community Hall shelter is full and cannot accept more families right now.
```

### `#supplies`

```txt
Main depot has 40 water cans, 25 blankets, and 12 first-aid kits. Driver available if the Zone B route is confirmed.
```

```txt
Field locker has 3 portable lights ready for teams working after sunset.
```

### `#volunteers`

```txt
Anika and Dev are available with a 4x4 from 5pm to 9pm for Zone B support. Both are first-aid trained.
```

```txt
Maya can coordinate phone check-ins for Zone B households for the next 3 hours.
```

### `#field-reports`

```txt
Zone B update: water is rising near Riverside Lane. Two homes requesting evacuation support. Elderly residents present.
```

```txt
Field team reports knee-deep water near the old bus depot in Zone B. Need route check before sending volunteers.
```

## Exact Bot Mention

Paste this in `#field-reports`:

```txt
@SentinelSwarm analyze Zone B risk
```

## Optional Refresh Proof

After the Incident Control Room appears, post this in `#routes`, then click `Refresh Analysis` on the card:

```txt
Zone B route update: Route R2 through Riverside Lane is now open for emergency vehicles. Route R4 via Hill School Road is blocked by stalled traffic.
```

## Expected Story

- Slack workspace chaos is visible across channels.
- Real-Time Search or fallback context appears in the status line.
- Weather/flood risk appears as a signal, not a claim of certified prediction.
- Evidence Ledger cites 2-4 snippets.
- R2 is blocked, R4 is preferred, and R6 is caution.
- Hill School shelter is selected.
- Volunteers and supplies are matched.
- Approval is required before posting to `#coordination`.
- Refresh Analysis can update route guidance and returns the plan to awaiting approval.
