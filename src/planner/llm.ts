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

const geminiText = (payload: unknown): string | undefined => {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const response = payload as {
    output_text?: string;
    outputText?: string;
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return (
    response.output_text ??
    response.outputText ??
    response.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter((text): text is string => Boolean(text))
      .join("")
  );
};

const callGeminiPlanner = async (
  config: LlmPlannerConfig,
  input: PlannerInput,
  deterministicPlan: IncidentPlan,
  repairHint?: string
): Promise<LlmPlanPatch> => {
  const prompt = buildPlannerRefinementPrompt(input, deterministicPlan, repairHint);
  const response = await timeoutFetch(
    "https://generativelanguage.googleapis.com/v1beta/interactions",
    {
      method: "POST",
      headers: {
        "x-goog-api-key": config.googleApiKey ?? "",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: config.geminiModel,
        system_instruction: "You are SentinelSwarm's emergency coordination planning assistant. Return strict JSON only.",
        input: prompt,
        generation_config: {
          temperature: 0.2,
          response_mime_type: "application/json"
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

const mergePatch = (deterministicPlan: IncidentPlan, patch: LlmPlanPatch): IncidentPlan =>
  IncidentPlanSchema.parse({
    ...deterministicPlan,
    ...patch,
    statuses: {
      ...deterministicPlan.statuses,
      planner: "llm"
    },
    evidence: deterministicPlan.evidence,
    riskSignals: deterministicPlan.riskSignals
  });

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
