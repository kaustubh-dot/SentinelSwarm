export type ParsedIncidentReport = {
  zoneInput: string;
  affectedPeople?: number;
  affectedHouseholds?: number;
  routeBlocked: boolean;
  hazards: string[];
  vulnerableGroups: string[];
  requestedAction: "evacuation" | "shelter" | "supplies" | "route-check" | "risk-assessment";
  normalizedText: string;
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12
};

const CRISIS_TERMS = [
  "rain",
  "water",
  "flood",
  "evacuat",
  "blocked",
  "shelter",
  "volunteer",
  "suppl",
  "route",
  "rescue",
  "stranded",
  "overflow",
  "debris",
  "medical",
  "first-aid"
];

const cleanSlackText = (text: string): string => text.replace(/<@[A-Z0-9]+>/g, "").replace(/\s+/g, " ").trim();

const extractZoneInput = (text: string): string => {
  const match = text.match(/\bzone\s*([a-z])\b/i);
  return match ? `Zone ${match[1].toUpperCase()}` : "Zone B";
};

const extractAffectedCount = (text: string, units: string): number | undefined => {
  const numeric = text.match(new RegExp(`\\b(\\d{1,4})\\s+(${units})\\b`, "i"));
  if (numeric) {
    return Number.parseInt(numeric[1], 10);
  }

  const word = text.match(new RegExp(`\\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\s+(${units})\\b`, "i"));
  return word ? NUMBER_WORDS[word[1].toLowerCase()] : undefined;
};

const extractAffectedPeople = (text: string): number | undefined => extractAffectedCount(text, "people|persons|residents|evacuees");

const extractAffectedHouseholds = (text: string): number | undefined => extractAffectedCount(text, "families|homes|households");

const extractHazards = (lowerText: string): string[] => {
  const hazards = [
    ["heavy rain", /heavy rain|rainfall|intense rain/],
    ["rising water", /water rising|rising water|water level|knee-deep|waist-deep/],
    ["flooding", /flood|overflow|drainage/],
    ["blocked route", /blocked|bridge|debris|route closed|unsafe route/],
    ["shelter pressure", /shelter|beds|capacity|full/],
    ["medical support", /medical|first-aid|injur|elderly|children/]
  ] as const;

  return hazards.filter(([, pattern]) => pattern.test(lowerText)).map(([label]) => label);
};

const extractVulnerableGroups = (lowerText: string): string[] => {
  const groups = [
    ["elderly residents", /elderly|senior/],
    ["children", /children|child|kids/],
    ["medical needs", /medical|injur|first-aid|disabled|pregnant/]
  ] as const;

  return groups.filter(([, pattern]) => pattern.test(lowerText)).map(([label]) => label);
};

const extractRequestedAction = (lowerText: string): ParsedIncidentReport["requestedAction"] => {
  if (/evacuat|rescue|stranded/.test(lowerText)) {
    return "evacuation";
  }
  if (/shelter|beds|relocation/.test(lowerText)) {
    return "shelter";
  }
  if (/suppl|water bottle|blanket|first-aid|medicine/.test(lowerText)) {
    return "supplies";
  }
  if (/route|bridge|road|blocked|debris/.test(lowerText)) {
    return "route-check";
  }
  return "risk-assessment";
};

export const hasExplicitAnalyzeIntent = (text: string): boolean => /\banaly[sz]e\b|\brisk\b|\bincident\b/i.test(text);

export const hasCrisisTerms = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return CRISIS_TERMS.some((term) => lowerText.includes(term));
};

export const shouldOpenIncidentControlRoom = (text: string): boolean => {
  const cleaned = cleanSlackText(text);
  const hasZone = /\bzone\s*[a-z]\b/i.test(cleaned);
  return hasExplicitAnalyzeIntent(cleaned) || (hasZone && hasCrisisTerms(cleaned));
};

export const parseIncidentReport = (text: string): ParsedIncidentReport => {
  const normalizedText = cleanSlackText(text);
  const lowerText = normalizedText.toLowerCase();

  return {
    zoneInput: extractZoneInput(normalizedText),
    affectedPeople: extractAffectedPeople(normalizedText),
    affectedHouseholds: extractAffectedHouseholds(normalizedText),
    routeBlocked: /blocked|bridge|debris|route closed|unsafe route/.test(lowerText),
    hazards: extractHazards(lowerText),
    vulnerableGroups: extractVulnerableGroups(lowerText),
    requestedAction: extractRequestedAction(lowerText),
    normalizedText
  };
};
