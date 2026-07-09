import type { WebClient } from "@slack/web-api";
import type { IncidentPlan } from "../planner/schema";

const cap = (text: string, limit = 240): string => (text.length > limit ? `${text.slice(0, limit - 3)}...` : text);

export const formatCoordinationPost = (plan: IncidentPlan, approvedBy: string): string => {
  const ownerTasks = plan.incidents
    .slice(0, 4)
    .map((incident) => `- ${cap(incident.recommendedOwner, 80)}: ${cap(incident.title, 110)}. ${cap(incident.summary, 180)}`)
    .join("\n");
  const actions = plan.recommendedActions.map((action, index) => `${index + 1}. ${cap(action)}`).join("\n");
  const routes = plan.routeActions
    .slice(0, 4)
    .map((route) => {
      const label = route.status === "blocked" ? "AVOID" : route.status === "caution" ? "USE WITH CAUTION" : "USE";
      return `- ${label} ${cap(route.routeName, 80)}: ${cap(route.recommendation)}`;
    })
    .join("\n");
  const assignments = plan.resourceMatches
    .slice(0, 5)
    .map((match) => `- ${match.type.toUpperCase()} ${cap(match.name, 80)}: ${cap(match.recommendation)}`)
    .join("\n");
  const why = plan.evidence
    .slice(0, 3)
    .map((item) => `- ${item.channel}: ${cap(item.text, 150)}`)
    .join("\n");

  return [
    `*SentinelSwarm approved dispatch handoff for ${plan.zoneName}*`,
    `*Approved by:* ${approvedBy}`,
    `*Severity:* ${plan.severity.toUpperCase()} | *Confidence:* ${Math.round(plan.confidence * 100)}%`,
    "*Next review:* Reassess within 30 minutes or immediately after any route, shelter, or rescue update.",
    "",
    "*Owner tasks:*",
    ownerTasks,
    "",
    "*Recommended actions:*",
    actions,
    "",
    "*Assignments and resources:*",
    assignments,
    "",
    "*Route instructions:*",
    routes,
    "",
    "*Evidence checked:*",
    why,
    "",
    "_Decision support summary. Field coordinators remain responsible for final dispatch judgment._"
  ].join("\n");
};

export const postPlanToCoordination = async (client: WebClient, channel: string, plan: IncidentPlan, approvedBy: string): Promise<void> => {
  await client.chat.postMessage({
    channel,
    text: formatCoordinationPost(plan, approvedBy)
  });
};
