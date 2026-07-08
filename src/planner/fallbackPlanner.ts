import crypto from "node:crypto";
import type { Evidence, IncidentPlan } from "./schema";
import { IncidentPlanSchema } from "./schema";
import type { ParsedIncidentReport } from "./incidentParser";
import { scoreSeverity } from "./severity";
import type { FloodRisk } from "../tools/flood";
import type { LocalData, Zone } from "../tools/localData";
import type { WeatherRisk } from "../tools/weather";

export type PlannerInput = {
  zone: Zone;
  localData: LocalData;
  evidence: Evidence[];
  contextStatus: "rts" | "slack" | "mock";
  weather: WeatherRisk;
  flood: FloodRisk;
  incident?: ParsedIncidentReport;
};

const zoneEvidence = (zone: Zone, evidence: Evidence[]): Evidence[] => {
  const zoneTerms = [zone.name.toLowerCase(), zone.label.toLowerCase()];
  const zoneMatches = evidence.filter((item) => zoneTerms.some((term) => item.text.toLowerCase().includes(term)));
  const currentReport = evidence.filter((item) => item.id === "field-report-current");
  const contextual = evidence.filter((item) => !zoneMatches.includes(item) && item.id !== "field-report-current");
  const merged = [...currentReport, ...zoneMatches, ...contextual];
  return Array.from(new Map(merged.map((item) => [item.id, item])).values()).slice(0, 6);
};

const cap = (text: string, limit = 140): string => (text.length > limit ? `${text.slice(0, limit - 3)}...` : text);

const routeCode = (routeName: string): string | undefined => routeName.match(/\bR\d+\b/i)?.[0]?.toLowerCase();

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const routeDescriptor = (routeName: string): string | undefined => {
  const withoutCode = routeName.replace(/\bR\d+\b/i, "");
  const descriptor = withoutCode.replace(/\bvia\b/i, "").trim();
  return descriptor ? normalize(descriptor) : undefined;
};

const routeStatusFromText = (text: string, fallback: LocalData["routes"][number]["status"]): LocalData["routes"][number]["status"] => {
  if (/blocked|closed|unsafe|avoid|debris|overflow/.test(text)) {
    return "blocked";
  }
  if (/caution|slow|waterlog|limited|essential/.test(text)) {
    return "caution";
  }
  if (/open|clear|safe|passable/.test(text)) {
    return "open";
  }
  return fallback;
};

const routeSpecificText = (text: string, terms: string[]): string => {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const sentence = sentences.find((part) => terms.some((term) => part.toLowerCase().includes(term)));
  return sentence ?? text;
};

const evidenceMentionsRoute = (route: LocalData["routes"][number], zone: Zone, text: string): boolean => {
  const normalizedText = normalize(text);
  const code = routeCode(route.name);
  const descriptor = routeDescriptor(route.name);
  const fullName = normalize(route.name);
  const zoneTerms = [normalize(zone.name), normalize(zone.label)];

  if (normalizedText.includes(normalize(route.id)) || normalizedText.includes(fullName)) {
    return true;
  }

  if (descriptor && normalizedText.includes(descriptor)) {
    return true;
  }

  return Boolean(code && normalizedText.includes(code) && zoneTerms.some((term) => normalizedText.includes(term)));
};

const assessRouteFromEvidence = (route: LocalData["routes"][number], zone: Zone, evidence: Evidence[]): LocalData["routes"][number] & { evidenceNote?: string } => {
  const terms = [route.id.toLowerCase(), route.name.toLowerCase(), routeCode(route.name), routeDescriptor(route.name)].filter(
    (term): term is string => Boolean(term)
  );
  const relevant = evidence.find((item) => {
    return evidenceMentionsRoute(route, zone, item.text);
  });

  if (!relevant) {
    return route;
  }

  const text = routeSpecificText(relevant.text.toLowerCase(), terms);
  const status = routeStatusFromText(text, route.status);

  return {
    ...route,
    status,
    evidenceNote: `Live evidence: ${cap(relevant.text)}`
  };
};

const requestedActionLabel = (action: ParsedIncidentReport["requestedAction"] | undefined): string => {
  switch (action) {
    case "evacuation":
      return "evacuation support";
    case "shelter":
      return "shelter placement";
    case "supplies":
      return "supply dispatch";
    case "route-check":
      return "route verification";
    default:
      return "risk review";
  }
};

