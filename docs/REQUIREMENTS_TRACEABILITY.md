# Requirements Traceability

## Hackathon Requirements

| Requirement | SentinelSwarm Response | Evidence/Artifact |
| --- | --- | --- |
| Use at least one required technology: Slack AI, MCP, or Real-Time Search API | Uses Real-Time Search API through `assistant.search.context` | `src/slack/rts.ts`, demo status badge, README |
| Fit one track | Submit under Slack Agent for Good | Devpost track field |
| Address social impact | Disaster-response coordination for floods, landslides, and local emergencies | Devpost impact section, `docs/PROJECT_PLAN.md` |
| Run consistently as shown | Vertical slice has deterministic fallback for every external dependency | tests, fallback demo mode, `docs/TECH_RISK_REGISTER.md` |
| Demo video under 3 minutes | Scripted 2:45-2:55 demo with one clean flow | `docs/DEMO_SCRIPT.md` |
| Architecture diagram | Mermaid diagram plus export-ready screenshot | `docs/ARCHITECTURE.md` |
| Slack developer sandbox URL | Provide sandbox workspace URL and invite judges | `docs/SUBMISSION_CHECKLIST.md` |
| Judge access | Add `slackhack@salesforce.com` and `testing@devpost.com` | sandbox checklist |
| No confidential or sensitive information | Use fictional seeded crisis data only | seeded data review checklist |

## Judging Criteria

| Judging Criterion | Feature Strategy | Proof In Demo |
| --- | --- | --- |
| Technological Implementation | RTS retrieval, fallback planner, Zod validation, modular TypeScript, tests | source status indicators and test output |
| Design | Slack-native Block Kit Incident Control Room with approval buttons | polished threaded Slack card |
| Potential Impact | Crisis coordination, social-good framing, resource matching | final impact close in video |
| Quality of Idea | Moves beyond chatbot to evidence-linked, human-approved response workflow | analyze -> approve -> coordinate loop |

## Slack RTS Requirements

| RTS Detail | Implementation Decision | Risk Control |
| --- | --- | --- |
| `assistant.search.context` searches Slack context | Wrap in `src/slack/rts.ts` | one narrow query builder |
| Bot-token calls require `action_token` | Trigger demo from `app_mention` | no background RTS dependency |
| `app_mention` can include `action_token` | Extract token from event payload | fallback if missing |
| Minimum public search scope is `search:read.public` | Request only needed scopes first | verify scopes in Slack app setup |
| RTS available for internal/directory-published apps | Treat hackathon sandbox app as internal; verify early | fallback does not depend on RTS |
| Semantic search may depend on Slack AI Search | Use keyword-friendly queries that still work without semantic search | search `Zone B flood shelter route volunteer supplies` |

## Submission Artifacts

| Submission Item | Owner File | Done When |
| --- | --- | --- |
| Project title | Devpost form | "SentinelSwarm" entered |
| Track | Devpost form | Slack Agent for Good selected |
| Short description | README and Devpost copy | Clear one-paragraph pitch |
| Feature description | README and Devpost copy | Mentions RTS, evidence, resource matching, approval |
| Social impact | Devpost impact field | Explains disaster response and human approval |
| Demo video | `docs/DEMO_SCRIPT.md` | Public link, under 3 minutes, working project footage |
| Architecture diagram | `docs/ARCHITECTURE.md` | Mermaid diagram exported or screenshotted |
| Slack sandbox URL | Devpost form | URL works for invited judges |
| Judge access | Slack workspace | Both required emails invited before deadline |
| Testing instructions | README | Exact command and Slack mention included |

## Roadblock Controls

| Roadblock | Preventive Requirement |
| --- | --- |
| RTS blocked by scopes or missing `action_token` | Build local fallback before RTS integration |
| Open-Meteo unavailable | Mock weather/flood JSON used automatically |
| LLM fails or returns invalid JSON | Deterministic planner is the primary MVP planner |
| Slack buttons do not fire | Button handlers tested before final UI polish |
| `#coordination` channel missing | Resolve channel ID from env and show setup error |
| Demo data too thin | Seed every channel with exact script messages |
| Time runs out | Do not add new APIs after the vertical slice works |
| MCP distracts from core demo | Treat MCP as optional only after RTS + approval flow works |

## Recommended Technology Stance

Use RTS as the primary required technology. Do not make MCP part of the critical path.

If MCP is added later, it should connect a small external crisis-resource tool, not Slack itself. Good candidates are:

- `get_zone_resource_status`.
- `get_shelter_capacity`.
- `get_supply_inventory`.
- `get_weather_risk_snapshot`.

Those tools can wrap local JSON and Open-Meteo data. This gives a clean MCP story without risking Slack auth duplication.
