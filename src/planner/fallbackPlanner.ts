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

type IncidentKind = "evacuation" | "shelter" | "route-check" | "supplies" | "medical";

type IncidentCandidate = {
  kind: IncidentKind;
  score: number;
  evidence: Evidence[];
};

type ResourceIntent = {
  incidents: IncidentCandidate[];
  evidence: Evidence[];
  incident?: ParsedIncidentReport;
};

const zoneEvidence = (zone: Zone, evidence: Evidence[]): Evidence[] => {
  const zoneTerms = [zone.name.toLowerCase(), zone.label.toLowerCase()];
  const zoneMatches = evidence.filter((item) => zoneTerms.some((term) => item.text.toLowerCase().includes(term)));
  const currentReport = evidence.filter((item) => item.id === "field-report-current" || item.id.startsWith("field-report-current-"));
  const currentReportIds = new Set(currentReport.map((item) => item.id));
  const contextual = evidence.filter((item) => !zoneMatches.includes(item) && !currentReportIds.has(item.id));
  const merged = [...currentReport, ...zoneMatches, ...contextual];
  return Array.from(new Map(merged.map((item) => [item.id, item])).values()).slice(0, 6);
};

const cap = (text: string, limit = 140): string => (text.length > limit ? `${text.slice(0, limit - 3)}...` : text);

const routeCode = (routeName: string): string | undefined => routeName.match(/\bR\d+\b/i)?.[0]?.toLowerCase();

const normalize = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const rounded = (value: number): number => Math.round(value * 100) / 100;

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)])
    );
  }

  return value;
};

const stableDigest = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(canonicalize(value))).digest("hex");

const deterministicMetadata = (input: PlannerInput, evidence: Evidence[]): Pick<IncidentPlan, "planId" | "generatedAt"> => {
  const digest = stableDigest({
    zoneId: input.zone.id,
    zoneName: input.zone.name,
    incident: input.incident,
    contextStatus: input.contextStatus,
    weather: input.weather,
    flood: input.flood,
    evidence: evidence.map((item) => ({
      id: item.id,
      source: item.source,
      sourceType: item.sourceType,
      channel: item.channel,
      text: item.text,
      confidence: item.confidence
    }))
  });
  const secondsInLeapYear = 366 * 24 * 60 * 60;
  const secondsOffset = Number.parseInt(digest.slice(0, 8), 16) % secondsInLeapYear;

  return {
    planId: `plan-${input.zone.id}-${digest.slice(0, 12)}`,
    generatedAt: new Date(Date.UTC(2026, 0, 1) + secondsOffset * 1000).toISOString()
  };
};

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