export const createFallbackPlan = (input: PlannerInput): IncidentPlan => {
  const evidence = zoneEvidence(input.zone, input.evidence);
  const routes = input.localData.routes.filter((route) => route.zoneId === input.zone.id);
  const shelters = input.localData.shelters.filter((shelter) => shelter.zoneId === input.zone.id);
  const volunteers = input.localData.volunteers.filter((volunteer) => volunteer.zonePreference === input.zone.id || volunteer.zonePreference === "any");
  const supplies = input.localData.supplies.filter((supply) => !supply.zoneId || supply.zoneId === input.zone.id);
  const routeAssessments = routes.map((route) => assessRouteFromEvidence(route, input.zone, evidence));
  const blockedRoutes = routeAssessments.filter((route) => route.status === "blocked");
  const bestShelter = [...shelters].sort((a, b) => b.availableSpaces - a.availableSpaces)[0];
  const shelterPressure = bestShelter ? 1 - bestShelter.availableSpaces / Math.max(bestShelter.capacity, 1) : 1;

  const severity = scoreSeverity({
    evidence,
    precipitationMm: input.weather.precipitationMm,
    floodRiskIndex: input.flood.floodRiskIndex,
    blockedRoutes: blockedRoutes.length,
    shelterPressure
  });

  const routeActions = routeAssessments.map((route) => ({
    routeId: route.id,
    routeName: route.name,
    status: route.status,
    recommendation:
      route.status === "blocked"
        ? `Avoid ${route.name}; ${route.evidenceNote ?? route.notes}`
        : route.status === "caution"
          ? `Use ${route.name} only for essential movement; ${route.evidenceNote ?? route.notes}`
          : `Use ${route.name} as the preferred access route; ${route.evidenceNote ?? route.notes}`
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
    ...supplies.slice(0, 3).map((supply) => ({
      type: "supply" as const,
      name: supply.name,
      recommendation: `Stage ${supply.quantity} ${supply.unit} of ${supply.name} from ${supply.location}.`
    }))
  ];

  const affectedCountPhrase = input.incident?.affectedPeople
    ? `${input.incident.affectedPeople} reported affected people, `
    : input.incident?.affectedHouseholds
      ? `${input.incident.affectedHouseholds} reported households/families, `
      : "";
  const vulnerablePhrase = input.incident?.vulnerableGroups.length
    ? ` Vulnerable groups mentioned: ${input.incident.vulnerableGroups.join(", ")}.`
    : "";
  const actionLabel = requestedActionLabel(input.incident?.requestedAction);
  const affectedActionTarget = input.incident?.affectedPeople
    ? `${input.incident.affectedPeople} reported people`
    : input.incident?.affectedHouseholds
      ? `${input.incident.affectedHouseholds} reported households/families`
      : undefined;
  const actionPrefix = affectedActionTarget
    ? `Prioritize ${actionLabel} for ${affectedActionTarget} in ${input.zone.name}.`
    : `Prioritize ${actionLabel} in ${input.zone.name}.`;

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
    summary: `${input.zone.name} is at ${severity.level} risk: ${affectedCountPhrase}${blockedRoutes.length} blocked route(s), ${bestShelter?.availableSpaces ?? 0} shelter spaces, and weather/flood signals require coordinator review.${vulnerablePhrase}`,
    evidence,
    riskSignals: [input.weather.signal, input.flood.signal],
    incidents: [
      {
        id: `incident-${input.zone.id}-${input.incident?.requestedAction ?? "risk"}`,
        title: `${input.zone.name} ${actionLabel} and route control`,
        severity: severity.level,
        summary: `Prioritize welfare checks and controlled movement through open routes while avoiding blocked corridors.`,
        evidenceIds: evidence.map((item) => item.id),
        recommendedOwner: volunteers[0]?.name ?? "On-duty field coordinator"
      }
    ],
    routeActions,
    resourceMatches,
    recommendedActions: [
      actionPrefix,
      `Dispatch ${volunteers[0]?.name ?? "the nearest field team"} for welfare checks in ${input.zone.name}.`,
      blockedRoutes[0] ? `Mark ${blockedRoutes[0].name} as blocked in the coordination post.` : "Confirm all access routes before dispatch.",
      bestShelter ? `Prepare ${bestShelter.name} for evacuees and send requested supplies.` : "Confirm shelter capacity before moving families.",
      "Require human coordinator approval before posting assignments."
    ],
    handover: `Handover: ${input.zone.name} ${severity.level} risk. Evidence reviewed: ${evidence.length}. Use open routes, avoid blocked routes, stage shelter supplies, and keep human coordinator approval on all dispatches.`
  };

  return IncidentPlanSchema.parse(plan);
};
