import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFallbackPlan } from "../src/planner/fallbackPlanner";
import { LocalPlanStore } from "../src/slack/planStore";
import { findZone, loadLocalData, loadMockContext } from "../src/tools/localData";

const tempDirs: string[] = [];

const makePlan = () => {
  const localData = loadLocalData();
  return createFallbackPlan({
    zone: findZone(localData.zones, "Zone B"),
    localData,
    evidence: loadMockContext(),
    contextStatus: "mock",
    weather: {
      precipitationMm: 8.4,
      signal: {
        label: "Weather",
        summary: "Mock weather",
        source: "mock",
        scoreImpact: 16
      }
    },
    flood: {
      floodRiskIndex: 0.92,
      signal: {
        label: "Flood",
        summary: "Mock flood",
        source: "mock",
        scoreImpact: 23
      }
    }
  });
};

const makeStorePath = async (): Promise<string> => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "sentinelswarm-plan-store-"));
  tempDirs.push(dir);
  return path.join(dir, "plans.json");
};

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("LocalPlanStore", () => {
  it("persists plans across store instances", async () => {
    const filePath = await makeStorePath();
    const plan = makePlan();
    const firstStore = new LocalPlanStore(filePath);

    await firstStore.set(plan.planId, {
      plan,
      state: "approved",
      approvedBy: "coordinator"
    });

    const secondStore = new LocalPlanStore(filePath);
    const restored = await secondStore.get(plan.planId);

    expect(restored?.state).toBe("approved");
    expect(restored?.approvedBy).toBe("coordinator");
    expect(restored?.plan.planId).toBe(plan.planId);
  });

  it("expires stale plans", async () => {
    const filePath = await makeStorePath();
    const plan = makePlan();
    let now = Date.parse("2026-07-08T10:00:00.000Z");
    const store = new LocalPlanStore(filePath, 1000, () => now);

    await store.set(plan.planId, {
      plan,
      state: "draft"
    });

    now += 2000;

    await expect(store.get(plan.planId)).resolves.toBeUndefined();
  });
});
