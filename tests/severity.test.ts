import { describe, expect, it } from "vitest";
import { scoreSeverity } from "../src/planner/severity";

describe("scoreSeverity", () => {
  it("raises severity for evacuation evidence, blocked routes, and flood risk", () => {
    const result = scoreSeverity({
      evidence: [
        {
          id: "e1",
          source: "test",
          channel: "#field-reports",
          text: "Zone B evacuation needed with elderly residents and rising flood water.",
          confidence: 0.9,
          sourceType: "mock"
        }
      ],
      precipitationMm: 8,
      floodRiskIndex: 0.9,
      blockedRoutes: 1,
      shelterPressure: 0.7
    });

    expect(result.score).toBeGreaterThanOrEqual(65);
    expect(["high", "critical"]).toContain(result.level);
  });
});
