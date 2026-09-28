import { DEFAULT_RAW_CSV } from '../data/rawKpiCsv';
import { parseKpiCsv } from './kpiParser';
import { DepartmentCode, DepartmentSummary, KPIItem, SyncSettings } from '../types';

const STORAGE_KEY_SHEET_URL = 'fy2026_kpi_sheet_url';
const STORAGE_KEY_INTERVAL = 'fy2026_kpi_sync_interval';
const STORAGE_KEY_AUTO_SYNC = 'fy2026_kpi_auto_sync';
const STORAGE_KEY_CACHED_CSV = 'fy2026_kpi_cached_csv_v5';

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1example-fy2026-executive-kpi/edit#gid=0';

export function getInitialSyncSettings(): SyncSettings {
  const savedUrl = localStorage.getItem(STORAGE_KEY_SHEET_URL) || '';
  const savedInterval = parseInt(localStorage.getItem(STORAGE_KEY_INTERVAL) || '10', 10);
  const autoSync = localStorage.getItem(STORAGE_KEY_AUTO_SYNC) !== 'false';

  return {
    sheetUrl: savedUrl,
    sheetId: extractSheetId(savedUrl),
    sheetGid: extractGid(savedUrl),
    autoSyncEnabled: autoSync,
    intervalMinutes: isNaN(savedInterval) ? 10 : savedInterval,
    lastSyncTime: null,
    syncStatus: 'idle',
  };
}

export function saveSyncSettings(settings: Partial<SyncSettings>) {
  if (settings.sheetUrl !== undefined) {
    localStorage.setItem(STORAGE_KEY_SHEET_URL, settings.sheetUrl);
  }
  if (settings.intervalMinutes !== undefined) {
    localStorage.setItem(STORAGE_KEY_INTERVAL, settings.intervalMinutes.toString());
  }
  if (settings.autoSyncEnabled !== undefined) {
    localStorage.setItem(STORAGE_KEY_AUTO_SYNC, settings.autoSyncEnabled ? 'true' : 'false');
  }
}

export function extractSheetId(url: string): string {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : '';
}

export function extractGid(url: string): string {
  const match = url.match(/gid=([0-9]+)/);
  return match ? match[1] : '0';
}

export async function fetchKpiData(url?: string): Promise<{ items: KPIItem[]; rawCsv: string; source: 'google_sheets' | 'cached' | 'default' }> {
  const targetUrl = url || localStorage.getItem(STORAGE_KEY_SHEET_URL);

  if (targetUrl && targetUrl.trim()) {
    try {
      const response = await fetch(`/api/sheets/fetch?url=${encodeURIComponent(targetUrl.trim())}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }
      const csvText = await response.text();
      if (csvText && csvText.length > 50) {
        localStorage.setItem(STORAGE_KEY_CACHED_CSV, csvText);
        const parsed = parseKpiCsv(csvText);
        if (parsed.length > 0) {
          return { items: parsed, rawCsv: csvText, source: 'google_sheets' };
        }
      }
    } catch (err) {
      console.warn('Live Google Sheets fetch failed, checking cached or default data:', err);
    }
  }

  // Check cached CSV in localStorage
  const cached = localStorage.getItem(STORAGE_KEY_CACHED_CSV);
  if (cached) {
    try {
      const parsed = parseKpiCsv(cached);
      if (parsed.length > 0) {
        return { items: parsed, rawCsv: cached, source: 'cached' };
      }
    } catch (e) {
      console.error('Failed to parse cached CSV:', e);
    }
  }

  // Fallback to the authentic FY2026 default dataset
  return {
    items: parseKpiCsv(DEFAULT_RAW_CSV),
    rawCsv: DEFAULT_RAW_CSV,
    source: 'default',
  };
}

export function computeDepartmentSummaries(items: KPIItem[]): DepartmentSummary[] {
  const deptNames: Record<DepartmentCode, string> = {
    Corporate: 'ฝ่ายบริหารและเป้าหมายหลัก (Corporate)',
    OPS: 'ฝ่ายปฏิบัติการตู้คอนเทนเนอร์ (OPS)',
    CR: 'ฝ่ายลูกค้าสัมพันธ์ (Customer Relations)',
    WH: 'ฝ่ายคลังสินค้า (Warehouse)',
    Transport: 'ฝ่ายขนส่ง (Transport)',
    EN: 'ฝ่ายวิศวกรรมและก่อสร้าง (EN)',
    PU: 'ฝ่ายจัดซื้อ (Procurement)',
    'HR&GA': 'ฝ่ายทรัพยากรบุคคลและบริหารงานทั่วไป (HR & GA)',
    QSHE: 'ฝ่ายคุณภาพ ความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม (QSHE)',
    IT: 'ฝ่ายเทคโนโลยีสารสนเทศ (IT)',
    'ACC&FN': 'ฝ่ายบัญชีและการเงิน (Accounting & Finance)',
  };

  const departments: DepartmentCode[] = [
    'Corporate',
    'OPS',
    'CR',
    'WH',
    'Transport',
    'EN',
    'PU',
    'HR&GA',
    'QSHE',
    'IT',
    'ACC&FN',
  ];

  return departments.map((dept) => {
    const deptItems = items.filter((k) => k.department === dept);
    const total = deptItems.length;
    const failing = deptItems.filter((k) => k.status === 'failed').length;
    const passed = deptItems.filter((k) => k.status === 'passed').length;
    const pending = total - (failing + passed);
    const evaluated = failing + passed;
    const achievementRate = evaluated > 0 ? Math.round((passed / evaluated) * 100) : 0;
    
    // Reported: items that have submitted actual data (status passed or failed, or has actual monthly inputs)
    const reportedKpis = deptItems.filter((k) => {
      if (k.status === 'passed' || k.status === 'failed') return true;
      // Also check monthly values if any numerical or non-pending value is present
      return Object.values(k.monthlyValues).some(
        (m) => m && m.value !== undefined && !m.isPending
      );
    }).length;
    const unreportedKpis = Math.max(0, total - reportedKpis);

    return {
      code: dept,
      name: deptNames[dept] || dept,
      totalKpis: total,
      failingKpis: failing,
      passedKpis: passed,
      pendingKpis: pending,
      reportedKpis,
      unreportedKpis,
      achievementRate,
    };
  });
}
