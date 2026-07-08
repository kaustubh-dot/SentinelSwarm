import { z } from "zod";

export const SourceModeSchema = z.enum(["rts", "mock", "local", "live", "deterministic", "llm", "unavailable"]);

export const EvidenceSchema = z.object({
  id: z.string(),
  source: z.string(),
  channel: z.string(),
  text: z.string(),
  permalink: z.string().optional(),
  confidence: z.number().min(0).max(1),
  sourceType: z.enum(["rts", "mock", "local"])
});

export const SeveritySchema = z.enum(["low", "moderate", "high", "critical"]);

export const IncidentSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: SeveritySchema,
  summary: z.string(),
  evidenceIds: z.array(z.string()),
  recommendedOwner: z.string()
});

export const RouteActionSchema = z.object({
  routeId: z.string(),
  routeName: z.string(),
  status: z.enum(["open", "caution", "blocked"]),
  recommendation: z.string()
});

export const ResourceMatchSchema = z.object({
  type: z.enum(["volunteer", "supply", "shelter"]),
  name: z.string(),
  recommendation: z.string()
});

export const RiskSignalSchema = z.object({
  label: z.string(),
  summary: z.string(),
  source: z.enum(["live", "mock"]),
  scoreImpact: z.number()
});

export const IncidentPlanSchema = z.object({
  planId: z.string(),
  zoneId: z.string(),
  zoneName: z.string(),
  generatedAt: z.string(),
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  severity: SeveritySchema,
  statuses: z.object({
    context: SourceModeSchema,
    weather: SourceModeSchema,
    flood: SourceModeSchema,
    planner: SourceModeSchema
  }),
  evidence: z.array(EvidenceSchema),
  riskSignals: z.array(RiskSignalSchema),
  incidents: z.array(IncidentSchema),
  routeActions: z.array(RouteActionSchema),
  resourceMatches: z.array(ResourceMatchSchema),
  recommendedActions: z.array(z.string()),
  handover: z.string()
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type IncidentPlan = z.infer<typeof IncidentPlanSchema>;
export type RiskSignal = z.infer<typeof RiskSignalSchema>;
export type Severity = z.infer<typeof SeveritySchema>;
