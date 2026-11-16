"use client";

import { AlertCircle, CheckCircle2, Play, RefreshCw, Sparkles, Zap } from "lucide-react";
import { useState, useTransition } from "react";

import { useTrackSave } from "@/components/save-tracker";
import { toast, toastResult } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  AUTOMATION_PRESETS,
  AGENT_AI_ENGINES,
  type AgentAiEngine,
  type AutomationConfig,
  type AutomationPreset,
} from "@/lib/ai/automation-options";
import type { KeyState } from "@/lib/ai/provider-options";
import { cn } from "@/lib/cn";

import {
  runAutomationNow,
  saveAutomationApiKey,
  saveAutomationSettings,
  testAutomationConnection,
} from "./actions";
import { SettingsSectionIntro } from "./settings-screen";

type Connection =
  | { status: "untested" }
  | { status: "testing" }
  | { status: "connected"; model: string; seconds: number }
  | { status: "failed"; message: string };

type RunResult = {
  success: boolean;
  message: string;
  stats?: {
    applicationsChecked: number;
    followUpsSuggested: number;
    agentCandidatesWaiting: number;
    modelUsed: string;
  };
};

export function AutomationSection({
  initial,
  keyState: initialKeyState,
  primaryModel,
  agentAiEngine: initialAgentAiEngine = "primary",
}: {
  initial: AutomationConfig;
  keyState: KeyState;
  primaryModel: string;
  agentAiEngine?: AgentAiEngine;
}) {
  const track = useTrackSave();
  const [pending, startTransition] = useTransition();

  const [agentAiEngine, setAgentAiEngine] = useState<AgentAiEngine>(initialAgentAiEngine);
  const [customApi, setCustomApi] = useState(initial.customApi);
  const [preset, setPreset] = useState<AutomationPreset>(initial.preset);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [timeoutInput, setTimeoutInput] = useState(String(initial.timeoutSeconds));
  const [keyState, setKeyState] = useState<KeyState>(initialKeyState);
  const [keyInput, setKeyInput] = useState("");

  const [intervalHours, setIntervalHours] = useState(initial.intervalHours);
  const [autoFollowUp, setAutoFollowUp] = useState(initial.autoFollowUp);
  const [followUpDays, setFollowUpDays] = useState(initial.followUpDays);
  const [atsOptimize, setAtsOptimize] = useState(initial.atsOptimize);
  const [autoClassify, setAutoClassify] = useState(initial.autoClassify);

  const [connection, setConnection] = useState<Connection>({ status: "untested" });
  const [lastRunAt, setLastRunAt] = useState<string | null>(initial.lastRunAt);
  const [lastRunMessage, setLastRunMessage] = useState<string | null>(initial.lastRunMessage);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const saveConfig = (next: Parameters<typeof saveAutomationSettings>[0]) => {
    void track(saveAutomationSettings(next)).then((result) => {
      toastResult(result);
    });
  };

  const handleToggleCustomApi = (enabled: boolean) => {
    setCustomApi(enabled);
    saveConfig({ automationCustomApi: enabled });
    setConnection({ status: "untested" });
  };

  const handleSelectPreset = (chosen: AutomationPreset) => {
    setPreset(chosen);
    const p = AUTOMATION_PRESETS[chosen];
    setBaseUrl(p.defaultUrl);
    setModel(p.defaultModel);
    saveConfig({
      automationPreset: chosen,
      automationBaseUrl: p.defaultUrl,
      automationModel: p.defaultModel,
    });
    setConnection({ status: "untested" });
  };

  const saveKey = async (change: { action: "set"; value: string } | { action: "clear" }) => {
    const result = toastResult(await track(saveAutomationApiKey({ change })));
    if (!result.ok) return;
    setKeyState(result.data.keyState);
    setKeyInput("");
    setConnection({ status: "untested" });
  };

  const testConnection = async () => {
    if (connection.status === "testing") return;
    if (keyInput.trim()) {
      await saveKey({ action: "set", value: keyInput });
    }
    setConnection({ status: "testing" });
    const result = await testAutomationConnection({
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      useCustom: customApi,
    });
    if (!result.ok) {
      setConnection({ status: "failed", message: result.error });
    } else if (result.data.connected) {
      setConnection({
        status: "connected",
        model: result.data.model,
        seconds: result.data.seconds ?? 0.5,
      });
    } else {
      setConnection({ status: "failed", message: result.data.message ?? "Connection failed." });
    }
  };

  const handleAgentEngineChange = (engine: AgentAiEngine) => {
    setAgentAiEngine(engine);
    void track(saveAutomationSettings({ agentAiEngine: engine })).then((res) => {
      toastResult(res);
    });
  };

  const executeNow = () => {
    startTransition(async () => {
      const result = await runAutomationNow({});
      if (!result.ok) {
        toast(result.error);
        return;
      }
      setRunResult(result.data);
      setLastRunAt(new Date().toISOString());
      setLastRunMessage(result.data.message);
      toast("Automation cycle executed successfully.");
    });
  };

  return (
    <>
      <SettingsSectionIntro title="Automation">
        Automate your job search workflow, recurring scans, application follow-ups, and resume optimization. Route automations through your primary model or configure a dedicated custom API (like OpenCode or an AGY model) without server crashes.
      </SettingsSectionIntro>

      {/* Model Engine Configuration */}
      <Card padding="none" className="flex flex-col gap-5 px-7 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-serif text-[18px] font-medium text-ink flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Automation Engine & Model
            </h3>
            <p className="text-meta text-muted mt-1">
              Currently using:{" "}
              <strong className="text-ink">
                {customApi ? (model || "Custom API Model") : (primaryModel || "System AI Provider")}
              </strong>
            </p>
          </div>
        </div>

        <Toggle
          label="Use custom API for automations"
          description={
            customApi
              ? "On. Automations run through the custom API endpoint below (e.g. OpenCode, AGY model, local proxy)."
              : "Off. Automations use the primary AI provider configured in Settings → AI provider."
          }
          checked={customApi}
          onCheckedChange={handleToggleCustomApi}
        />

        {customApi && (
          <div className="border-t border-line pt-4 flex flex-col gap-4">
            <div>
              <span className="text-label text-muted">Quick Preset</span>
              <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {(Object.keys(AUTOMATION_PRESETS) as AutomationPreset[]).map((key) => {
                  const item = AUTOMATION_PRESETS[key];
                  const selected = preset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectPreset(key)}
                      className={cn(
                        "flex flex-col gap-1 rounded-card border p-3 text-left transition-all",
                        selected
                          ? "border-primary bg-selected text-ink shadow-[0_0_0_1px_var(--color-primary)]"
                          : "border-line-card bg-card text-muted hover:border-line-strong hover:text-ink",
                      )}
                    >
                      <span className="text-[13.5px] font-medium text-ink">{item.label}</span>
                      <span className="text-[11.5px] leading-tight text-muted">{item.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
              <Input
                className="sm:col-span-2"
                label="Custom API Server Address"
                placeholder={
                  preset === "opencode"
                    ? "http://localhost:4096/v1"
                    : preset === "agy"
                      ? "local"
                      : "https://your-custom-api.example/v1"
                }
                value={baseUrl}
                onChange={(e) => {
                  setBaseUrl(e.target.value);
                  setConnection({ status: "untested" });
                }}
                onBlur={() => saveConfig({ automationBaseUrl: baseUrl })}
                hint={
                  preset === "opencode"
                    ? "Local OpenCode CLI: http://localhost:4096/v1 (No API key needed!) or OpenCode cloud URL."
                    : preset === "agy"
                      ? "Local AGY CLI: enter 'local' to use ~/.local/bin/agy directly (No API key needed!)."
                      : "Enter any OpenAI-compatible base URL."
                }
              />

              <Input
                label="Model Name"
                placeholder={
                  preset === "opencode"
                    ? "opencode"
                    : preset === "agy"
                      ? "gemini-3.8-flash-high"
                      : "custom-model"
                }
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setConnection({ status: "untested" });
                }}
                onBlur={() => saveConfig({ automationModel: model })}
                hint={
                  preset === "agy"
                    ? "e.g. gemini-3.8-flash-high, gemini-3.8-flash-medium, or gemini-2.5-flash."
                    : "Model name for automated tasks."
                }
              />

              <div className="flex flex-col gap-2">
                <Input
                  label="API Key (optional / encrypted)"
                  type="password"
                  value={keyInput}
                  placeholder={
                    keyState === "set"
                      ? "Saved · enter new to replace"
                      : "Not needed for local AGY or local OpenCode CLI"
                  }
                  onChange={(e) => setKeyInput(e.target.value)}
                  onBlur={() => {
                    if (keyInput.trim()) void saveKey({ action: "set", value: keyInput });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && keyInput.trim()) {
                      e.preventDefault();
                      void saveKey({ action: "set", value: keyInput });
                    }
                  }}
                  hint="Leave blank for local AGY or local OpenCode CLI. Only needed for cloud endpoints."
                />
                {keyState === "set" && (
                  <Button
                    variant="text"
                    size="sm"
                    className="self-start text-xs"
                    onClick={() => void saveKey({ action: "clear" })}
                  >
                    Remove custom API key
                  </Button>
                )}
              </div>

              <Input
                label="Timeout (seconds)"
                value={timeoutInput}
                onChange={(e) => setTimeoutInput(e.target.value)}
                onBlur={() => {
                  const val = Number(timeoutInput);
                  if (Number.isInteger(val) && val >= 5 && val <= 3600) {
                    saveConfig({ automationTimeoutSeconds: val });
                  }
                }}
                hint="Default is 120s. Max is 3600s."
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void testConnection()}
                disabled={connection.status === "testing"}
              >
                {connection.status === "testing" ? "Testing connection…" : "Test API Connection"}
              </Button>

              {connection.status === "connected" && (
                <span className="flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle2 size={15} />
                  Connected · {connection.model} ({connection.seconds}s latency)
                </span>
              )}
              {connection.status === "failed" && (
                <span className="flex items-center gap-1.5 text-xs text-error">
                  <AlertCircle size={15} />
                  {connection.message}
                </span>
              )}
              {connection.status === "untested" && (
                <span className="text-xs text-muted">Untested since last modification</span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* AI Engine for Job Agent & Apply Card */}
      <Card padding="none" className="flex flex-col gap-5 px-7 py-6">
        <div>
          <h3 className="font-serif text-[18px] font-medium text-ink flex items-center gap-2">
            <Zap size={18} className="text-primary" />
            AI Engine for Job Agent & Apply
          </h3>
          <p className="text-meta text-muted mt-0.5">
            Choose which AI model the Job Agent uses for finding jobs, scoring candidate fit, and preparing application drafts (tailored resume and cover letter).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AGENT_AI_ENGINES.map((engine) => (
            <button
              key={engine.id}
              type="button"
              onClick={() => handleAgentEngineChange(engine.id)}
              className={cn(
                "flex flex-col items-start p-3.5 rounded-card border text-left transition-all",
                agentAiEngine === engine.id
                  ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                  : "border-border hover:border-muted-foreground/40 bg-card",
              )}
            >
              <div className="flex items-center gap-2 font-medium text-body">
                <span
                  className={cn(
                    "inline-block w-2.5 h-2.5 rounded-full",
                    agentAiEngine === engine.id ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                />
                {engine.label}
              </div>
              <p className="text-meta text-muted mt-1 text-xs">{engine.hint}</p>
            </button>
          ))}
        </div>

        <div className="rounded-card bg-muted/30 p-3 text-xs text-muted">
          {agentAiEngine === "opencode" && (
            <span>
              <strong>OpenCode Active:</strong> The job agent will score postings and write drafts via OpenCode at <code>{baseUrl || "http://localhost:4096/v1"}</code> (no API key required for local CLI).
            </span>
          )}
          {agentAiEngine === "agy" && (
            <span>
              <strong>AGY Active:</strong> The job agent will score postings and write drafts via local AGY CLI (<code>~/.local/bin/agy</code>) or Antigravity (no API key required!).
            </span>
          )}
          {agentAiEngine === "custom" && (
            <span>
              <strong>Custom Engine Active:</strong> The job agent will use your custom API at <code>{baseUrl || "endpoint"}</code> with model <code>{model || "model"}</code>.
            </span>
          )}
          {agentAiEngine === "primary" && (
            <span>
              <strong>Primary AI Provider Active:</strong> The job agent will use your main AI provider (<code>{primaryModel}</code>).
            </span>
          )}
        </div>
      </Card>

      {/* Automated Workflows Card */}
      <Card padding="none" className="flex flex-col gap-5 px-7 py-6">
        <div>
          <h3 className="font-serif text-[18px] font-medium text-ink flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            Active Automation Rules
          </h3>
          <p className="text-meta text-muted mt-0.5">
            Configure intelligent background automations and monitoring thresholds.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Automation scan frequency"
            value={String(intervalHours)}
            onChange={(e) => {
              const val = Number(e.target.value);
              setIntervalHours(val);
              saveConfig({ automationIntervalHours: val });
            }}
            hint="Frequency for recurring automated checks"
          >
            <option value="6">Every 6 hours</option>
            <option value="12">Every 12 hours</option>
            <option value="24">Daily (Every 24 hours)</option>
            <option value="48">Every 48 hours</option>
          </Select>

          <Select
            label="Follow-up reminder threshold"
            value={String(followUpDays)}
            disabled={!autoFollowUp}
            onChange={(e) => {
              const val = Number(e.target.value);
              setFollowUpDays(val);
              saveConfig({ automationFollowUpDays: val });
            }}
            hint="Flag applications when no news arrives after this period"
          >
            <option value="3">3 days</option>
            <option value="5">5 days</option>
            <option value="7">7 days (Recommended)</option>
            <option value="10">10 days</option>
            <option value="14">14 days</option>
          </Select>
        </div>

        <div className="flex flex-col gap-3.5 border-t border-line pt-4">
          <Toggle
            label="Smart application follow-up suggestions"
            description={
              autoFollowUp
                ? `Active. Suggests follow-up check-ins and drafting for jobs awaiting news past ${followUpDays} days.`
                : "Off. Follow-up reminders are disabled."
            }
            checked={autoFollowUp}
            onCheckedChange={(checked) => {
              setAutoFollowUp(checked);
              saveConfig({ automationAutoFollowUp: checked });
            }}
          />

          <Toggle
            label="Automated ATS & role alignment check"
            description={
              atsOptimize
                ? "Active. Evaluates target posting keywords and checks qualification alignment against your profile."
                : "Off. ATS keyword checks run only on manual demand."
            }
            checked={atsOptimize}
            onCheckedChange={(checked) => {
              setAtsOptimize(checked);
              saveConfig({ automationAtsOptimize: checked });
            }}
          />

          <Toggle
            label="Auto-classify communication updates"
            description={
              autoClassify
                ? "Active. Automatically tags responses as Interview, Offer, Screen, or Need Response."
                : "Off. Manual communication classification only."
            }
            checked={autoClassify}
            onCheckedChange={(checked) => {
              setAutoClassify(checked);
              saveConfig({ automationAutoClassify: checked });
            }}
          />
        </div>
      </Card>

      {/* Manual Execution & Status Card */}
      <Card padding="none" className="flex flex-col gap-4 px-7 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-[18px] font-medium text-ink flex items-center gap-2">
              <Play size={18} className="text-primary" />
              Automation Run & Health Status
            </h3>
            <p className="text-meta text-muted mt-0.5">
              {lastRunAt
                ? `Last executed: ${new Date(lastRunAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`
                : "Never executed yet"}
            </p>
          </div>

          <Button
            size="sm"
            onClick={executeNow}
            disabled={pending}
            className="flex items-center gap-1.5"
          >
            {pending ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Executing cycle…
              </>
            ) : (
              <>
                <Play size={14} />
                Run Automation Now
              </>
            )}
          </Button>
        </div>

        {lastRunMessage && (
          <div className="rounded-card bg-paper p-3.5 text-xs text-muted border border-line-card">
            <span className="font-medium text-ink block mb-0.5">Latest execution report:</span>
            {lastRunMessage}
          </div>
        )}

        {runResult?.stats && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-1">
            <div className="rounded-card bg-surface border border-line-card p-3 text-center">
              <span className="block text-2xl font-serif text-ink">{runResult.stats.applicationsChecked}</span>
              <span className="text-[11px] text-muted">Applications Checked</span>
            </div>
            <div className="rounded-card bg-surface border border-line-card p-3 text-center">
              <span className="block text-2xl font-serif text-primary">{runResult.stats.followUpsSuggested}</span>
              <span className="text-[11px] text-muted">Follow-ups Flagged</span>
            </div>
            <div className="rounded-card bg-surface border border-line-card p-3 text-center">
              <span className="block text-2xl font-serif text-ink">{runResult.stats.agentCandidatesWaiting}</span>
              <span className="text-[11px] text-muted">Candidates Waiting</span>
            </div>
            <div className="rounded-card bg-surface border border-line-card p-3 text-center">
              <span className="block text-sm font-medium text-ink truncate mt-1.5">{runResult.stats.modelUsed}</span>
              <span className="text-[11px] text-muted">Engine Model</span>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
