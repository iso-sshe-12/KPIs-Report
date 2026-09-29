import React from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  Globe,
  Lock,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SyncSettings } from '../types';

interface NavbarProps {
  syncSettings: SyncSettings;
  secondsRemaining: number;
  isSyncing: boolean;
  onManualSync: () => void;
  onOpenSheetsModal: () => void;
  onOpenAlertsModal: () => void;
  onOpenGoogleChatModal: () => void;
  onOpenRcaModal?: () => void;
  onOpenReportModal?: () => void;
  breachCount: number;
  dataSource: 'google_sheets' | 'cached' | 'default';
  isAdmin?: boolean;
  onOpenAdminModal?: () => void;
  isViewerPreview?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  syncSettings,
  secondsRemaining,
  isSyncing,
  onManualSync,
  onOpenSheetsModal,
  onOpenAlertsModal,
  onOpenGoogleChatModal,
  onOpenRcaModal,
  onOpenReportModal,
  breachCount,
  dataSource,
  isAdmin = false,
  onOpenAdminModal,
  isViewerPreview = false,
}) => {
  const { language, setLanguage, t } = useLanguage();

  const formatTime = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hours > 0) {
      return `${hours}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <span className="font-bold text-sm tracking-wider">FY26</span>
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                  {t.navbar.title}
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset">
                  {t.navbar.liveBadge}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                <span>{t.navbar.subCorporate}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-medium truncate">
                  {dataSource === 'google_sheets' ? (
                    <span className="text-emerald-600 flex items-center gap-1 truncate">
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> {t.navbar.sheetsConnected}
                    </span>
                  ) : (
                    <span className="text-slate-600 truncate">
                      {t.navbar.defaultData}
                    </span>
                  )}
                </span>
              </p>
            </div>
          </div>

          {/* Controls: Language Switcher, 10-Min Timer, Sync, Alerts, Sheets Settings */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Bilingual Language Switcher (TH / EN) */}
            <div
              id="language-switcher"
              className="flex items-center rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 text-xs shadow-2xs"
              role="group"
              aria-label="Language Selector"
            >
              <button
                id="btn-lang-th"
                onClick={() => setLanguage('th')}
                title="เปลี่ยนเป็นภาษาไทย (Switch to Thai)"
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  language === 'th'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="text-sm leading-none">🇹🇭</span>
                <span className="hidden xs:inline sm:inline">ไทย</span>
              </button>
              <button
                id="btn-lang-en"
                onClick={() => setLanguage('en')}
                title="Switch to English (เปลี่ยนเป็นภาษาอังกฤษ)"
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span className="text-sm leading-none">🇬🇧</span>
                <span>EN</span>
              </button>
            </div>

            {/* Auto-Refresh Timer Badge */}
            <div
              className="hidden lg:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs text-slate-700"
              title={
                language === 'th'
                  ? `รอบอัพเดตอัตโนมัติทุก ${syncSettings.intervalMinutes === 60 ? '1 ชั่วโมง' : `${syncSettings.intervalMinutes} นาที`} (หรือกดซิงค์ข้อมูลได้ตลอดเวลา)`
                  : `Auto-refresh every ${syncSettings.intervalMinutes === 60 ? '1 hour' : `${syncSettings.intervalMinutes}m`} (or click Sync Now anytime)`
              }
            >
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              <span>
                {t.navbar.syncInterval}{' '}
                {syncSettings.intervalMinutes === 60
                  ? language === 'th'
                    ? '1 ชม.'
                    : '1h'
                  : `${syncSettings.intervalMinutes}m`}
                :
              </span>
              <span className="font-mono font-semibold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {formatTime(secondsRemaining)}
              </span>
            </div>

            {/* Sync Now Button */}
            <button
              id="btn-sync-now"
              onClick={onManualSync}
              disabled={isSyncing}
              title={
                language === 'th'
                  ? 'กดเพื่อดึงข้อมูลล่าสุดจาก Google Sheets และอัพเดต Dashboard ทันที'
                  : 'Sync latest data from Google Sheets & update dashboard now'
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 px-2.5 sm:px-3 py-1.5 text-xs font-semibold active:bg-emerald-200 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? t.navbar.syncing : t.navbar.syncNow}</span>
            </button>


            {/* Google Sheets Config Button - Admin Only */}
            {isAdmin && (
              <button
                id="btn-open-sheets"
                onClick={onOpenSheetsModal}
                title={language === 'th' ? 'ตั้งค่าการเชื่อมต่อ Google Sheets และรอบเวลา' : 'Configure Google Sheets sync & interval'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden md:inline">{t.navbar.sheetsBtn}</span>
                <SlidersHorizontal className="h-3 w-3 text-slate-400 hidden xl:inline" />
              </button>
            )}

            {/* Google Chat Monthly Reminder Button - Admin Only */}
            {isAdmin && (
              <button
                id="btn-open-google-chat"
                onClick={onOpenGoogleChatModal}
                title={language === 'th' ? 'ตั้งค่าแจ้งเตือน Google Chat ทุกวันที่ 10 (ส่งก่อนวันที่ 15)' : 'Configure Google Chat monthly reminders'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition-colors shadow-2xs cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                <span className="hidden md:inline">{t.navbar.chatBtn}</span>
                <span className="rounded bg-blue-200/80 px-1 py-0.2 text-[10px] text-blue-800 font-bold hidden xl:inline">
                  {t.navbar.chatBadge}
                </span>
              </button>
            )}

            {/* Email Notification Center Button - Admin Only */}
            {isAdmin && (
              <button
                id="btn-open-alerts"
                onClick={onOpenAlertsModal}
                title={language === 'th' ? 'ระบบแจ้งเตือนอีเมลเมื่อ KPI ต่ำกว่าเป้าหมาย' : 'Email notification center for breached KPIs'}
                className={`relative inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                  breachCount > 0
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Bell className={`h-3.5 w-3.5 ${breachCount > 0 ? 'animate-bounce' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">{t.navbar.emailAlertsBtn}</span>
                {breachCount > 0 && (
                  <span className="inline-flex items-center justify-center rounded-full bg-white px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                    {breachCount}
                  </span>
                )}
              </button>
            )}

            {/* Admin / Visibility Mode Toggle Button */}
            {onOpenAdminModal && (
              <button
                id="btn-admin-auth-toggle"
                onClick={onOpenAdminModal}
                title={
                  isAdmin
                    ? (language === 'th' ? 'สถานะ: โหมดผู้ดูแลระบบ (Admin: iso-sshe) - คลิกเพื่อจัดการสิทธิ์/จำลองมุมมอง' : 'Admin Mode Active - Click to manage')
                    : (language === 'th' ? 'เข้าสู่ระบบผู้ดูแลระบบ (Admin Access)' : 'Admin Login')
                }
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                  isAdmin
                    ? isViewerPreview
                      ? 'border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isAdmin ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="hidden md:inline">
                      {isViewerPreview ? (language === 'th' ? 'มุมมองคนอื่น' : 'Viewer Mode') : (language === 'th' ? 'แอดมิน' : 'Admin')}
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="hidden lg:inline">{language === 'th' ? 'แอดมิน' : 'Admin'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
