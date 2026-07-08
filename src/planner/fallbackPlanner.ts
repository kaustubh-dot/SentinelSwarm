import crypto from "node:crypto";
import type { Evidence, IncidentPlan } from "./schema";
import { IncidentPlanSchema } from "./schema";
import { scoreSeverity } from "./severity";
import type { FloodRisk } from "../tools/flood";
import type { LocalData, Zone } from "../tools/localData";
import type { WeatherRisk } from "../tools/weather";

type PlannerInput = {
  zone: Zone;
  localData: LocalData;
  evidence: Evidence[];
  contextStatus: "rts" | "mock";
  weather: WeatherRisk;
  flood: FloodRisk;
};

const zoneEvidence = (zone: Zone, evidence: Evidence[]): Evidence[] => {
  const zoneTerms = [zone.name.toLowerCase(), zone.label.toLowerCase()];
  return evidence.filter((item) => zoneTerms.some((term) => item.text.toLowerCase().includes(term))).slice(0, 4);
};

export const createFallbackPlan = (input: PlannerInput): IncidentPlan => {
  const evidence = zoneEvidence(input.zone, input.evidence);
  const routes = input.localData.routes.filter((route) => route.zoneId === input.zone.id);
  const shelters = input.localData.shelters.filter((shelter) => shelter.zoneId === input.zone.id);
  const volunteers = input.localData.volunteers.filter((volunteer) => volunteer.zonePreference === input.zone.id || volunteer.zonePreference === "any");
  const blockedRoutes = routes.filter((route) => route.status === "blocked");
  const bestShelter = shelters.sort((a, b) => b.availableSpaces - a.availableSpaces)[0];
  const shelterPressure = bestShelter ? 1 - bestShelter.availableSpaces / Math.max(bestShelter.capacity, 1) : 1;

  const severity = scoreSeverity({
    evidence,
    precipitationMm: input.weather.precipitationMm,
    floodRiskIndex: input.flood.floodRiskIndex,
    blockedRoutes: blockedRoutes.length,
    shelterPressure
  });

  const routeActions = routes.map((route) => ({
    routeId: route.id,
    routeName: route.name,
    status: route.status,
    recommendation:
      route.status === "blocked"
        ? `Avoid ${route.name}; ${route.notes}`
        : route.status === "caution"
          ? `Use ${route.name} only for essential movement; ${route.notes}`
          : `Use ${route.name} as the preferred access route; ${route.notes}`
  }));

  const resourceMatches = [
    ...volunteers.slice(0, 3).map((volunteer) => ({
      type: "volunteer" as const,
      name: volunteer.name,
      recommendation: `${volunteer.name} can support with ${volunteer.skills.join(", ")} during ${volunteer.availability}. Transport: ${volunteer.transport}.`
    })),
    ...(bestShelter
      ? [
          {
            type: "shelter" as const,
            name: bestShelter.name,
            recommendation: `${bestShelter.name} has ${bestShelter.availableSpaces} available spaces and needs ${bestShelter.needs.join(", ")}.`
          }
        ]
      : []),
    ...input.localData.supplies.slice(0, 3).map((supply) => ({
      type: "supply" as const,
      name: supply.name,
      recommendation: `Stage ${supply.quantity} ${supply.unit} of ${supply.name} from ${supply.location}.`
    }))
  ];

  const plan: IncidentPlan = {
    planId: crypto.randomUUID(),
    zoneId: input.zone.id,
    zoneName: input.zone.name,
    generatedAt: new Date().toISOString(),
    severity: severity.level,
    confidence: evidence.length >= 3 ? 0.82 : 0.68,
    statuses: {
      context: input.contextStatus,
      weather: input.weather.signal.source,
      flood: input.flood.signal.source,
      planner: "deterministic"
    },
    summary: `${input.zone.name} is at ${severity.level} risk: ${blockedRoutes.length} blocked route(s), ${bestShelter?.availableSpaces ?? 0} shelter spaces, and weather/flood signals require coordinator review.`,
    evidence,
    riskSignals: [input.weather.signal, input.flood.signal],
    incidents: [
      {
        id: "incident-zone-b-evacuation",
        title: `${input.zone.name} evacuation support and route control`,
        severity: severity.level,
        summary: `Prioritize welfare checks and controlled movement through open routes while avoiding blocked corridors.`,
        evidenceIds: evidence.map((item) => item.id),
        recommendedOwner: volunteers[0]?.name ?? "On-duty field coordinator"
      }
    ],
    routeActions,
    resourceMatches,
    recommendedActions: [
      `Dispatch ${volunteers[0]?.name ?? "the nearest field team"} for welfare checks in ${input.zone.name}.`,
      blockedRoutes[0] ? `Mark ${blockedRoutes[0].name} as blocked in the coordination post.` : "Confirm all access routes before dispatch.",
      bestShelter ? `Prepare ${bestShelter.name} for evacuees and send requested supplies.` : "Confirm shelter capacity before moving families.",
      "Require human coordinator approval before posting assignments."
    ],
    handover: `Handover: ${input.zone.name} ${severity.level} risk. Evidence reviewed: ${evidence.length}. Use open routes, avoid blocked routes, stage shelter supplies, and keep human coordinator approval on all dispatches.`
  };

  return IncidentPlanSchema.parse(plan);
};
