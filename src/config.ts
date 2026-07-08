import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanFromEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
};

const ConfigSchema = z.object({
  slackBotToken: z.string().min(1).startsWith("xoxb-", "SLACK_BOT_TOKEN must start with xoxb-"),
  slackAppToken: z.string().min(1).startsWith("xapp-", "SLACK_APP_TOKEN must start with xapp-"),
  coordinationChannelId: z.string().optional(),
  useLlm: z.boolean(),
  forceMocks: z.boolean(),
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export type AppConfig = z.infer<typeof ConfigSchema>;

export const loadConfig = (): AppConfig => {
  const parsed = ConfigSchema.safeParse({
    slackBotToken: process.env.SLACK_BOT_TOKEN,
    slackAppToken: process.env.SLACK_APP_TOKEN,
    coordinationChannelId: process.env.SLACK_COORDINATION_CHANNEL_ID || undefined,
    useLlm: booleanFromEnv(process.env.SENTINEL_USE_LLM, false),
    forceMocks: booleanFromEnv(process.env.SENTINEL_FORCE_MOCKS, false),
    logLevel: process.env.LOG_LEVEL || "info"
  });

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `- ${issue.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${details}\n\nCopy .env.example to .env and fill the required Slack tokens.`);
  }

  return parsed.data;
};
