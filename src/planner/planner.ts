import type { AppConfig } from "../config";
import { createFallbackPlan, type PlannerInput } from "./fallbackPlanner";
import { refinePlanWithLlm } from "./llm";
import type { IncidentPlan } from "./schema";

export type PlannerResult = {
  plan: IncidentPlan;
  mode: "deterministic" | "llm";
  reason?: string;
};

export const createIncidentPlan = async (input: PlannerInput, config: AppConfig): Promise<PlannerResult> => {
  const deterministicPlan = createFallbackPlan(input);
  const refinement = await refinePlanWithLlm(config, input, deterministicPlan);

  return {
    plan: refinement.plan,
    mode: refinement.usedLlm ? "llm" : "deterministic",
    reason: refinement.reason
  };
};
