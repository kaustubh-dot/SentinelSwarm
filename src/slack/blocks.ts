import type { IncidentPlan } from "../planner/schema";

type RenderOptions = {
  state?: "draft" | "approved" | "posted";
  approvedBy?: string;
  refreshCount?: number;
  lastRefreshedAt?: string;
};

const cap = (text: string, limit = 280): string => (text.length > limit ? `${text.slice(0, limit - 3)}...` : text);

const evidenceLabel = (sourceType: IncidentPlan["evidence"][number]["sourceType"]): string => {
  switch (sourceType) {
    case "rts":
      return "RTS";
    case "slack":
      return "Slack";
    case "mock":
      return "Fallback";
    default:
      return "Local";
  }
};

const statusLine = (plan: IncidentPlan): string => {
  const context =
    plan.statuses.context === "rts"
      ? "Evidence source: Slack Real-Time Search"
      : plan.statuses.context === "slack"
        ? "Evidence source: Live Slack channel context"
        : "Evidence source: Demo fallback context";
  const weather = plan.statuses.weather === "live" ? "Live weather" : "Mock weather";
  const flood = plan.statuses.flood === "live" ? "Live flood signal" : "Mock flood signal";
  const planner = plan.statuses.planner === "llm" ? "LLM-refined planner" : "Deterministic planner";
  return `${context} | ${weather} | ${flood} | ${planner}`;
};

export const renderIncidentControlRoom = (plan: IncidentPlan, options: RenderOptions = {}): any[] => {
  const refreshCount = options.refreshCount ?? 0;
  const stateText =
    options.state === "approved"
      ? `Approved by ${options.approvedBy ?? "coordinator"}`
      : options.state === "posted"
        ? "Posted to #coordination"
        : refreshCount > 0
          ? "Updated after refresh. Awaiting human approval"
        : "Awaiting human approval";
  const refreshText =
    refreshCount > 0
      ? `\n*Refresh:* ${refreshCount} update${refreshCount === 1 ? "" : "s"}${options.lastRefreshedAt ? `, last ${options.lastRefreshedAt}` : ""}`
      : "";

  const evidenceText = plan.evidence
    .slice(0, 4)
    .map((item, index) => {
      const source = item.permalink && item.sourceType !== "mock" ? `<${item.permalink}|${item.channel}>` : item.channel;
      return `${index + 1}. *${evidenceLabel(item.sourceType)}* ${source}: ${cap(item.text, 150)}`;
    })
    .join("\n");

  const signalsText = plan.riskSignals
    .map((signal) => `*${signal.label}* (${signal.source}): ${cap(signal.summary, 170)}`)
    .join("\n");

  const incidentsText = plan.incidents
    .map((incident) => `*${incident.severity.toUpperCase()}* ${cap(incident.title, 80)}: ${cap(incident.summary, 220)}`)
    .join("\n");

  const routeText = plan.routeActions
    .slice(0, 4)
    .map((route) => `*${route.status.toUpperCase()}* ${cap(route.routeName, 80)}: ${cap(route.recommendation, 180)}`)
    .join("\n");

  const resourcesText = plan.resourceMatches
    .slice(0, 6)
    .map((match) => `*${match.type}* ${cap(match.name, 80)}: ${cap(match.recommendation, 160)}`)
    .join("\n");

  const actionsText = plan.recommendedActions.map((action, index) => `${index + 1}. ${cap(action, 220)}`).join("\n");

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `Incident Control Room: ${plan.zoneName}`,
        emoji: false
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Severity:* ${plan.severity.toUpperCase()} | *Confidence:* ${Math.round(plan.confidence * 100)}%\n*Status:* ${stateText}${refreshText}\n${statusLine(plan)}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Risk Summary*\n${cap(plan.summary, 650)}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*External Signals*\n${signalsText || "No weather or flood signal available."}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Evidence Ledger*\n${evidenceText || "No evidence found. Use fallback seeded context before demo."}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Priority Incident*\n${incidentsText}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Routes*\n${routeText}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Resource Matches*\n${resourcesText}`
      }
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Recommended Plan*\n${actionsText}`
      }
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Decision support only. A human coordinator must approve before assignments are posted."
        }
      ]
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Approve Plan",
            emoji: false
          },
          style: "primary",
          action_id: "approve_plan",
          value: plan.planId
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Post to Coordination",
            emoji: false
          },
          action_id: "post_plan",
          value: plan.planId
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Refresh Analysis",
            emoji: false
          },
          action_id: "refresh_plan",
          value: plan.planId
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Generate Handover",
            emoji: false
          },
          action_id: "generate_handover",
          value: plan.planId
        }
      ]
    }
  ];
};
