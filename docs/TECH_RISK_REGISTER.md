# Technical Risk Register

## Risk Summary

The main risk is not building the wrong feature. The main risk is depending on live Slack, LLM, or weather behavior before a deterministic demo exists.

Build order must protect the demo first:

1. Slack setup and manifest spike.
2. Local planner and mocked context.
3. Slack app mention and Block Kit.
4. Approval buttons.
5. Coordination post.
6. RTS integration.
7. Weather/flood live tools.
8. Optional LLM planner.
9. Optional MCP server only after the core demo works.

## Register

| Risk | Symptom | Impact | Prevention | Fallback |
| --- | --- | --- | --- | --- |
| RTS missing `action_token` | `assistant.search.context` returns auth or token error | Required tech is fragile in demo | Use `app_mention` as the main trigger and log whether token exists | Use `mockContext.json` as the guaranteed fallback; enrich with live Slack channel scan when available |
| RTS scopes incomplete | Search returns missing scope or empty results | Live context unavailable | Request `search:read.public`, `app_mentions:read`, `chat:write`, and verify RTS-specific setup early | Use seeded context JSON; optional live Slack scan can add evidence when channel access works |
| RTS unavailable for app type | Slack app cannot call RTS in sandbox/config | Could threaten required-tech proof | Confirm app is internal and AI-enabled; document RTS attempt and status | Keep RTS code path implemented and visibly attempted; use fallback for demo |
| Semantic search not enabled | Natural-language query returns poor results | Less impressive retrieval | Use keyword-rich queries and `disable_semantic_search` toggle if needed | Search seeded mock records by zone and incident terms |
| Slack app not receiving mentions | Bot stays silent | Demo blocked | Enable Socket Mode, subscribe to `app_mention`, invite bot to channels | Add `/sentinel` later only if needed; keep local CLI test for planner |
| Buttons not firing | Approve/Post clicks do nothing | Approval flow broken | Enable interactivity, use stable action IDs, acknowledge every action quickly | Provide text-only fallback command `@SentinelSwarm post approved plan` if time allows |
| Missing channel IDs | Final post fails | Demo end blocked | Use env var `SLACK_COORDINATION_CHANNEL_ID`; validate at startup | Reply with setup hint and keep approved plan in thread |
| Open-Meteo weather failure | Fetch timeout or bad response | Live risk signal missing | Short timeout, narrow request, schema guard | `mockWeather.json` |
| Open-Meteo flood mismatch | Closest river data irrelevant for zone | Bad credibility | Treat flood as signal, not truth; show confidence | `mockFlood.json` with fictional zone-specific values |
| LLM unavailable | Missing key, quota, model issue | Planner blocked if overused | Build deterministic fallback planner first | Use deterministic planner as default demo mode |
| Invalid LLM JSON | Zod validation fails | Block Kit could crash | Validate and retry once with repair prompt | Use deterministic planner |
| Block Kit too large | Slack rejects message | Demo card fails | Keep sections concise; cap evidence and incidents | Send compact version with link-style evidence labels |
| TypeScript or test churn | Build breaks late | Time sink | Keep small modules and add tests incrementally | Freeze feature scope after vertical slice |
| Deployment runtime failure | App works locally but not in demo | Judge testing risk | Use Socket Mode local run for video and document exact setup | Provide fallback video proof and sandbox access |
| Secret leakage | Tokens appear in repo/video | Disqualification/security issue | `.env.example` only; never record token screens | Rotate token if exposed |
| Sensitive crisis data | Demo includes real PII | Submission issue | Fictional seeded data only | Review seed data before recording |
| Time deadline | Polish consumes build time | Incomplete submission | Lock scope after approval flow works | Submit with deterministic demo if live RTS/LLM fails |
| MCP overreach | Time goes into protocol/auth instead of demo flow | Core demo incomplete | Keep MCP out of the first milestone | Add only a tiny local-resource MCP server if time remains |

## Highest Priority Checks

Run these before adding nonessential features:

1. Can the app start in Socket Mode?
2. Does `@SentinelSwarm ping` reply?
3. Does `@SentinelSwarm analyze Zone B risk` return a card using only local data?
4. Do Approve Plan and Post to Coordination work?
5. Does RTS attempt run and fail gracefully?
6. Does the final plan remain credible with every external dependency disabled?
7. Does the Evidence Ledger clearly show where the plan came from?

## Decision Log

- Chosen track: Slack Agent for Good.
- Chosen required technology: Real-Time Search API.
- Chosen trigger: `app_mention`, because bot-token RTS requires `action_token`.
- Chosen runtime: Node.js + TypeScript + Bolt JS + Socket Mode.
- Chosen demo domain: flood/landslide/crisis response.
- Chosen external data: Open-Meteo weather/flood with mocks.
- Chosen reliability strategy: deterministic planner first, LLM optional.
- Chosen MCP strategy: do not connect Slack as MCP initially; add a tiny external-resource MCP server only if the core demo is already stable.
