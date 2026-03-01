// ── Field & Template Types ──

export type FieldType =
  | 'number'
  | 'rating'
  | 'time'
  | 'text'
  | 'textarea'
  | 'checkbox'
  | 'checklist'
  | 'select'
  | 'multi-select'
  | 'tristate';

export interface FieldOption {
  value: string;
  label: string;
}

export interface TemplateField {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  section: string;
  required: boolean;
  enabled: boolean;
  order: number;
  shortReport: boolean;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  options?: FieldOption[];
  emoji?: string;
  suffix?: string;
}

export interface TemplateSection {
  id: string;
  name: string;
  emoji: string;
  order: number;
  enabled: boolean;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  sections: TemplateSection[];
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

// ── Report ──

export interface ReportEntry {
  id: string;
  templateId: string;
  templateName: string;
  date: string;
  values: Record<string, any>;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Focus ──

export interface FocusSession {
  id: string;
  type: 'pomodoro' | 'deepwork';
  durationMinutes: number;
  remainingSeconds: number;
  status: 'running' | 'paused' | 'completed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  blockingEnabled: boolean;
}

// ── Blocker ──

export interface BlockRuleSchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  days: number[];
}

export interface BlockRule {
  id: string;
  category: 'social' | 'adult' | 'custom';
  name: string;
  domains: string[];
  keywords: string[];
  enabled: boolean;
  strictLevel: 1 | 2 | 3 | 4;
  schedule?: BlockRuleSchedule;
  duringFocusOnly: boolean;
}

export interface UnlockAttempt {
  id: string;
  ruleId: string;
  ruleName: string;
  url: string;
  reason: string;
  alternative: string;
  timestamp: string;
  granted: boolean;
  level: number;
}

// ── Settings ──

export interface BlockerSettings {
  enabled: boolean;
  pin: string;
  strictLevel: 1 | 2 | 3 | 4;
  delayMinutes: number;
  emergencyAccessDays: number;
  lastEmergencyAccess: string | null;
  allowlist: string[];
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  defaultTemplateId: string;
  blockerSettings: BlockerSettings;
}
