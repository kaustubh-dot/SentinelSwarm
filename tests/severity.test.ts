import { describe, expect, it } from "vitest";
import { scoreSeverity } from "../src/planner/severity";
import type { Evidence } from "../src/planner/schema";

const evidence = (text: string): Evidence => ({
  id: "e1",
  source: "test",
  channel: "#field-reports",
  text,
  confidence: 0.9,
  sourceType: "mock"
});

describe("scoreSeverity", () => {
  it("keeps quiet reports below the moderate threshold", () => {
    const result = scoreSeverity({
      evidence: [evidence("Zone B watch note: routine monitoring continues.")],
      precipitationMm: 0,
      floodRiskIndex: 0,
      blockedRoutes: 0,
      shelterPressure: 0
    });

    expect(result).toEqual({
      score: 20,
      level: "low"
    });
  });

  it("marks moderate at the first threshold", () => {
    const result = scoreSeverity({
      evidence: [],
      precipitationMm: 10,
      floodRiskIndex: 0,
      blockedRoutes: 0,
      shelterPressure: 0
    });

    expect(result).toEqual({
      score: 40,
      level: "moderate"
    });
  });

  it("marks high at the high threshold", () => {
    const result = scoreSeverity({
      evidence: [],
      precipitationMm: 10,
      floodRiskIndex: 1,
      blockedRoutes: 0,
      shelterPressure: 0
    });

    expect(result).toEqual({
      score: 65,
      level: "high"
    });
  });

  it("marks critical when route and shelter pressure compound high external risk", () => {
    const result = scoreSeverity({
      evidence: [],
      precipitationMm: 10,
      floodRiskIndex: 1,
      blockedRoutes: 2,
      shelterPressure: 0
    });

    expect(result).toEqual({
      score: 89,
      level: "critical"
    });
  });

  it("caps repeated keyword evidence so one verbose report cannot dominate alone", () => {
    const result = scoreSeverity({
      evidence: [evidence("urgent critical immediate evacuation elderly child medical blocked debris rising knee-deep flood shelter full")],
      precipitationMm: 0,
      floodRiskIndex: 0,
      blockedRoutes: 0,
      shelterPressure: 0
    });

    expect(result).toEqual({
      score: 55,
      level: "moderate"
    });
  });

  it("raises severity for evacuation evidence, blocked routes, and flood risk", () => {
    const result = scoreSeverity({
      evidence: [evidence("Zone B evacuation needed with elderly residents and rising flood water.")],
      precipitationMm: 8,
      floodRiskIndex: 0.9,
      blockedRoutes: 1,
      shelterPressure: 0.7
    });

    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(["high", "critical"]).toContain(result.level);
  });
});
