import "server-only";

import { decryptApiKey } from "@/lib/ai/api-key";
import { loadAiConfig } from "@/lib/ai/config";
import { getAiProvider, type AIProvider } from "@/lib/ai";
import { AgyCliProvider, findAgyBinary } from "@/lib/ai/providers/agy-cli";
import { OpenAICompatibleProvider } from "@/lib/ai/providers/openai-compatible";
import type { SettingsData } from "@/lib/settings";
import { loadSettings } from "@/lib/settings-data";
import { recordUsage } from "@/lib/usage-data";

/**
 * Returns the AI Provider dedicated for the Job Agent:
 * - Scanning & fit scoring postings
 * - Reading posting requirements
 * - Writing tailored resume and cover letter drafts
 *
 * Configurable via Settings → Job agent or Settings → Automation.
 * Supports Primary AI, OpenCode (local or cloud), AGY (local CLI or Gemini endpoint),
 * or Custom OpenAI-compatible endpoints.
 */
export async function getAgentAiProvider(settings?: SettingsData): Promise<AIProvider> {
  const current = settings ?? (await loadSettings());
  const engine = current.agentAiEngine;

  if (engine === "opencode") {
    const url =
      current.automationPreset === "opencode" && current.automationBaseUrl
        ? current.automationBaseUrl
        : "http://localhost:4096/v1";
    const model =
      current.automationPreset === "opencode" && current.automationModel
        ? current.automationModel
        : "opencode";
    let apiKey: string | null = null;
    if (current.automationApiKeyEnc) {
      try {
        apiKey = decryptApiKey(current.automationApiKeyEnc);
      } catch {
        apiKey = null;
      }
    }
    const timeoutMs = (current.automationTimeoutSeconds ?? 120) * 1000;
    return new OpenAICompatibleProvider("OPENAI", url, apiKey, model, timeoutMs, recordUsage);
  }

  if (engine === "agy") {
    const rawUrl =
      current.automationPreset === "agy" && current.automationBaseUrl
        ? current.automationBaseUrl.trim()
        : "local";
    const model =
      current.automationPreset === "agy" && current.automationModel
        ? current.automationModel.trim()
        : "gemini-3.8-flash-high";
    let apiKey: string | null = null;
    if (current.automationApiKeyEnc) {
      try {
        apiKey = decryptApiKey(current.automationApiKeyEnc);
      } catch {
        apiKey = null;
      }
    }
    const timeoutMs = (current.automationTimeoutSeconds ?? 120) * 1000;

    // Use local agy CLI if requested or if no key is provided and agy binary is present
    if (rawUrl === "local" || rawUrl === "local-cli" || (!apiKey && (!rawUrl || rawUrl.includes("googleapis")) && findAgyBinary())) {
      try {
        return new AgyCliProvider(model, timeoutMs, recordUsage);
      } catch {
        // Fall back to OpenAI compatible provider if binary initialization fails
      }
    }

    const url = rawUrl && rawUrl !== "local" ? rawUrl : "https://generativelanguage.googleapis.com/v1beta/openai";
    if (!apiKey) {
      const primaryConfig = await loadAiConfig();
      apiKey = primaryConfig.apiKey || process.env.GEMINI_API_KEY || null;
    }
    return new OpenAICompatibleProvider("OPENAI", url, apiKey, model, timeoutMs, recordUsage);
  }

  if (engine === "custom") {
    const url = current.automationBaseUrl || "http://localhost:4096/v1";
    const model = current.automationModel || "custom-model";
    let apiKey: string | null = null;
    if (current.automationApiKeyEnc) {
      try {
        apiKey = decryptApiKey(current.automationApiKeyEnc);
      } catch {
        apiKey = null;
      }
    }
    const timeoutMs = (current.automationTimeoutSeconds ?? 120) * 1000;
    return new OpenAICompatibleProvider("OPENAI", url, apiKey, model, timeoutMs, recordUsage);
  }

  // If automationCustomApi is turned on and custom settings exist
  if (current.automationCustomApi && current.automationBaseUrl && current.automationModel) {
    let apiKey: string | null = null;
    if (current.automationApiKeyEnc) {
      try {
        apiKey = decryptApiKey(current.automationApiKeyEnc);
      } catch {
        apiKey = null;
      }
    }
    const timeoutMs = (current.automationTimeoutSeconds ?? 120) * 1000;
    return new OpenAICompatibleProvider("OPENAI", current.automationBaseUrl, apiKey, current.automationModel, timeoutMs, recordUsage);
  }

  return getAiProvider();
}
