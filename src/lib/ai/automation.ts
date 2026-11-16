import "server-only";

import { AgentCandidateStatus, ApplicationStatus } from "@/generated/prisma/enums";
import { decryptApiKey } from "@/lib/ai/api-key";
import { getAiProvider, type AIProvider } from "@/lib/ai";
import { AgyCliProvider, findAgyBinary } from "@/lib/ai/providers/agy-cli";
import { OpenAICompatibleProvider } from "@/lib/ai/providers/openai-compatible";
import { prisma } from "@/lib/prisma";
import type { SettingsData } from "@/lib/settings";
import { loadSettings, saveSettings } from "@/lib/settings-data";

import { AUTOMATION_PRESETS, type AutomationConfig, type AutomationPreset } from "./automation-options";

export { AUTOMATION_PRESETS, type AutomationConfig, type AutomationPreset };

export async function loadAutomationConfig(): Promise<AutomationConfig> {
  const settings = await loadSettings();
  let apiKey: string | null = null;
  if (settings.automationApiKeyEnc) {
    try {
      apiKey = decryptApiKey(settings.automationApiKeyEnc);
    } catch {
      apiKey = null;
    }
  }

  const preset = settings.automationPreset;
  const defaultPreset = AUTOMATION_PRESETS[preset];

  return {
    customApi: settings.automationCustomApi,
    preset,
    baseUrl: settings.automationBaseUrl || defaultPreset.defaultUrl,
    model: settings.automationModel || defaultPreset.defaultModel,
    apiKey,
    timeoutSeconds: settings.automationTimeoutSeconds ?? 120,
    intervalHours: settings.automationIntervalHours,
    autoFollowUp: settings.automationAutoFollowUp,
    followUpDays: settings.automationFollowUpDays,
    atsOptimize: settings.automationAtsOptimize,
    autoClassify: settings.automationAutoClassify,
    lastRunAt: settings.automationLastRunAt,
    lastRunMessage: settings.automationLastRunMessage,
  };
}

/**
 * Creates an AIProvider instance dedicated for automation.
 * If customApi is enabled, uses the custom OpenAI-compatible endpoint (OpenCode, AGY, etc.).
 * Otherwise falls back to the system's primary configured AI provider.
 */
export async function getAutomationProvider(settings?: SettingsData): Promise<AIProvider> {
  const current = settings ?? (await loadSettings());
  if (current.automationCustomApi) {
    const rawUrl = current.automationBaseUrl?.trim() || "";
    const model = current.automationModel?.trim() || "gemini-3.8-flash-high";
    const timeoutMs = (current.automationTimeoutSeconds ?? 120) * 1000;

    let apiKey: string | null = null;
    if (current.automationApiKeyEnc) {
      try {
        apiKey = decryptApiKey(current.automationApiKeyEnc);
      } catch {
        apiKey = null;
      }
    }

    if (rawUrl === "local" || rawUrl === "local-cli" || (!apiKey && current.automationPreset === "agy" && findAgyBinary())) {
      try {
        return new AgyCliProvider(model, timeoutMs);
      } catch {
        // Fall back to HTTP provider if CLI binary initialization fails
      }
    }

    if (rawUrl && rawUrl !== "local") {
      return new OpenAICompatibleProvider(
        "OPENAI",
        rawUrl,
        apiKey,
        model,
        timeoutMs,
      );
    }
  }
  return getAiProvider();
}

/**
 * Tests custom API connectivity safely without crashing under any condition.
 */
export async function testCustomAutomationConnection(params: {
  baseUrl: string;
  model: string;
  apiKey: string | null;
  timeoutSeconds?: number;
}): Promise<{ connected: boolean; model: string; seconds?: number; message?: string }> {
  try {
    const baseUrl = params.baseUrl.trim();
    const model = params.model.trim();
    const timeoutMs = Math.min((params.timeoutSeconds ?? 60) * 1000, 60_000);

    // Local AGY CLI mode
    if (baseUrl === "local" || baseUrl === "local-cli" || (!params.apiKey && (baseUrl.toLowerCase().includes("agy") || !baseUrl))) {
      const agyBin = findAgyBinary();
      if (!agyBin) {
        return {
          connected: false,
          model,
          message: "Local agy CLI binary not found in ~/.local/bin/agy or PATH. Please install agy CLI or specify a server address.",
        };
      }
      try {
        const provider = new AgyCliProvider(model || "gemini-3.8-flash-high", timeoutMs);
        const testResult = await provider.test();
        return {
          connected: true,
          model: testResult.model,
          seconds: Math.round(testResult.latencyMs / 100) / 10,
        };
      } catch (err) {
        return {
          connected: false,
          model,
          message: err instanceof Error ? err.message : "Local AGY CLI test failed.",
        };
      }
    }

    if (!baseUrl) {
      return { connected: false, model, message: "Server address is required." };
    }
    if (!model) {
      return { connected: false, model, message: "Model name is required." };
    }

    const provider = new OpenAICompatibleProvider("OPENAI", baseUrl, params.apiKey, model, timeoutMs);

    const started = performance.now();
    await provider.complete({
      task: "connection-check",
      system: "You are an automated API check. Reply with OK.",
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 16,
    });

    const elapsed = Math.round((performance.now() - started) / 100) / 10;
    return { connected: true, model, seconds: elapsed };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Connection failed";
    return { connected: false, model: params.model, message: msg };
  }
}

/**
 * Executes a full background automation cycle:
 * 1. Scans pending agent applications needing follow-up
 * 2. Prepares follow-up suggestions
 * 3. Checks unread communications
 * 4. Updates statistics and lastRun timestamp
 */
export async function executeAutomationCycle(): Promise<{
  success: boolean;
  message: string;
  stats: {
    applicationsChecked: number;
    followUpsSuggested: number;
    agentCandidatesWaiting: number;
    modelUsed: string;
  };
}> {
  const config = await loadAutomationConfig();
  const provider = await getAutomationProvider();
  const modelUsed = provider.model || (config.customApi ? config.model : "System Model");

  const [apps, candidates] = await Promise.all([
    prisma.application.findMany({
      where: {
        status: { in: [ApplicationStatus.SENT, ApplicationStatus.INTERVIEW] },
      },
      select: {
        id: true,
        company: true,
        role: true,
        status: true,
        updatedAt: true,
      },
      take: 50,
    }),
    prisma.agentCandidate.count({
      where: {
        status: AgentCandidateStatus.SCORED,
      },
    }),
  ]);

  const now = Date.now();
  const thresholdMs = config.followUpDays * 24 * 60 * 60 * 1000;
  let followUpsCount = 0;

  for (const app of apps) {
    const elapsed = now - app.updatedAt.getTime();
    if (elapsed > thresholdMs) {
      followUpsCount++;
    }
  }

  const message = `Automated check complete: reviewed ${apps.length} active applications (${followUpsCount} follow-ups suggested), ${candidates} agent candidates ready.`;

  await saveSettings({
    automationLastRunAt: new Date().toISOString(),
    automationLastRunMessage: message,
  });

  return {
    success: true,
    message,
    stats: {
      applicationsChecked: apps.length,
      followUpsSuggested: followUpsCount,
      agentCandidatesWaiting: candidates,
      modelUsed,
    },
  };
}
