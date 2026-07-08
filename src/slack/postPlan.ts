import type { WebClient } from "@slack/web-api";
import type { IncidentPlan } from "../planner/schema";

const cap = (text: string, limit = 240): string => (text.length > limit ? `${text.slice(0, limit - 3)}...` : text);

export const formatCoordinationPost = (plan: IncidentPlan, approvedBy: string): string => {
  const actions = plan.recommendedActions.map((action, index) => `${index + 1}. ${cap(action)}`).join("\n");
  const routes = plan.routeActions
    .slice(0, 4)
    .map((route) => `- ${cap(route.routeName, 80)}: ${route.status.toUpperCase()} - ${cap(route.recommendation)}`)
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
    `*SentinelSwarm approved plan for ${plan.zoneName}*`,
    `*Approved by:* ${approvedBy}`,
    `*Severity:* ${plan.severity.toUpperCase()} | *Confidence:* ${Math.round(plan.confidence * 100)}%`,
    "",
    "*Why:*",
    why,
    "",
    "*Recommended actions:*",
    actions,
    "",
    "*Assignments and resources:*",
    assignments,
    "",
    "*Route guidance:*",
    routes,
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
