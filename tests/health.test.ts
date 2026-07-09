import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createHealthHandler, healthPort, healthStatus, shouldStartHealthServer } from "../src/health";

const requestJson = async (path: string, method = "GET"): Promise<{ statusCode: number; body: Record<string, unknown> }> => {
  const server = http.createServer(
    createHealthHandler(
      {
        forceMocks: false,
        useLlm: false,
        slackBotToken: "xoxb-secret",
        slackAppToken: "xapp-secret",
        coordinationChannelId: "CSECRET"
      } as any,
      () => 12.4
    )
  );

  try {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;

    return await new Promise((resolve, reject) => {
      http
        .request(
          {
            host: "127.0.0.1",
            port: address.port,
            path,
            method
          },
          (response) => {
            let raw = "";
            response.setEncoding("utf8");
            response.on("data", (chunk) => {
              raw += chunk;
            });
            response.on("end", () => {
              resolve({
                statusCode: response.statusCode ?? 0,
                body: JSON.parse(raw) as Record<string, unknown>
              });
            });
          }
        )
        .on("error", reject)
        .end();
    });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("health endpoint", () => {
  it("returns safe hosted status without secrets or Slack identifiers", async () => {
    const result = await requestJson("/healthz");
    const bodyText = JSON.stringify(result.body);

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      app: "SentinelSwarm",
      ok: true,
      runtime: "slack-socket-mode",
      socketMode: true,
      forceMocks: false,
      useLlm: false,
      uptimeSeconds: 12
    });
    expect(bodyText).not.toContain("xoxb");
    expect(bodyText).not.toContain("xapp");
    expect(bodyText).not.toContain("CSECRET");
  });

  it("returns the same safe hosted status from the root Space route", async () => {
    const result = await requestJson("/");

    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({
      app: "SentinelSwarm",
      ok: true,
      runtime: "slack-socket-mode"
    });
  });

  it("returns 404 for non-health paths", async () => {
    await expect(requestJson("/tokens")).resolves.toMatchObject({
      statusCode: 404,
      body: {
        ok: false,
        error: "not_found"
      }
    });
  });

  it("rejects non-GET health requests", async () => {
    await expect(requestJson("/healthz", "POST")).resolves.toMatchObject({
      statusCode: 405,
      body: {
        ok: false,
        error: "method_not_allowed"
      }
    });
  });

  it("only enables hosted health when requested by env", () => {
    expect(shouldStartHealthServer({})).toBe(false);
    expect(shouldStartHealthServer({ SENTINEL_HEALTH_SERVER: "true" })).toBe(true);
    expect(shouldStartHealthServer({ PORT: "7860" })).toBe(true);
  });

  it("uses a safe default health port", () => {
    expect(healthPort({})).toBe(7860);
    expect(healthPort({ PORT: "9000" })).toBe(9000);
    expect(healthPort({ PORT: "not-a-port" })).toBe(7860);
  });

  it("builds status from explicit safe fields", () => {
    expect(healthStatus({ forceMocks: true, useLlm: false }, 0)).toEqual({
      app: "SentinelSwarm",
      ok: true,
      runtime: "slack-socket-mode",
      socketMode: true,
      forceMocks: true,
      useLlm: false,
      uptimeSeconds: 0
    });
  });
});
