import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

export type SecretFinding = {
  filePath: string;
  line: number;
  label: string;
  match: string;
};

const SECRET_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "Slack bot token", pattern: /xoxb-[A-Za-z0-9-]{12,}/g },
  { label: "Slack app token", pattern: /xapp-[A-Za-z0-9-]{12,}/g },
  { label: "Google API key", pattern: /AIza[A-Za-z0-9_-]{20,}/g },
  { label: "Assigned Google API key", pattern: /GOOGLE_API_KEY=[A-Za-z0-9_-]{8,}/g }
];

const PLACEHOLDER_ALLOWLIST = new Set(["xoxb-your-bot-token", "xapp-your-app-level-token", "GOOGLE_API_KEY=..."]);

export const scanTextForSecrets = (filePath: string, text: string): SecretFinding[] => {
  const findings: SecretFinding[] = [];
  const lines = text.split(/\r?\n/);

  for (const [lineIndex, line] of lines.entries()) {
    for (const { label, pattern } of SECRET_PATTERNS) {
      pattern.lastIndex = 0;
      for (const match of line.matchAll(pattern)) {
        const value = match[0];
        if (!PLACEHOLDER_ALLOWLIST.has(value)) {
          findings.push({
            filePath,
            line: lineIndex + 1,
            label,
            match: value
          });
        }
      }
    }
  }

  return findings;
};

export const trackedFiles = (cwd = process.cwd()): string[] =>
  execFileSync("git", ["ls-files"], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  })
    .split(/\r?\n/)
    .filter(Boolean);

export const scanTrackedFilesForSecrets = (cwd = process.cwd()): SecretFinding[] => {
  const findings: SecretFinding[] = [];

  for (const filePath of trackedFiles(cwd)) {
    try {
      const absolutePath = path.join(cwd, filePath);
      const text = readFileSync(absolutePath, "utf8");
      findings.push(...scanTextForSecrets(filePath, text));
    } catch {
      // Binary or unreadable tracked files are ignored; this repo should not keep secrets there.
    }
  }

  return findings;
};

export const main = (): void => {
  const findings = scanTrackedFilesForSecrets();
  if (findings.length === 0) {
    console.log("No obvious secrets found in tracked files.");
    return;
  }

  for (const finding of findings) {
    console.error(`[SECRET] ${finding.filePath}:${finding.line} ${finding.label}: ${finding.match}`);
  }
  process.exitCode = 1;
};

if (require.main === module) {
  main();
}
