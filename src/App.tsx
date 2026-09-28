import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Clock,
  Download,
  EyeOff,
  FileSpreadsheet,
  Layers,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { DashboardTab, DashboardTabs } from './components/DashboardTabs';
import { DepartmentOverview } from './components/DepartmentOverview';
import { EmailAlertModal } from './components/EmailAlertModal';
import { ExecutiveKpiCards } from './components/ExecutiveKpiCards';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { GoogleChatModal } from './components/GoogleChatModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { KpiDetailModal } from './components/KpiDetailModal';
import { KpiTable } from './components/KpiTable';
import { KpiTrendsChart } from './components/KpiTrendsChart';
import { Navbar } from './components/Navbar';
import { KpiReportModal, KpiReportSubmission } from './components/KpiReportModal';
import { TrackedKpisTab } from './components/TrackedKpisTab';
import { AdminAuthModal } from './components/AdminAuthModal';
import { checkIsAdmin, setAdminAuthorized } from './services/authService';
import { isFailingTarget, parseKpiCsv, parseNumericValue } from './services/kpiParser';
import {
  computeDepartmentSummaries,
  fetchKpiData,
  getInitialSyncSettings,
  saveSyncSettings,
} from './services/googleSheetsService';
import {
  getInitialGoogleChatSettings,
  saveGoogleChatSettings,
} from './services/googleChatService';
import {
  checkShouldTriggerMonthlyAlert,
  dispatchEmailAlert,
  getBreachedKpis,
  getInitialAlertSettings,
  saveAlertSettings,
} from './services/notificationService';
import {
  AlertSettings,
  DepartmentCode,
  GoogleChatSettings,
  KPIItem,
  SyncSettings,
} from './types';