const evidenceNoteLabel = (sourceType: Evidence["sourceType"]): string => {
  switch (sourceType) {
    case "rts":
      return "RTS evidence";
    case "slack":
      return "Slack evidence";
    case "mock":
      return "Fallback evidence";
    default:
      return "Evidence";
  }
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
    evidenceNote: `${evidenceNoteLabel(relevant.sourceType)}: ${cap(relevant.text)}`
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

const incidentProfiles: Record<
  IncidentKind,
  {
    title: string;
    patterns: RegExp[];
    ownerSkills: string[];
    supplyTerms: string[];
    shelterNeedTerms: string[];
    summary: string;
  }
> = {
  evacuation: {
    title: "Evacuation support",
    patterns: [/evacuat|rescue|stranded|homes?|households?|families|people|residents?/i, /elderly|children|medical/i],
    ownerSkills: ["evacuation", "first-aid", "field checks", "4x4"],
    supplyTerms: ["water", "blanket", "first-aid"],
    shelterNeedTerms: ["drinking water", "blankets", "intake"],
    summary: "Coordinate welfare checks and movement support for affected residents."
  },
  shelter: {
    title: "Shelter intake pressure",
    patterns: [/shelter|capacity|spaces?|beds?|evacuees?|relocation/i, /families|households?|elderly|children/i],
    ownerSkills: ["shelter intake", "evacuation", "phone check-ins"],
    supplyTerms: ["water", "blanket", "portable lights"],
    shelterNeedTerms: ["drinking water", "blankets", "intake volunteers", "overflow"],
    summary: "Prepare shelter intake capacity and support vulnerable arrivals."
  },
  "route-check": {
    title: "Route control",
    patterns: [/route|road|bridge|lane/i, /blocked|closed|debris|avoid/i, /passable|open|unsafe|waterlog/i],
    ownerSkills: ["4x4 driving", "field checks", "radio coordination"],
    supplyTerms: ["portable lights"],
    shelterNeedTerms: ["intake volunteers"],
    summary: "Verify blocked corridors and keep dispatch movement on safer access routes."
  },
  supplies: {
    title: "Supply staging",
    patterns: [/suppl|depot|stage/i, /\bwater\b|drinking water/i, /blanket/i, /first-aid|medicine/i, /lights|food/i],
    ownerSkills: ["supply loading", "shelter intake", "radio coordination"],
    supplyTerms: ["water", "blanket", "first-aid", "portable lights"],
    shelterNeedTerms: ["drinking water", "blankets", "portable lights"],
    summary: "Stage the highest-need supplies close to shelter and field teams."
  },
  medical: {
    title: "Medical welfare checks",
    patterns: [/medical|first-aid|injur|elderly|children|disabled|pregnant/i],
    ownerSkills: ["first-aid", "phone check-ins", "field checks"],
    supplyTerms: ["first-aid", "water"],
    shelterNeedTerms: ["drinking water", "intake volunteers"],
    summary: "Prioritize welfare checks for vulnerable groups and medical needs."
  }
};

const requestedActionKind = (action: ParsedIncidentReport["requestedAction"] | undefined): IncidentKind | undefined => {
  if (!action || action === "risk-assessment") {
    return undefined;
  }
  return action;
};

const candidateEvidenceScore = (kind: IncidentKind, item: Evidence): number => {
  const profile = incidentProfiles[kind];
  const keywordScore = profile.patterns.reduce((score, pattern) => (pattern.test(item.text) ? score + 16 : score), 0);
  if (!keywordScore) {
    return 0;
  }

  const channel = item.channel.toLowerCase();
  const channelBoost =
    (kind === "supplies" && channel.includes("suppl")) ||
    (kind === "shelter" && channel.includes("shelter")) ||
    (kind === "route-check" && channel.includes("route")) ||
    (kind === "evacuation" && channel.includes("field-report")) ||
    (kind === "medical" && channel.includes("field-report"))
      ? 18
      : 0;
  const urgencyBoost = kind === "route-check" && /blocked|closed|debris|avoid|unsafe/i.test(item.text) ? 24 : 0;

  return keywordScore + channelBoost + urgencyBoost + Math.round(item.confidence * 10);
};

const deriveIncidentCandidates = (input: PlannerInput, evidence: Evidence[], severityLevel: IncidentPlan["severity"]): IncidentCandidate[] => {
  const requestedKind = requestedActionKind(input.incident?.requestedAction);
  const hazards = new Set(input.incident?.hazards ?? []);

  const candidates = (Object.keys(incidentProfiles) as IncidentKind[])
    .map((kind) => {
      const matchedEvidence = evidence.filter((item) => candidateEvidenceScore(kind, item) > 0);
      const evidenceScore = matchedEvidence.reduce((total, item) => total + candidateEvidenceScore(kind, item), 0);
      const actionBoost = requestedKind === kind ? 22 : 0;
      const hazardBoost =
        (kind === "evacuation" && (input.incident?.affectedPeople || input.incident?.affectedHouseholds) ? 16 : 0) +
        (kind === "route-check" && (input.incident?.routeBlocked || hazards.has("blocked route")) ? 14 : 0) +
        (kind === "shelter" && hazards.has("shelter pressure") ? 12 : 0) +
        (kind === "medical" && input.incident?.vulnerableGroups.length ? 12 : 0);

      return {
        kind,
        score: evidenceScore + actionBoost + hazardBoost,
        evidence: matchedEvidence
      };
    })
    .filter((candidate) => candidate.score >= 28 || requestedKind === candidate.kind)
    .sort((a, b) => b.score - a.score || a.kind.localeCompare(b.kind));

  const fallbackKind = requestedKind ?? (severityLevel === "low" ? "route-check" : "evacuation");
  const ensured = candidates.length ? candidates : [{ kind: fallbackKind, score: 1, evidence: evidence.slice(0, 1) }];

  return ensured.slice(0, 3);
};

const incidentTitle = (candidate: IncidentCandidate, zone: Zone): string => `${zone.name} ${incidentProfiles[candidate.kind].title}`;

const incidentSummary = (candidate: IncidentCandidate): string => incidentProfiles[candidate.kind].summary;

const evidenceIdsForCandidate = (candidate: IncidentCandidate, fallbackEvidence: Evidence[]): string[] => {
  const selected = candidate.evidence.length ? candidate.evidence : fallbackEvidence.slice(0, 2);
  return selected.map((item) => item.id);
};

const containsAny = (text: string, terms: string[]): boolean => {
  const normalizedText = normalize(text);
  return terms.some((term) => normalizedText.includes(normalize(term)));
};

const scoreVolunteer = (volunteer: LocalData["volunteers"][number], zone: Zone, intent: ResourceIntent): number => {
  const neededSkills = new Set(intent.incidents.flatMap((candidate) => incidentProfiles[candidate.kind].ownerSkills));
  const skillScore = volunteer.skills.reduce((total, skill) => {
    const normalizedSkill = normalize(skill);
    const matched = Array.from(neededSkills).some((needed) => normalizedSkill.includes(normalize(needed)) || normalize(needed).includes(normalizedSkill));
    return total + (matched ? 16 : 0);
  }, 0);
  const zoneScore = volunteer.zonePreference === zone.id ? 22 : volunteer.zonePreference === "any" ? 10 : 0;
  const transportScore =
    /4x4|pickup|van/i.test(volunteer.transport) && intent.incidents.some((candidate) => ["evacuation", "route-check", "supplies"].includes(candidate.kind))
      ? 14
      : /remote/i.test(volunteer.transport) && intent.incidents.some((candidate) => ["medical", "shelter"].includes(candidate.kind))
        ? 8
        : 0;
  const availabilityScore = /next|now|pm|hour/i.test(volunteer.availability) ? 8 : 0;

  return skillScore + zoneScore + transportScore + availabilityScore;
};

const scoreSupply = (supply: LocalData["supplies"][number], intent: ResourceIntent): number => {
  const supplyNeedTerms = new Set(intent.incidents.flatMap((candidate) => incidentProfiles[candidate.kind].supplyTerms));
  const evidenceText = intent.evidence.map((item) => item.text).join(" ");
  const name = normalize(supply.name);
  const incidentScore = Array.from(supplyNeedTerms).some((term) => name.includes(normalize(term)) || normalize(term).includes(name)) ? 28 : 0;
  const evidenceScore = containsAny(evidenceText, [supply.name, ...Array.from(supplyNeedTerms).filter((term) => name.includes(normalize(term)))]) ? 16 : 0;
  const quantityScore = clamp(Math.round(supply.quantity / 10), 1, 10);

  return incidentScore + evidenceScore > 0 ? incidentScore + evidenceScore + quantityScore : 0;
};

const scoreShelter = (shelter: LocalData["shelters"][number], intent: ResourceIntent): number => {
  const shelterNeedTerms = new Set(intent.incidents.flatMap((candidate) => incidentProfiles[candidate.kind].shelterNeedTerms));
  const needsScore = shelter.needs.reduce((total, need) => total + (Array.from(shelterNeedTerms).some((term) => containsAny(need, [term])) ? 10 : 0), 0);
  const availabilityScore = shelter.availableSpaces > 0 ? Math.min(24, Math.round((shelter.availableSpaces / Math.max(shelter.capacity, 1)) * 40)) : -12;
  const evidenceScore = intent.evidence.some((item) => containsAny(item.text, [shelter.name, ...shelter.needs])) ? 12 : 0;

  return availabilityScore + needsScore + evidenceScore;
};

const calculateConfidence = (evidence: Evidence[], statuses: IncidentPlan["statuses"], incidents: IncidentCandidate[]): number => {
  if (!evidence.length) {
    return 0.42;
  }

  const averageEvidenceConfidence = evidence.reduce((total, item) => total + item.confidence, 0) / evidence.length;
  const sourceDiversity = new Set(evidence.map((item) => item.channel || item.source)).size;
  const coverage = Math.min(evidence.length / 4, 1);
  const incidentCoverage = Math.min(incidents.filter((incident) => incident.evidence.length > 0).length / 3, 1);
  const liveSignalBonus = (statuses.context === "rts" || statuses.context === "slack" ? 0.04 : 0) + (statuses.weather === "live" ? 0.03 : 0) + (statuses.flood === "live" ? 0.03 : 0);
  const confidence = 0.22 + averageEvidenceConfidence * 0.42 + coverage * 0.12 + Math.min(sourceDiversity, 3) * 0.03 + incidentCoverage * 0.08 + liveSignalBonus;

  return rounded(clamp(confidence, 0.35, 0.94));
};

export const createFallbackPlan = (input: PlannerInput): IncidentPlan => {
  const evidence = zoneEvidence(input.zone, input.evidence);
  const metadata = deterministicMetadata(input, evidence);
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
  const incidentCandidates = deriveIncidentCandidates(input, evidence, severity.level);
  const resourceIntent: ResourceIntent = { incidents: incidentCandidates, evidence, incident: input.incident };

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

  const rankedVolunteers = [...volunteers]
    .map((volunteer) => ({ volunteer, score: scoreVolunteer(volunteer, input.zone, resourceIntent) }))
    .sort((a, b) => b.score - a.score || a.volunteer.name.localeCompare(b.volunteer.name));
  const rankedShelters = [...shelters]
    .map((shelter) => ({ shelter, score: scoreShelter(shelter, resourceIntent) }))
    .sort((a, b) => b.score - a.score || b.shelter.availableSpaces - a.shelter.availableSpaces || a.shelter.name.localeCompare(b.shelter.name));
  const rankedSupplies = [...supplies]
    .map((supply) => ({ supply, score: scoreSupply(supply, resourceIntent) }))
    .sort((a, b) => b.score - a.score || a.supply.name.localeCompare(b.supply.name));
  const topVolunteer = rankedVolunteers[0]?.volunteer;
  const ownerForCandidate = (candidate: IncidentCandidate): string => {
    const match = [...volunteers]
      .map((volunteer) => ({
        volunteer,
        score: scoreVolunteer(volunteer, input.zone, {
          incidents: [candidate],
          evidence,
          incident: input.incident
        })
      }))
      .sort((a, b) => b.score - a.score || a.volunteer.name.localeCompare(b.volunteer.name))[0];

    return match?.volunteer.name ?? "On-duty field coordinator";
  };

  const resourceMatches = [
    ...rankedVolunteers.slice(0, 3).map(({ volunteer }) => ({
      type: "volunteer" as const,
      name: volunteer.name,
      recommendation: `${volunteer.name} is matched for ${incidentProfiles[incidentCandidates[0].kind].title.toLowerCase()} because of ${volunteer.skills.join(", ")} during ${volunteer.availability}. Transport: ${volunteer.transport}.`
    })),
    ...rankedShelters.slice(0, 1).map(({ shelter }) => ({
      type: "shelter" as const,
      name: shelter.name,
      recommendation: `${shelter.name} is the best shelter match with ${shelter.availableSpaces} available spaces and needs ${shelter.needs.join(", ")}.`
    })),
    ...rankedSupplies.filter(({ score }) => score > 0).slice(0, 3).map(({ supply }) => ({
      type: "supply" as const,
      name: supply.name,
      recommendation: `Stage ${supply.quantity} ${supply.unit} of ${supply.name} from ${supply.location}; matched to current incident needs.`
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
    planId: metadata.planId,
    zoneId: input.zone.id,
    zoneName: input.zone.name,
    generatedAt: metadata.generatedAt,
    severity: severity.level,
    statuses: {
      context: input.contextStatus,
      weather: input.weather.signal.source,
      flood: input.flood.signal.source,
      planner: "deterministic"
    },
    confidence: 0,
    summary: `${input.zone.name} is at ${severity.level} risk: ${affectedCountPhrase}${blockedRoutes.length} blocked route(s), ${bestShelter?.availableSpaces ?? 0} shelter spaces, and weather/flood signals require coordinator review.${vulnerablePhrase}`,
    evidence,
    riskSignals: [input.weather.signal, input.flood.signal],
    incidents: incidentCandidates.map((candidate) => ({
      id: `incident-${input.zone.id}-${candidate.kind}`,
      title: incidentTitle(candidate, input.zone),
      severity: severity.level,
      summary: incidentSummary(candidate),
      evidenceIds: evidenceIdsForCandidate(candidate, evidence),
      recommendedOwner: ownerForCandidate(candidate)
    })),
    routeActions,
    resourceMatches,
    recommendedActions: [
      actionPrefix,
      `Dispatch ${topVolunteer?.name ?? "the nearest field team"} for welfare checks in ${input.zone.name}.`,
      blockedRoutes[0] ? `Mark ${blockedRoutes[0].name} as blocked in the coordination post.` : "Confirm all access routes before dispatch.",
      bestShelter ? `Prepare ${bestShelter.name} for evacuees and send requested supplies.` : "Confirm shelter capacity before moving families.",
      "Require human coordinator approval before posting assignments."
    ],
    handover: `Handover: ${input.zone.name} ${severity.level} risk. Evidence reviewed: ${evidence.length}. Use open routes, avoid blocked routes, stage shelter supplies, and keep human coordinator approval on all dispatches.`
  };

  plan.confidence = calculateConfidence(evidence, plan.statuses, incidentCandidates);

  return IncidentPlanSchema.parse(plan);
};
