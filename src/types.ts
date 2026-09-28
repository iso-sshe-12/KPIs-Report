export type MonthKey =
  | 'APR'
  | 'MAY'
  | 'JUN'
  | 'JUL'
  | 'AUG'
  | 'SEP'
  | 'OCT'
  | 'NOV'
  | 'DEC'
  | 'JAN'
  | 'FEB'
  | 'MAR';

export const MONTHS: MonthKey[] = [
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
  'JAN',
  'FEB',
  'MAR',
];

export type DepartmentCode =
  | 'Corporate'
  | 'OPS'
  | 'CR'
  | 'WH'
  | 'Transport'
  | 'EN'
  | 'PU'
  | 'HR&GA'
  | 'QSHE'
  | 'IT'
  | 'ACC&FN';

export type ComparisonOperator = 'GTE' | 'LTE' | 'EQ';

export interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // Base64 data URL for preview and download
  uploadedAt: string;
}

export interface KPIItem {
  id: string;
  codeNumber: string;
  department: DepartmentCode;
  nameTh: string;
  nameEn?: string;
  targetRaw: string;
  targetValue: number;
  operator: ComparisonOperator; // 'GTE' for '>', 'LTE' for '<', 'EQ' for exact
  unit: string;
  isNew?: boolean; // Blue KPI starting 26/05/2025
  pic?: string;
  monthlyValues: Partial<Record<MonthKey, { raw: string; value?: number; isFailing?: boolean; isPending?: boolean }>>;
  totalRaw?: string;
  averageRaw?: string;
  averageValue?: number;
  isAverageFailing?: boolean;
  notes?: string;
  status: 'passed' | 'failed' | 'pending';
}

export interface DepartmentSummary {
  code: DepartmentCode;
  name: string;
  totalKpis: number;
  failingKpis: number;
  passedKpis: number;
  pendingKpis: number;
  reportedKpis?: number; // Total KPIs that have submitted actual data
  unreportedKpis?: number; // Total KPIs that have NOT submitted reports yet
  achievementRate: number;
}

export interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentScope: 'ALL' | DepartmentCode;
  enabled: boolean;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  breachedKpiCount: number;
  breachedKpis: Array<{
    name: string;
    department: DepartmentCode;
    target: string;
    actual: string;
    month?: string;
  }>;
  status: 'sent' | 'queued' | 'failed';
  triggerType: 'monthly_schedule' | 'manual' | 'test' | 'auto_10min';
}

export interface SyncSettings {
  sheetUrl: string;
  sheetId: string;
  sheetGid: string;
  autoSyncEnabled: boolean;
  intervalMinutes: number; // default 10
  lastSyncTime: string | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

export interface AlertSettings {
  enabled: boolean;
  notifyOnSync: boolean; // schedule enabled
  scheduleDayOfMonth: number; // default: 16
  scheduleTime: string; // default: "08:00"
  recipients: EmailRecipient[];
  webhookUrl?: string;
  alertOnDepartments: DepartmentCode[];
  lastDispatchedDate?: string; // e.g. "2026-09-16" to prevent duplicate triggers
  emailTemplate: {
    senderName: string;
    companyName: string;
    footerNote: string;
  };
}

export interface GoogleChatSettings {
  enabled: boolean;
  webhookUrl: string;
  reminderDayOfMonth: number; // default: 10
  reminderTime: string; // default: "09:00"
  deadlineDayOfMonth: number; // default: 15
  spaceName?: string;
  customNote?: string;
  lastSentMonth?: string; // e.g. "2026-09"
}

export interface GoogleChatLog {
  id: string;
  timestamp: string;
  spaceName: string;
  status: 'sent' | 'failed';
  message: string;
  triggerType: 'manual_test' | 'scheduled_monthly';
}
