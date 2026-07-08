import type { WebClient } from "@slack/web-api";
import type { IncidentPlan } from "../planner/schema";

export const formatCoordinationPost = (plan: IncidentPlan, approvedBy: string): string => {
  const actions = plan.recommendedActions.map((action, index) => `${index + 1}. ${action}`).join("\n");
  const routes = plan.routeActions
    .slice(0, 4)
    .map((route) => `- ${route.routeName}: ${route.status.toUpperCase()} - ${route.recommendation}`)
    .join("\n");
  const assignments = plan.resourceMatches
    .slice(0, 5)
    .map((match) => `- ${match.type.toUpperCase()} ${match.name}: ${match.recommendation}`)
    .join("\n");
  const why = plan.evidence
    .slice(0, 3)
    .map((item) => `- ${item.channel}: ${item.text.length > 150 ? `${item.text.slice(0, 147)}...` : item.text}`)
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
