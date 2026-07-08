# Devpost Submission Draft

## Project Title

SentinelSwarm

## One-Line Summary

SentinelSwarm is a Slack-native crisis coordination agent that turns scattered flood-response updates into an evidence-linked, human-approved action plan.

## Elevator Pitch

During a flood response, critical information often lives in separate Slack channels: field reports, blocked routes, shelter capacity, supply availability, alerts, and volunteer updates. SentinelSwarm turns that scattered context into an Incident Control Room inside Slack. It gives coordinators a structured plan with evidence, route/shelter/resource matches, fallback status indicators, and a human approval step before the final plan is posted to `#coordination`.

SentinelSwarm is a decision-support agent, not an autonomous emergency dispatcher.

## Problem

Small disaster-response teams, campus safety groups, NGOs, and mutual-aid organizers often coordinate under time pressure with limited tooling. The right information may exist, but it is spread across channels and is hard to synthesize quickly. A coordinator needs to know what happened, which route is blocked, which shelter can receive people, which supplies are ready, and who can help without losing minutes searching message history.

## Solution

SentinelSwarm keeps the response workflow inside Slack. A coordinator mentions the app from a field report, and SentinelSwarm builds a structured Incident Control Room with:

- Severity and confidence indicators.
- Evidence from Slack context or seeded fallback context.
- Route recommendations, including blocked-route warnings.
- Shelter, supply, and volunteer matches.
- Recommended actions for the coordinator to review.
- Human approval before posting to `#coordination`.
- Handover summary support for shift changes.

The system keeps humans in control while reducing time lost searching across channels.

## How It Works

1. Demo channels receive fictional flood-response updates.
2. A coordinator mentions `@SentinelSwarm analyze Zone A risk` or `@SentinelSwarm analyze Zone B risk`.
3. The Slack app receives the event through Bolt and Socket Mode.
4. The app attempts Slack Real-Time Search when context is available, with seeded fallback context for demos.
5. Local resource fixtures provide known routes, shelters, volunteers, and supplies.
6. Weather and flood adapters use live or mock risk signals.
7. A deterministic planner generates a validated incident plan.
8. Block Kit renders the Incident Control Room in Slack.
9. A human coordinator approves the plan.
10. The approved plan can be posted to `#coordination`.

## How We Built It

We built SentinelSwarm with TypeScript, Slack Bolt for JavaScript, Socket Mode, Block Kit, Zod validation, local JSON resource fixtures, and Vitest tests. The core planner is deterministic so the demo does not depend on an LLM being available. Real-Time Search, weather, and flood signals are treated as adapters with explicit fallback behavior, which makes the system easier to test and safer to demo.

## How We Use Slack

Slack is the product surface, not just a notification target. SentinelSwarm uses Slack channels as the operational record, Slack app mentions as the trigger, Slack context as evidence, Block Kit as the Incident Control Room UI, button interactivity for approval, and `#coordination` as the place where approved plans become shared team context.

The app is designed around Slack-native response behavior: responders already post updates in channels, coordinators already scan threads, and final decisions need to be visible to the team.

## Social Impact

SentinelSwarm targets teams that coordinate local response but may not have enterprise emergency-management software: NGOs, student safety teams, neighborhood volunteers, and mutual-aid groups. By turning scattered messages into a traceable plan, it can reduce duplicated work, make handoffs clearer, and help coordinators notice route, shelter, supply, and volunteer constraints sooner.

The goal is not to replace trained emergency services. The goal is to help human coordinators make faster, better-organized decisions with the information they already have.

## Technical Architecture

SentinelSwarm is a Slack Socket Mode app. Bolt receives app mentions and button actions. The handler parses the requested zone, searches Slack context when possible, loads local operational data, gets weather/flood risk signals, and sends everything to the deterministic planner. The plan is validated with Zod, rendered as Block Kit, approved by a human, and then posted to `#coordination`.

Key components:

- Slack Bolt + Socket Mode event handler.
- Real-Time Search wrapper with fallback evidence.
- Local JSON fixtures for zones, routes, shelters, supplies, and volunteers.
- Weather and flood adapters with mock fallback data.
- Deterministic planner and severity scoring.
- Block Kit Incident Control Room.
- Approval and final coordination-post actions.

## Roadblock-Safe Fallbacks

The demo is designed to degrade gracefully: when live context is unavailable, the deterministic fallback planner still produces a complete, explainable plan.

- Real-Time Search unavailable: use seeded mock context.
- Weather unavailable: use mock weather data.
- Flood signal unavailable: use mock flood data.
- LLM unavailable or not configured: use the deterministic planner.
- Coordination posting not configured: keep the plan visible in thread until setup is complete.

## Challenges We Ran Into

- Designing a workflow that feels Slack-native instead of a generic chatbot.
- Keeping the plan evidence-linked while preserving a fast demo path.
- Making fallback behavior visible and honest instead of hiding failures.
- Balancing social-impact ambition with safety language around decision support.
- Creating a polished demo without relying on real disaster data or private information.

## Accomplishments

- Built a working Slack app flow from mention to Incident Control Room.
- Added human approval before the plan can be posted to coordination.
- Created deterministic planning and test coverage for the core response plan.
- Added fallback paths for context, weather, flood, and planning.
- Prepared a complete fictional demo world, video script, architecture diagram, and judge Q&A.

## What We Learned

Good crisis tooling is not just about generating text. The important part is turning messy team context into a shared, reviewable decision surface. We also learned that fallbacks are not only useful for demos; they make the system more understandable because every recommendation can show where its context came from.

## What Is Next

- Strengthen the natural-language incident parser for richer Zone A and Zone B extraction.
- Persist plan state outside memory for longer-running operations.
- Add role-based approval and audit history.
- Expand scenario fixtures for landslides, heat response, and campus safety.
- Evaluate richer LLM planning only after deterministic safety checks stay in place.
- Explore MCP only as an optional external-resource layer if the Slack demo remains stable.

## Built With

- Slack Bolt for JavaScript
- Slack Socket Mode
- Slack Real-Time Search or fallback evidence
- Slack Block Kit
- TypeScript
- Zod
- Vitest
- Local fictional response fixtures

## Demo Video Notes

Target length: 2:45 to 3:00.

Show the seeded Slack channels, trigger SentinelSwarm from `#field-reports`, point out the evidence ledger and fallback indicators, click Approve Plan, post to `#coordination`, and close with the social-impact framing: Slack-native, evidence-linked, human-approved, and fallback-safe.
