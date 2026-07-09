import { z } from "zod";
import type { AppConfig } from "../config";
import type { PlannerInput } from "./fallbackPlanner";
import { buildPlannerRefinementPrompt } from "./prompt";
import {
  IncidentSchema,
  ResourceMatchSchema,
  RouteActionSchema,
  SeveritySchema,
  IncidentPlanSchema,
  type IncidentPlan
} from "./schema";

const LlmPlanPatchSchema = z.object({
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  severity: SeveritySchema,
  incidents: z.array(IncidentSchema).min(1).max(4),
  routeActions: z.array(RouteActionSchema).min(1).max(6),
  resourceMatches: z.array(ResourceMatchSchema).min(1).max(8),
  recommendedActions: z.array(z.string().min(1)).min(3).max(8),
  handover: z.string().min(1)
});

type LlmPlanPatch = z.infer<typeof LlmPlanPatchSchema>;

export type LlmPlannerConfig = Pick<AppConfig, "useLlm" | "googleApiKey" | "geminiModel">;

export type LlmRefinementResult = {
  plan: IncidentPlan;
  usedLlm: boolean;
  reason?: string;
};

const timeoutFetch = async (url: string, options: RequestInit, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const parseJsonObject = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM response was not JSON");
    }
    return JSON.parse(match[0]);
  }
};

const geminiGenerateContentUrl = (model: string): string => {
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;
  const encodedModelPath = modelPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `https://generativelanguage.googleapis.com/v1beta/${encodedModelPath}:generateContent`;
};

const geminiText = (payload: unknown): string | undefined => {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const response = payload as {
    output_text?: string;
    outputText?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
  };

  const text =
    response.output_text ??
    response.outputText ??
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => typeof text === "string" && text.length > 0)
      .join("");

  return text && text.length > 0 ? text : undefined;
};

const callGeminiPlanner = async (
  config: LlmPlannerConfig,
  input: PlannerInput,
  deterministicPlan: IncidentPlan,
  repairHint?: string
): Promise<LlmPlanPatch> => {
  const prompt = buildPlannerRefinementPrompt(input, deterministicPlan, repairHint);
  const response = await timeoutFetch(
    geminiGenerateContentUrl(config.geminiModel),
    {
      method: "POST",
      headers: {
        "x-goog-api-key": config.googleApiKey ?? "",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You are SentinelSwarm's emergency coordination planning assistant. Return strict JSON only."
            }
          ]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json"
        }
      })
    },
    6000
  );

  if (!response.ok) {
    throw new Error(`LLM API returned ${response.status}`);
  }

  const payload = await response.json();
  const content = geminiText(payload);
  if (!content) {
    throw new Error("LLM response did not include message content");
  }

  return LlmPlanPatchSchema.parse(parseJsonObject(content));
};

const ensureGroundedPatch = (deterministicPlan: IncidentPlan, patch: LlmPlanPatch): void => {
  const evidenceIds = new Set(deterministicPlan.evidence.map((item) => item.id));
  const incidentsById = new Map(deterministicPlan.incidents.map((incident) => [incident.id, incident]));
  const knownOwners = new Set([
    ...deterministicPlan.incidents.map((incident) => incident.recommendedOwner),
    ...deterministicPlan.resourceMatches.filter((match) => match.type === "volunteer").map((match) => match.name)
  ]);
  const routesById = new Map(deterministicPlan.routeActions.map((route) => [route.routeId, route]));
  const resources = new Set(deterministicPlan.resourceMatches.map((match) => `${match.type}:${match.name}`));

  for (const incident of patch.incidents) {
    const deterministicIncident = incidentsById.get(incident.id);
    if (!deterministicIncident) {
      throw new Error(`LLM patch referenced unknown incident ${incident.id}`);
    }
    const unknownEvidenceId = incident.evidenceIds.find((id) => !evidenceIds.has(id));
    if (unknownEvidenceId) {
      throw new Error(`LLM patch referenced unknown evidence ${unknownEvidenceId}`);
    }
    if (!knownOwners.has(incident.recommendedOwner)) {
      throw new Error(`LLM patch referenced unknown owner ${incident.recommendedOwner}`);
    }
  }

  for (const route of patch.routeActions) {
    const deterministicRoute = routesById.get(route.routeId);
    if (!deterministicRoute) {
      throw new Error(`LLM patch referenced unknown route ${route.routeId}`);
    }
    if (route.routeName !== deterministicRoute.routeName || route.status !== deterministicRoute.status) {
      throw new Error(`LLM patch changed route facts for ${route.routeId}`);
    }
  }

  for (const match of patch.resourceMatches) {
    if (!resources.has(`${match.type}:${match.name}`)) {
      throw new Error(`LLM patch referenced unknown resource ${match.type}:${match.name}`);
    }
  }
};

const mergePatch = (deterministicPlan: IncidentPlan, patch: LlmPlanPatch): IncidentPlan => {
  ensureGroundedPatch(deterministicPlan, patch);

  return IncidentPlanSchema.parse({
    ...deterministicPlan,
    ...patch,
    severity: deterministicPlan.severity,
    confidence: deterministicPlan.confidence,
    statuses: {
      ...deterministicPlan.statuses,
      planner: "llm"
    },
    evidence: deterministicPlan.evidence,
    riskSignals: deterministicPlan.riskSignals
  });
};

export const refinePlanWithLlm = async (
  config: LlmPlannerConfig,
  input: PlannerInput,
  deterministicPlan: IncidentPlan
): Promise<LlmRefinementResult> => {
  if (!config.useLlm) {
    return {
      plan: deterministicPlan,
      usedLlm: false,
      reason: "SENTINEL_USE_LLM=false"
    };
  }

  if (!config.googleApiKey) {
    return {
      plan: deterministicPlan,
      usedLlm: false,
      reason: "GOOGLE_API_KEY is not set"
    };
  }

  try {
    const patch = await callGeminiPlanner(config, input, deterministicPlan);
    return {
      plan: mergePatch(deterministicPlan, patch),
      usedLlm: true
    };
  } catch (firstError) {
    try {
      const repairHint = firstError instanceof Error ? firstError.message : "invalid LLM response";
      const patch = await callGeminiPlanner(config, input, deterministicPlan, repairHint);
      return {
        plan: mergePatch(deterministicPlan, patch),
        usedLlm: true
      };
    } catch (secondError) {
      const reason = secondError instanceof Error ? secondError.message : "LLM refinement failed";
      return {
        plan: deterministicPlan,
        usedLlm: false,
        reason
      };
    }
  }
};
