import { describe, expect, it } from "vitest";
import { parseIncidentReport, shouldOpenIncidentControlRoom } from "../src/planner/incidentParser";

describe("incidentParser", () => {
  it("opens the Incident Control Room for natural crisis reports", () => {
    const text = "@SentinelSwarm heavy rain near Zone A, water rising, 25 people need evacuation, route bridge blocked";

    expect(shouldOpenIncidentControlRoom(text)).toBe(true);

    const parsed = parseIncidentReport(text);
    expect(parsed.zoneInput).toBe("Zone A");
    expect(parsed.affectedPeople).toBe(25);
    expect(parsed.routeBlocked).toBe(true);
    expect(parsed.requestedAction).toBe("evacuation");
    expect(parsed.hazards).toContain("heavy rain");
    expect(parsed.hazards).toContain("rising water");
  });

  it("does not open the Incident Control Room for casual mentions", () => {
    expect(shouldOpenIncidentControlRoom("@SentinelSwarm thanks for the update")).toBe(false);
  });

  it("keeps explicit analyze commands working", () => {
    expect(shouldOpenIncidentControlRoom("@SentinelSwarm analyze Zone B risk")).toBe(true);
    expect(parseIncidentReport("@SentinelSwarm analyze Zone B risk").zoneInput).toBe("Zone B");
  });

  it("does not label homes or households as affected people", () => {
    const parsed = parseIncidentReport("@SentinelSwarm Zone B update: two homes requesting evacuation support");

    expect(parsed.affectedPeople).toBeUndefined();
    expect(parsed.affectedHouseholds).toBe(2);
    expect(parsed.requestedAction).toBe("evacuation");
  });
});
