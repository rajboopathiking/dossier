import "server-only";

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import { toJSONSchema } from "zod";

import type { UsageSink } from "@/lib/usage";
import { AiError } from "../errors";
import { BaseProvider, type ChatAnswer, type ChatCall } from "../provider";

const execFileAsync = promisify(execFile);

export const DEFAULT_AGY_MODELS = [
  "gemini-3.8-flash-high",
  "gemini-3.8-flash-medium",
  "gemini-3.8-flash-low",
  "claude-sonnet-4-6",
  "claude-opus-4-6-thinking",
  "gpt-oss-120b-medium",
] as const;

/**
 * Finds the local agy CLI executable on the system.
 */
export function findAgyBinary(): string | null {
  if (process.env.AGY_PATH && existsSync(process.env.AGY_PATH)) {
    return process.env.AGY_PATH;
  }
  const home = homedir();
  const candidates = [
    join(home, ".local", "bin", "agy"),
    "/usr/local/bin/agy",
    "/opt/homebrew/bin/agy",
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/**
 * AI Provider that routes prompts directly through the local `agy` CLI
 * using the user's active Google Antigravity session — without requiring any API key.
 */
export class AgyCliProvider extends BaseProvider {
  readonly kind = "LOCAL" as const;
  private readonly binaryPath: string;

  constructor(
    model: string | null = "gemini-3.8-flash-high",
    timeoutMs = 120_000,
    onUsage?: UsageSink,
    binaryPath?: string,
  ) {
    super(model || "gemini-3.8-flash-high", timeoutMs, onUsage);
    const resolved = binaryPath || findAgyBinary();
    if (!resolved) {
      throw AiError.config("Local `agy` CLI binary was not found in ~/.local/bin/agy or PATH.");
    }
    this.binaryPath = resolved;
  }

  protected async chat(call: ChatCall): Promise<ChatAnswer> {
    const promptParts: string[] = [];

    // Explicitly instruct the model to behave as a pure completion engine and not invoke tools
    promptParts.push(
      "DIRECT COMPLETION MODE: You are answering a direct API query. DO NOT call tools, do NOT read files or inspect the workspace, and do NOT run commands. Respond immediately with the required answer.",
    );

    if (call.system) {
      promptParts.push(`SYSTEM INSTRUCTIONS:\n${call.system}`);
    }

    for (const msg of call.messages) {
      promptParts.push(`${msg.role.toUpperCase()}:\n${msg.content}`);
    }

    if (call.json) {
      let schemaDescription = call.json.name;
      try {
        schemaDescription = JSON.stringify(toJSONSchema(call.json.schema));
      } catch {
        // Fall back to schema name
      }
      promptParts.push(
        `\nIMPORTANT: Respond ONLY with a valid JSON object conforming strictly to the following schema:
${schemaDescription}
Do NOT include markdown code fences or any conversational preamble/postscript.`,
      );
    }

    const fullPrompt = promptParts.join("\n\n");

    // Resolve model and effort to prevent CLI conflict
    // e.g. --model gemini-3.8-flash-high conflicts with --effort=low
    let modelToUse = call.model || this.model || "gemini-3.8-flash-high";
    const requestedEffort = call.effort || "low";
    let effortToPass: string | undefined = undefined;

    const suffixMatch = modelToUse.match(/-(high|medium|low)$/);
    if (suffixMatch) {
      if (call.effort) {
        // If the task explicitly requests an effort level (e.g. "low" for extraction),
        // adjust the model suffix to match so there is zero conflict and maximum speed.
        modelToUse = modelToUse.replace(/-(high|medium|low)$/, `-${requestedEffort}`);
        effortToPass = requestedEffort;
      } else {
        effortToPass = suffixMatch[1];
      }
    } else {
      effortToPass = requestedEffort;
    }

    const args = [
      "-p",
      fullPrompt,
      "--output-format",
      "json",
      "--disable-slash-commands",
      "--model",
      modelToUse,
    ];
    if (effortToPass) {
      args.push("--effort", effortToPass);
    }

    try {
      const { stdout } = await execFileAsync(this.binaryPath, args, {
        cwd: "/tmp",
        timeout: this.timeoutMs,
        signal: call.signal,
        maxBuffer: 20 * 1024 * 1024,
        env: {
          ...process.env,
          PATH: `${homedir()}/.local/bin:/usr/local/bin:/opt/homebrew/bin:${process.env.PATH ?? ""}`,
        },
      });

      let text = stdout.trim();
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        const parsed = JSON.parse(text) as {
          status?: string;
          response?: string;
          usage?: { input_tokens?: number; output_tokens?: number };
        };
        if (parsed.response !== undefined) {
          text = parsed.response.trim();
        }
        if (parsed.usage) {
          inputTokens = parsed.usage.input_tokens ?? 0;
          outputTokens = parsed.usage.output_tokens ?? 0;
        }
      } catch {
        // stdout was plain text instead of wrapper JSON
      }

      call.used({ input: inputTokens, output: outputTokens });
      return { text, cutOff: false };
    } catch (error: unknown) {
      if (call.signal?.aborted) {
        throw new AiError("timeout", "AGY CLI execution was cancelled or timed out.");
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new AiError("provider", `Local AGY CLI error: ${message}`);
    }
  }

  protected async fetchModels(_signal?: AbortSignal): Promise<string[]> {
    return [...DEFAULT_AGY_MODELS];
  }

  override async test(): Promise<{ model: string; latencyMs: number }> {
    const started = performance.now();
    const answer = await this.complete({
      task: "connection-check",
      system: "You are an automated CLI check.",
      messages: [{ role: "user", content: "Reply with the exact word: OK" }],
    });
    const latencyMs = Math.round(performance.now() - started);
    return { model: `${this.model ?? "gemini-3.8-flash-high"} (local agy CLI)`, latencyMs };
  }
}
