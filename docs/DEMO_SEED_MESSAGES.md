# Demo Seed Messages

Use this pack to make the Slack workspace feel active before recording the SentinelSwarm demo. All names, places, and incident details are fictional and designed for a hackathon disaster-response scenario.

## Channels To Prepare

- `#alerts`
- `#field-reports`
- `#routes`
- `#shelters`
- `#supplies`
- `#volunteers`
- `#coordination`

## Recommended Paste Order

1. Paste `#alerts` messages first so the weather risk is visible.
2. Paste `#routes` messages next so the route conflict is obvious.
3. Paste `#shelters`, `#supplies`, and `#volunteers`.
4. Paste `#field-reports` last, then trigger SentinelSwarm from `#field-reports`.
5. Keep `#coordination` mostly quiet until the approved plan is posted.

## Primary Scenario: Zone A Canal Evacuation

Use this scenario for the main recording. It creates a clear conflict: Canal Bridge is blocked, East Bypass is open, Shelter S1 has capacity, and the field report includes vulnerable residents.

### `#alerts`

```txt
Weather desk: rainfall intensity is increasing near Zone A for the next 90 minutes. Low-lying lanes near the canal should be treated as high risk.
```

```txt
Operations note: Zone A canal sensors are trending upward. Recheck access routes before sending volunteer vehicles.
```

### `#field-reports`

```txt
Zone A field update: water rising near Canal Road. 25 residents need evacuation support, including elderly residents and two children. Bridge access is blocked.
```

```txt
Canal Road team can hold position for 20 minutes, but they need a safe route and shelter assignment before moving families.
```

### `#routes`

```txt
Route R2 over Canal Bridge is blocked by overflow and debris. Do not send volunteers through R2 until cleared.
```

```txt
Route R4 via East Bypass is open for emergency vehicles. Travel time to Zone A is about 18 minutes.
```

```txt
Market Lane is passable on foot only and should not be used for vehicle movement after sunset.
```

### `#shelters`

```txt
Shelter S1 at Hill School has 80 free beds, generator backup, and drinking water for tonight.
```

```txt
Shelter S2 is full and cannot accept new families until morning.
```

### `#supplies`

```txt
Ward 12 storage has 120 water bottles, 45 blankets, 18 first-aid kits, and 6 portable lights ready for dispatch.
```

```txt
Supply lead can load the first vehicle in 12 minutes if Route R4 remains open.
```

### `#volunteers`

```txt
8 trained volunteers are available near Zone A. 3 have first-aid training, 2 have pickup vehicles, and 1 can coordinate phone check-ins.
```

```txt
Volunteer coordinator recommends pairing vehicle teams with phone check-ins for elderly residents near Canal Road.
```

### `#coordination`

```txt
Coordination desk standing by for an approved Zone A plan. Do not post assignments until a coordinator confirms route and shelter details.
```

### Exact Bot Mention

Paste this in `#field-reports` after the seed messages:

```txt
@SentinelSwarm analyze Zone A risk: heavy rain near Zone A, water rising, 25 people need evacuation, route bridge blocked
```

### What SentinelSwarm Should Infer

- `#alerts`: Zone A risk is increasing and the canal area is time-sensitive.
- `#field-reports`: 25 residents need evacuation support, including vulnerable residents.
- `#routes`: R2 is blocked, while R4 is the preferred route.
- `#shelters`: Shelter S1 is available; Shelter S2 is not.
- `#supplies`: Ward 12 has water, blankets, first-aid kits, and lights ready.
- `#volunteers`: There are trained volunteers, vehicle capacity, and phone check-in support.
- `#coordination`: Final assignments should wait for human approval.

## Backup Scenario: Zone B Riverside Evacuation

Use this if the team wants the current fallback fixtures to match the demo path closely. Zone B is also useful for a second take because the app's mock context already includes Riverside Lane, Hill School shelter, and Anika/Dev.

### `#alerts`

```txt
Rainfall is expected to continue near Zone B until late evening. Monitor Riverside Lane and the old bus depot area.
```

```txt
Weather desk update: rainfall is steady, not worsening, but drainage near Zone B remains slow.
```

### `#field-reports`

```txt
Zone B update: knee-deep water near Riverside Lane. Two homes are requesting evacuation support. Elderly residents present.
```

```txt
Field team reports the old bus depot is waterlogged. Volunteers should confirm the route before entering Riverside Lane.
```

### `#routes`

```txt
Route R2 through Riverside Lane is blocked by debris and standing water. Avoid for the next 4 hours.
```

```txt
Route R4 via Hill School Road is open for light vehicles and is the safest path to the Zone B shelter.
```

```txt
Route R6 via Market Road is passable but slow because of waterlogging near the bus depot.
```

### `#shelters`

```txt
Hill School shelter has 18 spaces, blankets available, and needs drinking water by evening.
```

```txt
Community Hall shelter is full and cannot accept more families right now.
```

### `#supplies`

```txt
Depot has 40 water cans, 25 blankets, and 12 first-aid kits. Driver available if route is confirmed.
```

```txt
Portable lights are low. Only 3 units are available for field teams tonight.
```

### `#volunteers`

```txt
Anika and Dev are available with a 4x4 from 5pm to 9pm. Both are first-aid trained.
```

```txt
Maya can coordinate phone check-ins for Zone B households for the next 3 hours.
```

### `#coordination`

```txt
Coordination desk ready to receive a final Zone B plan after coordinator approval.
```

### Exact Bot Mention

Paste this in `#field-reports` after the seed messages:

```txt
@SentinelSwarm analyze Zone B risk
```

### What SentinelSwarm Should Infer

- `#alerts`: Zone B needs continued monitoring through late evening.
- `#field-reports`: Riverside Lane has active evacuation requests and vulnerable residents.
- `#routes`: R2 is blocked, R4 is safest, and R6 is only a cautious backup.
- `#shelters`: Hill School has limited capacity and needs water; Community Hall is full.
- `#supplies`: Depot supplies are available if the route is confirmed.
- `#volunteers`: Anika and Dev can support vehicle movement; Maya can handle phone check-ins.
- `#coordination`: The plan should be posted only after the coordinator approves it.

## Presenter Notes

- Keep the Slack zoom level readable and avoid exposing browser tabs or terminal windows with private data.
- Do not show `.env`, token setup screens, or live Slack configuration.
- If a live external service is unavailable, say: "The workflow is fallback-safe, so SentinelSwarm can still produce an explainable plan from seeded context and local fixtures."
- If Zone A fallback context looks thinner than live seeded Slack context, switch to the Zone B backup path for the cleanest recording.
