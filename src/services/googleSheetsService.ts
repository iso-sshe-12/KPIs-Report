import { DEFAULT_RAW_CSV } from '../data/rawKpiCsv';
import { parseKpiCsv } from './kpiParser';
import { DepartmentCode, DepartmentSummary, KPIItem, SyncSettings } from '../types';

const STORAGE_KEY_SHEET_URL = 'fy2026_kpi_sheet_url';
const STORAGE_KEY_INTERVAL = 'fy2026_kpi_sync_interval';
const STORAGE_KEY_AUTO_SYNC = 'fy2026_kpi_auto_sync';
export const STORAGE_KEY_CACHED_CSV = 'fy2026_kpi_cached_csv_v7';

export function safeGetLocalStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch (e) {
    // Sandboxed iframe or cookies disabled
  }
  return null;
}

export function safeSetLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch (e) {
    // Sandboxed iframe or cookies disabled
  }
}

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1example-fy2026-executive-kpi/edit#gid=0';

export function getResolvedSheetUrl(providedUrl?: string): string {
  if (providedUrl && providedUrl.trim()) return providedUrl.trim();

  // 1. Check URL query parameters (useful for Google Sites iframe: ?sheet=... or ?sheetUrl=...)
  if (typeof window !== 'undefined' && window.location) {
    try {
      const params = new URLSearchParams(window.location.search);
      const paramUrl = params.get('sheetUrl') || params.get('sheet');
      if (paramUrl && paramUrl.trim()) {
        const decoded = decodeURIComponent(paramUrl.trim());
        safeSetLocalStorage(STORAGE_KEY_SHEET_URL, decoded);
        return decoded;
      }
    } catch (e) {
      // Ignore URL parsing errors
    }
  }

  // 2. Check localStorage
  const savedUrl = safeGetLocalStorage(STORAGE_KEY_SHEET_URL);
  if (savedUrl && savedUrl.trim()) return savedUrl.trim();

  // 3. Check Vite environment variable
  const envUrl = ((import.meta as any).env?.VITE_GOOGLE_SHEET_URL as string) || '';
  if (envUrl && envUrl.trim()) return envUrl.trim();

  return '';
}

export function getInitialSyncSettings(): SyncSettings {
  const savedUrl = getResolvedSheetUrl();
  const storedInterval = safeGetLocalStorage(STORAGE_KEY_INTERVAL);
  const parsedInterval = storedInterval ? parseInt(storedInterval, 10) : 60;
  // Default to 60 minutes (1 hour). If previously set to legacy 10-minute default, automatically migrate to 60 minutes.
  const savedInterval = isNaN(parsedInterval) || parsedInterval === 10 ? 60 : parsedInterval;
  const autoSync = safeGetLocalStorage(STORAGE_KEY_AUTO_SYNC) !== 'false';

  return {
    sheetUrl: savedUrl,
    sheetId: extractSheetId(savedUrl),
    sheetGid: extractGid(savedUrl),
    autoSyncEnabled: autoSync,
    intervalMinutes: savedInterval,
    lastSyncTime: null,
    syncStatus: 'idle',
  };
}

export function saveSyncSettings(settings: Partial<SyncSettings>) {
  if (settings.sheetUrl !== undefined) {
    safeSetLocalStorage(STORAGE_KEY_SHEET_URL, settings.sheetUrl);
  }
  if (settings.intervalMinutes !== undefined) {
    safeSetLocalStorage(STORAGE_KEY_INTERVAL, settings.intervalMinutes.toString());
  }
  if (settings.autoSyncEnabled !== undefined) {
    safeSetLocalStorage(STORAGE_KEY_AUTO_SYNC, settings.autoSyncEnabled ? 'true' : 'false');
  }
}

export function extractSheetId(url: string): string {
  // Published web link format: /d/e/(2PACX-...)/pub
  const pubMatch = url.match(/\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) return pubMatch[1];

  // Standard sheet ID format: /d/([a-zA-Z0-9-_]+)
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1] !== 'e') return match[1];

  return '';
}

