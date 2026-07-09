# Judge Q&A

## Is SentinelSwarm autonomous?

No. It recommends and organizes. A human coordinator must approve the plan and then click a separate button before anything is posted to `#coordination`.

## Where does Real-Time Search appear?

The app attempts `assistant.search.context` from the `app_mention` event. The Incident Control Room status line shows whether context came from Real-Time Search, Slack channel scan fallback, or local mock data.

## Why use an app mention instead of background monitoring?

Bot-token RTS calls require an `action_token`, which is available on user-initiated events such as `app_mention`. This keeps the demo reliable and aligned with Slack's interaction model.

## What happens if Real-Time Search fails?

The app tries live Slack channel scan next, then falls back to `src/data/mockContext.json` if no live context is available. The Incident Control Room labels whether evidence came from RTS, live Slack channel context, or demo fallback context.

## How do you prove it is not hardcoded?

After the first Incident Control Room appears, add or edit a route update in Slack and click `Refresh Analysis`. SentinelSwarm rebuilds the plan from the original incident report plus latest Slack context, resets the plan to draft, and requires human approval again.

## What happens if weather, flood, or LLM calls fail?

Weather and flood use local mock files. LLM refinement is optional and falls back to the deterministic planner after one schema-repair attempt. The approval workflow still works.

## Is the flood data authoritative?

No. Weather and flood values are decision-support signals. The Slack card includes a disclaimer that SentinelSwarm is not emergency authority.

## What makes it Slack-native?

The workflow starts from an app mention, retrieves Slack context, renders Block Kit, uses Slack buttons for approval, and posts the final approved plan to `#coordination`.

## Why is the demo focused on Zone B?

The narrow Zone B monsoon flood story makes the three-minute demo clear: workspace chaos, search context, risk signals, extraction, ranking, matching, approval, and final coordination post.

## What should judges look for in the demo?

- Evidence snippets from Slack context.
- Visible RTS/weather/flood/planner statuses.
- Refresh Analysis updating route guidance after Slack context changes.
- A blocked route and an open route.
- Shelter, supply, and volunteer matches.
- Human approval before final posting.

## What is future work?

Multi-zone dashboards, richer handover exports, real deployment admin controls, and optional MCP resources after the core Slack workflow is stable.
