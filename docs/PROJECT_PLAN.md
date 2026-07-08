# SentinelSwarm Project Plan

## Summary

SentinelSwarm is a Slack-native crisis coordination agent for the Slack Agent Builder Challenge, submitted under the Slack Agent for Good track.

The app helps flood, landslide, and local emergency response teams turn noisy Slack updates into a verified, prioritized, human-approved action plan. The winning demo path is intentionally narrow: monsoon flood response in Zone B for a campus, NGO, or volunteer team; one app mention; one polished Incident Control Room; one approval flow; and one final coordination post.

## Verified Hackathon Context

- Hackathon: Slack Agent Builder Challenge.
- Deadline: July 13, 2026 at 5:00pm PDT, which is July 14, 2026 at 5:30am IST.
- Track: Slack Agent for Good.
- Required technology: at least one of Slack AI capabilities, MCP server integration, or Real-Time Search API.
- Chosen required technology: Real-Time Search API via `assistant.search.context`.
- Required submission artifacts: track, feature/functionality description, social impact explanation, demo video under 3 minutes, architecture diagram, Slack developer sandbox URL, and judge access for `slackhack@salesforce.com` and `testing@devpost.com`.

Source references:

- https://slackhack.devpost.com/
- https://slackhack.devpost.com/rules
- https://docs.slack.dev/apis/web-api/real-time-search-api/
- https://docs.slack.dev/reference/methods/assistant.search.context/

## Target Users

- NGO incident response coordinators.
- Student safety and campus emergency teams.
- Mutual-aid dispatch groups.
- Local volunteer coordinators.
- Field operations leads working from Slack during weather emergencies.

## Problem Statement

During floods, landslides, and neighborhood emergencies, the most important information arrives as scattered human updates:

- A blocked road in one channel.
- A volunteer availability message in another.
- A shelter request buried in a thread.
- A supply update posted hours earlier.
- Weather or river risk changing outside Slack.

Teams lose time manually searching, verifying, deduplicating, and deciding what to do. SentinelSwarm reduces that coordination drag without pretending to replace human authority.

## Product Positioning

Do not pitch SentinelSwarm as "an AI disaster chatbot."

Pitch it as:

```txt
A Slack-native incident control room that searches live workspace context, finds conflicting reports, matches resources, and requires human approval before action.
```

The strongest demo identity is "Monsoon flood response in Zone B." Floods and landslides can remain in the broader story, but the recorded demo should focus on one specific emergency so judges instantly understand the workflow.

## Social Impact

SentinelSwarm addresses disaster-response coordination, a real public safety and nonprofit operations problem. It can help small teams triage reports faster, reduce duplicated volunteer work, surface evidence, match resources to needs, and make the approval chain explicit.

The app should be framed as decision support for trained humans, not emergency authority. The social-impact story is strongest when the demo shows minutes saved, clearer handoffs, and safer resource allocation during a fast-moving local crisis.

## Final MVP Scope

The MVP must support this end-to-end flow:

1. Seed Slack channels contain field reports, volunteer availability, supply notes, route status, shelter status, and alerts.
2. A user types `@SentinelSwarm analyze Zone B risk`.
3. The app receives an `app_mention` event and extracts the requested zone.
4. The app tries Real-Time Search with the event `action_token`.
5. If RTS fails, the app loads `mockContext.json`.
6. The app loads local JSON data for zones, shelters, routes, supplies, and volunteers.
7. The app fetches Open-Meteo weather/flood signals where available, with mock fallbacks.
8. The app produces a validated plan using the deterministic fallback planner first.
9. Optional LLM planner runs behind an adapter and schema validation.
10. The app renders a Block Kit Incident Control Room with an Evidence Ledger in the thread.
11. A user clicks Approve Plan.
12. A user clicks Post to Coordination.
13. The app posts the approved plan to `#coordination`.

## Non-Goals

- No production Slack Marketplace submission.
- No autonomous dispatch.
- No emergency-service claims.
- No paid-only APIs.
- No Google Maps, WhatsApp, Twitter/X, or complex geospatial integrations.
- No database unless the demo is already stable.
- No sensitive user profiling or sentiment surveillance.
- No broad background monitoring as the main demo path.

## Judging Strategy

Technological Implementation:

- Show RTS as the required Slack technology.
- Make RTS status visible in the UI: "Real-Time Search used" or "Fallback context used."
- Keep code modular, typed, tested, and fallback-safe.
- Surface status indicators showing whether RTS, live weather/flood, LLM, or fallback mode was used.

Design:

- Make Slack the product surface.
- Use Block Kit for an Incident Control Room rather than a generic chatbot reply.
- Include an Evidence Ledger that makes the plan auditable.
- Keep approval buttons clear and human-centered.

Potential Impact:

- Tell a concrete disaster-response story.
- Show evidence links and resource matching.
- Emphasize nonprofit, campus, and mutual-aid use cases.

Quality of Idea:

- Differentiate from a simple summarizer by making it an action workflow: search, verify, prioritize, match, approve, post, hand over.

## Roadblock-Resistant Build Principle

First make it work with mocks.

Then make it work with live APIs.

Then make it look like a winner.

Do not let RTS, LLM, deployment, or external APIs block the demo.

## MCP Decision

Do not connect Slack as MCP for the first implementation milestone.

RTS already satisfies the hackathon technology requirement. MCP is valuable only if the core app is already working and there is enough time to add a small, reliable MCP server for external crisis resources. Adding Slack itself as MCP would duplicate what the Slack app and RTS already do, while increasing authentication and demo risk.
