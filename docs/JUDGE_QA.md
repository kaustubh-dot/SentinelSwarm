# Judge QA

## What makes this different from ChatGPT in Slack?

SentinelSwarm is workflow-specific. It does not just answer a question; it pulls together field reports, routes, shelters, volunteers, and supplies into a structured Incident Control Room with evidence and approval steps. The coordinator can approve and publish a final plan back into Slack, so the output becomes part of the team's operational workflow.

## How does SentinelSwarm use Slack-specific capabilities?

Slack is the main interface for the product. The app uses Slack channels as the evidence source, app mentions as the trigger, Block Kit for the Incident Control Room, button actions for approval, and `#coordination` for the final approved plan. Real-Time Search is used when available, with clearly labeled fallback context for demo reliability.

## Why is human approval required?

Flood response decisions can affect people's safety, so SentinelSwarm should not act as an autonomous dispatcher. The app produces decision support and makes the recommendation reviewable. A human coordinator must approve before the plan can be posted as an action plan.

## What happens if Real-Time Search or external APIs fail?

SentinelSwarm degrades gracefully. If Real-Time Search is unavailable, it uses seeded mock context; if weather or flood APIs fail, it uses mock risk data; if an LLM is unavailable, it uses the deterministic planner. The response includes status indicators so judges and coordinators can see which sources were used.

## Who would use this?

The target users are small disaster-response teams, NGOs, campus safety teams, and mutual-aid coordinators that already use Slack. These teams often need to coordinate routes, volunteers, shelter capacity, and supplies without a dedicated emergency-management platform. SentinelSwarm helps them organize what is already in their channels.

## What is the social impact?

During local crises, minutes can be lost searching across messages and reconfirming basic facts. SentinelSwarm reduces that coordination overhead by turning scattered updates into a shared, evidence-linked plan. It can make handoffs clearer, reduce duplicated work, and help coordinators notice route and shelter constraints sooner.

## How would this scale beyond the demo?

The next step is persistent plan state, stronger role-based approvals, richer incident parsing, and more scenario fixtures. Larger teams would also need audit logs, channel permissions, data retention settings, and integrations with trusted internal resource systems. Those are future work items, not claims of the current hackathon MVP.

## What are the safety limitations?

SentinelSwarm is decision support only. It does not replace trained emergency services, certified flood forecasting, or local incident command. The current demo uses fictional data, local fixtures, and fallback signals, so production use would require security review, reliability testing, and clear operational governance.

## What did the team build during the hackathon?

The team built a Slack Bolt app that responds to mentions, gathers context or fallback evidence, combines it with local resource data and risk signals, creates a validated incident plan, renders an Incident Control Room in Block Kit, and supports human approval before posting to coordination. The repo also includes tests for key planner and Block Kit behavior plus judge-facing demo materials.

## What would you add next?

We would add a stronger natural-language incident parser, persistent plan storage, approval roles, audit history, expanded scenario fixtures, and richer live data adapters. We would also harden Slack setup, permissions, and observability before any real-world pilot. MCP could be explored later as an optional way to expose trusted external resources, but it is not required for the current core demo.

## Why keep fallback behavior visible?

In crisis tooling, hidden failures are dangerous. SentinelSwarm shows whether it used Real-Time Search, fallback context, live weather, mock weather, live flood, mock flood, or deterministic planning. That makes the demo more reliable and the recommendation easier to trust.

## Why is the output called an Incident Control Room?

The name signals that the output is a coordination surface, not just prose. It groups evidence, severity, routes, resources, recommendations, approval state, and handover support in one Slack thread. That framing helps judges see the workflow value beyond a chatbot response.
