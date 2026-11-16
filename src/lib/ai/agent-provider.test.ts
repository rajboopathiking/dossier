import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAgentAiProvider } from "./agent-provider";
import { settingsFromRows } from "@/lib/settings";

vi.mock("@/lib/settings-data", () => ({
  loadSettings: vi.fn(),
}));

vi.mock("@/lib/ai", () => ({
  getAiProvider: vi.fn(async () => ({ kind: "PRIMARY" })),
}));

vi.mock("@/lib/ai/api-key", () => ({
  decryptApiKey: vi.fn(() => "decrypted-key"),
}));

vi.mock("@/lib/ai/config", () => ({
  loadAiConfig: vi.fn(async () => ({ apiKey: "primary-key" })),
}));

describe("getAgentAiProvider", () => {
  it("uses primary AI provider when agentAiEngine is primary", async () => {
    const settings = settingsFromRows([]);
    settings.agentAiEngine = "primary";
    const provider = await getAgentAiProvider(settings);
    expect((provider as unknown as { kind: string }).kind).toBe("PRIMARY");
  });

  it("uses OpenCode provider when agentAiEngine is opencode", async () => {
    const settings = settingsFromRows([]);
    settings.agentAiEngine = "opencode";
    settings.automationPreset = "opencode";
    settings.automationBaseUrl = "http://localhost:4096/v1";
    settings.automationModel = "opencode";
    const provider = await getAgentAiProvider(settings);
    expect(provider).toBeDefined();
    expect((provider as unknown as { baseURL: string }).baseURL).toBe("http://localhost:4096/v1");
  });

  it("uses AGY (Google Gemini) provider when agentAiEngine is agy with an HTTP endpoint", async () => {
    const settings = settingsFromRows([]);
    settings.agentAiEngine = "agy";
    settings.automationPreset = "agy";
    settings.automationApiKeyEnc = "some-key";
    settings.automationBaseUrl = "https://generativelanguage.googleapis.com/v1beta/openai";
    settings.automationModel = "gemini-2.0-flash";
    const provider = await getAgentAiProvider(settings);
    expect(provider).toBeDefined();
    expect((provider as unknown as { baseURL: string }).baseURL).toBe("https://generativelanguage.googleapis.com/v1beta/openai");
  });

  it("uses local AgyCliProvider when agentAiEngine is agy with local endpoint", async () => {
    const settings = settingsFromRows([]);
    settings.agentAiEngine = "agy";
    settings.automationPreset = "agy";
    settings.automationBaseUrl = "local";
    settings.automationModel = "gemini-3.8-flash-high";
    const provider = await getAgentAiProvider(settings);
    expect(provider).toBeDefined();
    expect(provider.kind).toBe("LOCAL");
  });

  it("uses custom provider when agentAiEngine is custom", async () => {
    const settings = settingsFromRows([]);
    settings.agentAiEngine = "custom";
    settings.automationBaseUrl = "https://custom-ai.internal/v1";
    settings.automationModel = "custom-agent-v1";
    const provider = await getAgentAiProvider(settings);
    expect(provider).toBeDefined();
    expect((provider as unknown as { baseURL: string }).baseURL).toBe("https://custom-ai.internal/v1");
  });
});