export default function App() {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<KPIItem[]>([]);
  const [dataSource, setDataSource] = useState<'google_sheets' | 'cached' | 'default'>('default');
  const [syncSettings, setSyncSettings] = useState<SyncSettings>(getInitialSyncSettings);
  const [alertSettings, setAlertSettings] = useState<AlertSettings>(getInitialAlertSettings);
  const [googleChatSettings, setGoogleChatSettings] = useState<GoogleChatSettings>(getInitialGoogleChatSettings);

  const [selectedDepartment, setSelectedDepartment] = useState<'ALL' | DepartmentCode>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'failed' | 'passed' | 'pending'>('all');
  const [selectedKpiForDetail, setSelectedKpiForDetail] = useState<KPIItem | null>(null);
  const [focusedKpiForAlert, setFocusedKpiForAlert] = useState<KPIItem | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const [isGoogleChatModalOpen, setIsGoogleChatModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSelectedKpi, setReportSelectedKpi] = useState<KPIItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'alert' } | null>(null);

  // Admin access & visibility controls (hides Google Chat & Email Alerts from others)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => checkIsAdmin());
  const [isViewerPreview, setIsViewerPreview] = useState<boolean>(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);
  const effectiveIsAdmin = isAdmin && !isViewerPreview;

  // 10-minute countdown timer (in seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => (syncSettings.intervalMinutes || 10) * 60);

  // Department summaries
  const departments = useMemo(() => computeDepartmentSummaries(items), [items]);

  // Breached KPIs
  const breachedKpis = useMemo(
    () => getBreachedKpis(items, alertSettings.alertOnDepartments),
    [items, alertSettings.alertOnDepartments]
  );

  const showToast = (text: string, type: 'success' | 'alert' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsSyncing(true);
      try {
        const result = await fetchKpiData(syncSettings.sheetUrl);
        setItems(result.items);
        setDataSource(result.source);
      } catch (err) {
        console.error('Initial load error:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    loadInitialData();
  }, []);

  // Timer countdown and 10-minute auto-refresh trigger
  useEffect(() => {
    if (!syncSettings.autoSyncEnabled) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Timer triggered: auto-sync
          handleSync(true);
          return (syncSettings.intervalMinutes || 10) * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [syncSettings.autoSyncEnabled, syncSettings.intervalMinutes, syncSettings.sheetUrl]);

  // Sync handler
  const handleSync = async (isAuto = false): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const result = await fetchKpiData(syncSettings.sheetUrl);
      setItems(result.items);
      setDataSource(result.source);

      const updatedSyncSettings: SyncSettings = {
        ...syncSettings,
        lastSyncTime: new Date().toISOString(),
        syncStatus: 'success',
      };
      setSyncSettings(updatedSyncSettings);
      saveSyncSettings(updatedSyncSettings);

      // Check if scheduled monthly alert (16th at 08:00 AM) should trigger
      const updatedBreached = getBreachedKpis(result.items, alertSettings.alertOnDepartments);
      const shouldTriggerMonthlyAlert = checkShouldTriggerMonthlyAlert(alertSettings);

      if (shouldTriggerMonthlyAlert && updatedBreached.length > 0) {
        const now = new Date();
        const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const updatedAlertSettings: AlertSettings = {
          ...alertSettings,
          lastDispatchedDate: todayDateStr,
        };
        setAlertSettings(updatedAlertSettings);
        saveAlertSettings(updatedAlertSettings);

        dispatchEmailAlert(updatedBreached, updatedAlertSettings, 'monthly_schedule').catch(console.error);
        showToast(
          `ส่งอีเมลแจ้งเตือนรอบวันที่ 16 เวลา 08.00 น. เรียบร้อย (พบ ${updatedBreached.length} KPI ตกเป้า)`,
          'alert'
        );
      } else {
        showToast(
          isAuto ? 'อัพเดตข้อมูลรอบอัตโนมัติเรียบร้อย' : 'ซิงค์ข้อมูลล่าสุดสำเร็จ',
          'success'
        );
      }

      // Reset countdown timer
      setSecondsRemaining((syncSettings.intervalMinutes || 10) * 60);
      return true;
    } catch (err: any) {
      console.error('Sync failed:', err);
      showToast('ไม่สามารถดึงข้อมูลได้ โปรดตรวจสอบการเชื่อมต่อ', 'alert');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Direct CSV update from paste or file upload
  const handleDirectCsvUpdate = (csvText: string) => {
    try {
      const parsed = parseKpiCsv(csvText);
      if (parsed.length > 0) {
        setItems(parsed);
        setDataSource('cached');
        showToast(`อัพเดตข้อมูลสำเร็จ (${parsed.length} ตัวชี้วัด)`);
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการแปลไฟล์ CSV', 'alert');
    }
  };

  // Save KPI Result Submission from Modal
  const handleSaveKpiReport = (submission: KpiReportSubmission) => {
    setItems((prevItems) => {
      const updated = prevItems.map((kpi) => {
        if (kpi.id !== submission.kpiId) return kpi;

        const numVal = parseNumericValue(submission.reportedValue);
        const updatedMonthly = {
          ...kpi.monthlyValues,
          [submission.month]: {
            raw: submission.reportedValue,
            value: numVal,
            isEstimated: false,
          },
        };

        // Recalculate status based on all available monthly values
        let hasAnyFail = false;
        let hasAnyValue = false;

        (Object.values(updatedMonthly) as Array<{ raw: string; value?: number } | undefined>).forEach((monthData) => {
          if (monthData && monthData.value !== undefined) {
            hasAnyValue = true;
            if (isFailingTarget(monthData.value, { operator: kpi.operator, value: kpi.targetValue })) {
              hasAnyFail = true;
            }
          }
        });

        const newStatus = hasAnyFail ? 'failed' : hasAnyValue ? 'passed' : 'pending';

        return {
          ...kpi,
          monthlyValues: updatedMonthly,
          status: newStatus,
        };
      });

      // Also persist to localStorage backup
      try {
        localStorage.setItem('krc_kpi_user_submissions', JSON.stringify({
          lastUpdated: new Date().toISOString(),
          submission,
        }));
      } catch (e) {
        console.error(e);
      }

      return updated;
    });

    showToast(
      language === 'th'
        ? `บันทึกผล KPI ${submission.kpiCode} ประจำเดือน ${submission.month} (${submission.reportedValue}) เรียบร้อยแล้ว`
        : `Recorded KPI ${submission.kpiCode} for ${submission.month} (${submission.reportedValue}) successfully`,
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 flex flex-col font-['Prompt',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        syncSettings={syncSettings}
        secondsRemaining={secondsRemaining}
        isSyncing={isSyncing}
        onManualSync={() => handleSync(false)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenAlertsModal={() => {
          setFocusedKpiForAlert(null);
          setIsAlertsModalOpen(true);
        }}
        onOpenGoogleChatModal={() => setIsGoogleChatModalOpen(true)}
        onOpenReportModal={() => {
          setReportSelectedKpi(null);
          setIsReportModalOpen(true);
        }}
        breachCount={breachedKpis.length}
        dataSource={dataSource}
        isAdmin={effectiveIsAdmin}
        onOpenAdminModal={() => setIsAdminAuthModalOpen(true)}
        isViewerPreview={isViewerPreview}
      />

      {/* Viewer Preview Simulation Banner */}
      {isAdmin && isViewerPreview && (
        <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 shrink-0" />
            <span>
              {language === 'th'
                ? 'กำลังแสดงผลในโหมดจำลองมุมมองบุคคลอื่น (ปุ่ม Google Sheets, Google Chat และแจ้งเตือนอีเมลถูกซ่อนแล้ว)'
                : 'Simulating general viewer view (Sheets, Chat and Email buttons are hidden)'}
            </span>
          </div>
          <button
            onClick={() => setIsViewerPreview(false)}
            className="bg-white text-amber-900 px-3 py-1 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs shrink-0"
          >
            {language === 'th' ? 'กลับสู่โหมดแอดมิน (แสดงปุ่ม)' : 'Exit Preview Mode'}
          </button>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-xl ${
              toastMessage.type === 'alert'
                ? 'border-red-300 bg-red-600 text-white'
                : 'border-emerald-300 bg-slate-900 text-white'
            }`}
          >
            {toastMessage.type === 'alert' ? (
              <AlertTriangle className="h-4 w-4 text-red-200 shrink-0" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Dashboard */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6 flex-1">
        {/* Subheader info: Fiscal Year Cycle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {t.subheader.fiscalCycle}
            </span>
            <span>•</span>
            <span className="text-slate-600">
              {t.subheader.dataSource}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600">
              <Clock className="h-3 w-3 text-slate-400" />
              {t.subheader.syncTimer} <strong>{syncSettings.intervalMinutes} {language === 'th' ? 'นาที' : 'mins'}</strong>
            </span>
            {effectiveIsAdmin && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Bell className="h-3 w-3 text-red-500" />
                  {t.subheader.emailAlerts} {alertSettings.notifyOnSync ? t.subheader.active : t.subheader.disabled}
                </span>
                <span>•</span>
                <button
                  id="badge-google-chat-reminder"
                  onClick={() => setIsGoogleChatModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-0.5 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200 font-medium"
                >
                  <MessageSquare className="h-3 w-3 text-blue-600" />
                  <span>
                    {t.subheader.chatReminder} <strong>{googleChatSettings.reminderDayOfMonth}</strong> ({language === 'th' ? `ส่งก่อน ${googleChatSettings.deadlineDayOfMonth}` : `before ${googleChatSettings.deadlineDayOfMonth}th`})
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard View Tabs matching user screenshot */}
        <DashboardTabs
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          breachCount={breachedKpis.length}
          totalKpiCount={items.length}
        />

        {/* Tab 1: ภาพรวมแดชบอร์ด FY2026 (Overview) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Section 1: Executive Summary Cards & Critical Alert Banner */}
            <ExecutiveSummary
              items={items}
              breachedKpis={breachedKpis}
              onFilterStatus={setSelectedStatus}
              onFilterDepartment={setSelectedDepartment}
              onOpenAlertsModal={() => {
                setFocusedKpiForAlert(null);
                setIsAlertsModalOpen(true);
              }}
              onSelectKpi={setSelectedKpiForDetail}
              onNavigateToTrackedKpis={() => setActiveTab('tracked_kpis')}
              onOpenReportModal={(kpi) => {
                setReportSelectedKpi(kpi || null);
                setIsReportModalOpen(true);
              }}
            />

            {/* Section 2: Department Overview Scorecards */}
            <DepartmentOverview
              departments={departments}
              selectedDepartment={selectedDepartment}
              onSelectDepartment={(dept) => {
                setSelectedDepartment(dept);
              }}
              items={items}
              breachedKpis={breachedKpis}
              onOpenReportModal={(kpi, dept) => {
                if (kpi) {
                  setReportSelectedKpi(kpi);
                } else if (dept) {
                  const firstDeptKpi = items.find((k) => k.department === dept);
                  setReportSelectedKpi(firstDeptKpi || null);
                } else {
                  setReportSelectedKpi(null);
                }
                setIsReportModalOpen(true);
              }}
              onViewKpiTable={() => {
                setActiveTab('monthly_sheet');
              }}
            />

            {/* Section 3: Visual Analytics (Department Breakdown & Metric Trend) */}
            <KpiTrendsChart
              departments={departments}
              items={items}
              selectedKpiId={selectedKpiForDetail?.id}
              onSelectKpiId={(id) => {
                const found = items.find((k) => k.id === id);
                if (found) setSelectedKpiForDetail(found);
              }}
            />

            {/* Quick Links Banner to Tracked KPIs & 12-Month Sheet */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-2xs shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'th' ? 'เข้าถึงมุมมองเชิงลึกได้อย่างรวดเร็ว' : 'Quick Access Views'}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {language === 'th'
                      ? 'ติดตามตัวชี้วัดที่ตกเป้าหมาย หรือเปิดดูตารางผลการดำเนินงานจริง 12 เดือนเต็มรูปแบบ'
                      : 'Monitor tracked below-target KPIs or review the complete 12-month performance sheet.'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {breachedKpis.length > 0 && (
                  <button
                    id="btn-switch-to-tracked-kpis"
                    onClick={() => setActiveTab('tracked_kpis')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>
                      {language === 'th'
                        ? `รายการตัวชี้วัดที่ต้องติดตาม (${breachedKpis.length}) ->`
                        : `Tracked KPIs (${breachedKpis.length}) ->`}
                    </span>
                  </button>
                )}
                <button
                  id="btn-switch-to-monthly-sheet"
                  onClick={() => setActiveTab('monthly_sheet')}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>{language === 'th' ? 'เปิดดูตาราง 12 เดือน ->' : 'Open 12-Month Sheet ->'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: ตารางตัวชี้วัด 12 เดือน (Monthly Sheet) */}
        {activeTab === 'monthly_sheet' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-blue-200/80 bg-linear-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-blue-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                    FY2026 Monthly Sheet
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {language === 'th' ? 'รอบปีงบประมาณ เม.ย. 2025 - มี.ค. 2026' : 'Apr 2025 - Mar 2026'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                  {language === 'th'
                    ? 'ตารางตัวชี้วัดผลการดำเนินงาน 12 เดือน (Monthly Performance Sheet)'
                    : '12-Month KPI Performance Sheet'}
                </h2>
                <p className="text-xs text-slate-600">
                  {language === 'th'
                    ? 'แสดงผลการดำเนินงานรายเดือน ตัวชี้วัดเป้าหมาย ผลต่างเทียบเป้าหมาย (Gap) และสถานะประเมิน'
                    : 'Monthly actual values, corporate targets, variance gaps, and evaluation statuses.'}
                </p>
              </div>
            </div>

            {/* Summary Corporate KPIs as Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {language === 'th' ? 'สรุปเป้าหมายหลักองค์กร (Summary Corporate KPIs)' : 'Summary Corporate KPIs'}
                </span>
                <span className="text-xs text-slate-400">
                  {language === 'th' ? 'คลิกที่การ์ดเพื่อดูรายละเอียดหรือกรองข้อมูลตามสถานะ' : 'Click a card to view details or filter by status'}
                </span>
              </div>
              <ExecutiveKpiCards
                items={items}
                onSelectKpi={setSelectedKpiForDetail}
                onSelectKpiByName={(keyword) => {
                  const found = items.find(
                    (k) =>
                      k.nameTh.includes(keyword) ||
                      (k.nameEn && k.nameEn.toLowerCase().includes(keyword.toLowerCase()))
                  );
                  if (found) setSelectedKpiForDetail(found);
                }}
                onFilterStatus={setSelectedStatus}
              />
            </div>

            <KpiTable
              items={items}
              selectedDepartment={selectedDepartment}
              selectedStatus={selectedStatus}
              onSelectDepartment={setSelectedDepartment}
              onSelectStatus={setSelectedStatus}
              onSelectKpi={setSelectedKpiForDetail}
              onOpenReportModal={(kpi) => {
                setReportSelectedKpi(kpi || null);
                setIsReportModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 3: รายการตัวชี้วัดที่ต้องติดตาม (Tracked KPIs Watchlist) */}
        {activeTab === 'tracked_kpis' && (
          <TrackedKpisTab
            items={items}
            breachedKpis={breachedKpis}
            isAdmin={effectiveIsAdmin}
            onSelectKpi={setSelectedKpiForDetail}
            onOpenReportModal={(kpi) => {
              setReportSelectedKpi(kpi || null);
              setIsReportModalOpen(true);
            }}
            onOpenAlertsModal={(kpi) => {
              setFocusedKpiForAlert(kpi || null);
              setIsAlertsModalOpen(true);
            }}
          />
        )}
      </main>

      {/* KPI Detail Modal */}
      <KpiDetailModal
        kpi={selectedKpiForDetail}
        onClose={() => setSelectedKpiForDetail(null)}
        onOpenAlertForKpi={(kpi) => {
          setFocusedKpiForAlert(kpi);
          setIsAlertsModalOpen(true);
        }}
        onOpenReportForKpi={(kpi) => {
          setReportSelectedKpi(kpi);
          setIsReportModalOpen(true);
        }}
      />

      {/* KPI Result Report Modal */}
      <KpiReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setReportSelectedKpi(null);
        }}
        onSaveReport={handleSaveKpiReport}
        items={items}
        preSelectedKpi={reportSelectedKpi}
      />

      {/* Google Sheets Config Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        syncSettings={syncSettings}
        onUpdateSyncSettings={setSyncSettings}
        onTriggerSync={async (customUrl) => {
          const success = await handleSync(false);
          return success;
        }}
        onDirectCsvUpdate={handleDirectCsvUpdate}
        isSyncing={isSyncing}
      />

      {/* Email Alert Modal */}
      <EmailAlertModal
        isOpen={isAlertsModalOpen}
        onClose={() => {
          setIsAlertsModalOpen(false);
          setFocusedKpiForAlert(null);
        }}
        items={items}
        alertSettings={alertSettings}
        onUpdateAlertSettings={setAlertSettings}
        focusedKpi={focusedKpiForAlert}
      />

      {/* Google Chat Reminder Modal */}
      <GoogleChatModal
        isOpen={isGoogleChatModalOpen}
        onClose={() => setIsGoogleChatModalOpen(false)}
        settings={googleChatSettings}
        onUpdateSettings={setGoogleChatSettings}
      />

      {/* Admin Authorization & Visibility Control Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        isAdmin={isAdmin}
        isViewerPreview={isViewerPreview}
        onToggleViewerPreview={() => setIsViewerPreview((prev) => !prev)}
        onLoginSuccess={() => {
          setIsAdmin(true);
          setIsViewerPreview(false);
          showToast(
            language === 'th'
              ? 'เข้าสู่ระบบผู้ดูแลระบบสำเร็จ (แสดงปุ่ม Google Sheets, Chat & อีเมลแล้ว)'
              : 'Admin access unlocked (Sheets, Chat & Email buttons visible)',
            'success'
          );
        }}
        onLogout={() => {
          setAdminAuthorized(false);
          setIsAdmin(false);
          setIsViewerPreview(false);
          showToast(
            language === 'th'
              ? 'ออกจากโหมดแอดมินแล้ว (ซ่อนปุ่มทั้งหมดสำหรับผู้เข้าชมทั่วไป)'
              : 'Logged out from Admin (buttons hidden for viewers)',
            'alert'
          );
        }}
      />
    </div>
  );
}
