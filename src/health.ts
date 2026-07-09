import http, { type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { AppConfig } from "./config";

export type HealthStatus = {
  app: "SentinelSwarm";
  ok: true;
  runtime: "slack-socket-mode";
  socketMode: true;
  forceMocks: boolean;
  useLlm: boolean;
  uptimeSeconds: number;
};

const enabledValues = new Set(["1", "true", "yes", "on"]);

export const shouldStartHealthServer = (env: NodeJS.ProcessEnv = process.env): boolean => {
  return Boolean(env.PORT?.trim()) || enabledValues.has((env.SENTINEL_HEALTH_SERVER ?? "").trim().toLowerCase());
};

export const healthPort = (env: NodeJS.ProcessEnv = process.env): number => {
  const rawPort = env.PORT?.trim() || "7860";
  const port = Number(rawPort);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : 7860;
};

export const healthStatus = (config: Pick<AppConfig, "forceMocks" | "useLlm">, uptimeSeconds = process.uptime()): HealthStatus => ({
  app: "SentinelSwarm",
  ok: true,
  runtime: "slack-socket-mode",
  socketMode: true,
  forceMocks: config.forceMocks,
  useLlm: config.useLlm,
  uptimeSeconds: Math.max(0, Math.round(uptimeSeconds))
});

const sendJson = (response: ServerResponse, statusCode: number, body: unknown): void => {
  const payload = JSON.stringify(body);
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload)
  });
  response.end(payload);
};

export const createHealthHandler =
  (config: Pick<AppConfig, "forceMocks" | "useLlm">, uptime = () => process.uptime()) =>
  (request: IncomingMessage, response: ServerResponse): void => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;

    if (request.method !== "GET") {
      sendJson(response, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    if (path === "/" || path === "/healthz") {
      sendJson(response, 200, healthStatus(config, uptime()));
      return;
    }

    sendJson(response, 404, { ok: false, error: "not_found" });
  };

export const startHealthServer = (config: Pick<AppConfig, "forceMocks" | "useLlm">, port = healthPort()): Server => {
  const server = http.createServer(createHealthHandler(config));
  server.on("error", (error) => {
    console.error(`SentinelSwarm health server failed on port ${port}: ${error.message}`);
  });
  server.listen(port, "0.0.0.0", () => {
    console.log(`SentinelSwarm health server listening on port ${port}.`);
  });
  return server;
};
