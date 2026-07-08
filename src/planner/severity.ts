import type { Evidence, Severity } from "./schema";

type SeverityInput = {
  evidence: Evidence[];
  precipitationMm: number;
  floodRiskIndex: number;
  blockedRoutes: number;
  shelterPressure: number;
};

export type SeverityResult = {
  score: number;
  level: Severity;
};

const keywordWeights: Array<[RegExp, number]> = [
  [/evacuat/i, 18],
  [/elderly|child|medical|first-aid/i, 12],
  [/blocked|debris|closed/i, 12],
  [/rising|knee-deep|flood/i, 14],
  [/shelter|capacity|full/i, 8],
  [/urgent|critical|immediate/i, 18]
];

export const scoreSeverity = (input: SeverityInput): SeverityResult => {
  const keywordScore = input.evidence.reduce((total, item) => {
    const itemScore = keywordWeights.reduce((score, [pattern, weight]) => {
      return pattern.test(item.text) ? score + weight : score;
    }, 0);
    return total + Math.min(itemScore, 35);
  }, 0);

  const weatherScore = Math.min(input.precipitationMm * 2, 20);
  const floodScore = Math.min(input.floodRiskIndex * 25, 25);
  const routeScore = Math.min(input.blockedRoutes * 12, 24);
  const shelterScore = Math.min(input.shelterPressure * 12, 12);

  const score = Math.min(Math.round(20 + keywordScore + weatherScore + floodScore + routeScore + shelterScore), 100);

  if (score >= 85) {
    return { score, level: "critical" };
  }
  if (score >= 65) {
    return { score, level: "high" };
  }
  if (score >= 40) {
    return { score, level: "moderate" };
  }

  return { score, level: "low" };
};
