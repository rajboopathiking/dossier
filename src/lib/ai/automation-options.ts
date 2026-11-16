export type AutomationPreset = "opencode" | "agy" | "custom";

export const AGENT_AI_ENGINES = [
  {
    id: "primary",
    label: "Primary AI Provider",
    hint: "Use your main AI provider configured in Settings → AI provider",
  },
  {
    id: "opencode",
    label: "OpenCode (Local / Zen)",
    hint: "Local OpenCode CLI (http://localhost:4096/v1 - No API key needed) or OpenCode cloud",
  },
  {
    id: "agy",
    label: "AGY (Local CLI / Antigravity)",
    hint: "Local agy CLI via Google Antigravity session (No API key needed!) or cloud endpoint",
  },
  {
    id: "custom",
    label: "Custom Automation API",
    hint: "Custom endpoint configured in Settings → Automation",
  },
] as const;

export type AgentAiEngine = (typeof AGENT_AI_ENGINES)[number]["id"];

export const AUTOMATION_PRESETS: Record<
  AutomationPreset,
  { label: string; defaultUrl: string; defaultModel: string; description: string }
> = {
  opencode: {
    label: "OpenCode (Local CLI / Zen)",
    defaultUrl: "http://localhost:4096/v1",
    defaultModel: "opencode",
    description: "Local OpenCode CLI at localhost:4096 (no API key needed) or OpenCode cloud.",
  },
  agy: {
    label: "AGY (Local CLI / Antigravity)",
    defaultUrl: "local",
    defaultModel: "gemini-3.8-flash-high",
    description: "Local agy CLI authenticated with Google Antigravity (no API key needed!).",
  },
  custom: {
    label: "Custom API Endpoint",
    defaultUrl: "",
    defaultModel: "",
    description: "Any custom OpenAI-compatible server, proxy, or local gateway.",
  },
};

export type AutomationConfig = {
  customApi: boolean;
  preset: AutomationPreset;
  baseUrl: string;
  model: string;
  apiKey: string | null;
  timeoutSeconds: number;
  intervalHours: number;
  autoFollowUp: boolean;
  followUpDays: number;
  atsOptimize: boolean;
  autoClassify: boolean;
  lastRunAt: string | null;
  lastRunMessage: string | null;
};