export function extractGid(url: string): string {
  const match = url.match(/[?&#]gid=([0-9]+)/);
  return match ? match[1] : '0';
}

export function buildPossibleCsvUrls(cleanUrl: string): string[] {
  const urls: string[] = [];

  // 1. If it already has CSV export parameter, try it directly
  if (cleanUrl.includes('output=csv') || cleanUrl.includes('format=csv') || cleanUrl.includes('tqx=out:csv')) {
    urls.push(cleanUrl);
  }

  const gid = extractGid(cleanUrl);

  // 2. Published web link: /d/e/2PACX-...
  const pubMatch = cleanUrl.match(/\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch) {
    const pubId = pubMatch[1];
    urls.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv${gid !== '0' ? `&gid=${gid}` : ''}`);
    urls.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`);
  }

  // 3. Standard Google Sheets URL: /d/SHEET_ID
  const match = cleanUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1] !== 'e') {
    const sheetId = match[1];
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
    urls.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
  }

  // 4. Fallback: URL itself if not yet added
  if (!urls.includes(cleanUrl)) {
    urls.push(cleanUrl);
  }

  return urls;
}

export async function fetchKpiData(url?: string): Promise<{ items: KPIItem[]; rawCsv: string; source: 'google_sheets' | 'cached' | 'default' }> {
  const targetUrl = getResolvedSheetUrl(url);

  if (targetUrl && targetUrl.trim()) {
    const cleanUrl = targetUrl.trim();

    // Step 1: Try server-side proxy (bypasses CORS and injects fresh headers)
    try {
      const response = await fetch(`/api/sheets/fetch?url=${encodeURIComponent(cleanUrl)}&_t=${Date.now()}`);
      if (response.ok) {
        const csvText = await response.text();
        if (csvText && csvText.length > 50 && !csvText.includes('<!DOCTYPE html>') && !csvText.includes('accounts.google.com')) {
          safeSetLocalStorage(STORAGE_KEY_CACHED_CSV, csvText);
          const parsed = parseKpiCsv(csvText);
          if (parsed.length > 0) {
            return { items: parsed, rawCsv: csvText, source: 'google_sheets' };
          }
        }
      }
    } catch (proxyErr) {
      console.warn('Backend proxy fetch unavailable (likely static host such as GitHub Pages):', proxyErr);
    }

    // Step 2: Direct Client-side fetch fallback (works on GitHub Pages / Static Hosting / Google Sites iframe)
    const possibleUrls = buildPossibleCsvUrls(cleanUrl);

    for (const rawFetchUrl of possibleUrls) {
      const sep = rawFetchUrl.includes('?') ? '&' : '?';
      const freshUrl = `${rawFetchUrl}${sep}_t=${Date.now()}`;
      try {
        const directRes = await fetch(freshUrl, {
          headers: {
            Accept: 'text/csv,text/plain,*/*',
          },
        });
        if (directRes.ok) {
          const csvText = await directRes.text();
          if (csvText && csvText.length > 50 && !csvText.includes('<!DOCTYPE html>') && !csvText.includes('accounts.google.com')) {
            safeSetLocalStorage(STORAGE_KEY_CACHED_CSV, csvText);
            const parsed = parseKpiCsv(csvText);
            if (parsed.length > 0) {
              return { items: parsed, rawCsv: csvText, source: 'google_sheets' };
            }
          }
        }
      } catch (directErr) {
        console.warn(`Direct client fetch from ${freshUrl} failed:`, directErr);
      }
    }

    // Step 3: CORS proxy fallback for GitHub Pages when Google Sheets lacks CORS headers
    for (const rawFetchUrl of possibleUrls) {
      const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rawFetchUrl)}&_t=${Date.now()}`;
      try {
        const proxyRes = await fetch(corsProxyUrl);
        if (proxyRes.ok) {
          const csvText = await proxyRes.text();
          if (csvText && csvText.length > 50 && !csvText.includes('<!DOCTYPE html>') && !csvText.includes('accounts.google.com')) {
            safeSetLocalStorage(STORAGE_KEY_CACHED_CSV, csvText);
            const parsed = parseKpiCsv(csvText);
            if (parsed.length > 0) {
              return { items: parsed, rawCsv: csvText, source: 'google_sheets' };
            }
          }
        }
      } catch (e) {
        // Silently continue
      }
    }
  }

  // Check cached CSV in localStorage
  const cached = safeGetLocalStorage(STORAGE_KEY_CACHED_CSV);
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
