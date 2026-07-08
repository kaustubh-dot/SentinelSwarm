import type { PlannerInput } from "./fallbackPlanner";
import type { IncidentPlan } from "./schema";

const compact = (value: unknown): string => JSON.stringify(value, null, 2);

const redactSlackText = (text: string): string =>
  text
    .replace(/<@U[A-Z0-9]+>/g, "@slack-user")
    .replace(/<#C[A-Z0-9]+(?:\|([^>]+))?>/g, (_match, channelName: string | undefined) => (channelName ? `#${channelName}` : "#slack-channel"))
    .replace(/https?:\/\/\S+/g, "[link-redacted]");

const evidenceForLlm = (plan: IncidentPlan) =>
  plan.evidence.map((item) => ({
    id: item.id,
    source: item.source,
    sourceType: item.sourceType,
    channel: item.sourceType === "mock" ? item.channel : "Slack evidence channel",
    text: redactSlackText(item.text),
    confidence: item.confidence
  }));

export const buildPlannerRefinementPrompt = (input: PlannerInput, deterministicPlan: IncidentPlan, repairHint?: string): string => {
  const repair = repairHint
    ? `\nThe previous response failed validation. Fix only the JSON shape and keep all recommendations grounded in the supplied evidence. Validation error: ${repairHint}\n`
    : "";

  return `You refine a Slack-native crisis coordination plan for SentinelSwarm.

Rules:
- Return only valid JSON. No Markdown.
- This is decision support, not emergency authority.
- Do not invent evidence, channels, Slack links, volunteers, shelters, supplies, or routes.
- Keep the same operational facts, but improve clarity, prioritization, and human-action wording.
- Keep recommendations concise enough for Slack Block Kit.
- Use the provided evidence IDs when referencing incidents.

Return a JSON object with exactly these fields:
- summary: string
- confidence: number from 0 to 1
- severity: one of "low", "moderate", "high", "critical"
- incidents: array of { id, title, severity, summary, evidenceIds, recommendedOwner }
- routeActions: array of { routeId, routeName, status, recommendation }
- resourceMatches: array of { type, name, recommendation }
- recommendedActions: array of strings
- handover: string

Zone:
${compact(input.zone)}

Incident report:
${compact(input.incident ?? null)}

Evidence:
${compact(evidenceForLlm(deterministicPlan))}

Weather and flood signals:
${compact(deterministicPlan.riskSignals)}

Available deterministic draft:
${compact({
  summary: deterministicPlan.summary,
  confidence: deterministicPlan.confidence,
  severity: deterministicPlan.severity,
  incidents: deterministicPlan.incidents,
  routeActions: deterministicPlan.routeActions,
  resourceMatches: deterministicPlan.resourceMatches,
  recommendedActions: deterministicPlan.recommendedActions,
  handover: deterministicPlan.handover
})}
${repair}`;
};
