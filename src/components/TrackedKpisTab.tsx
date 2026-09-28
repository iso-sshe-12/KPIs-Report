import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  Send,
  Search,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  SlidersHorizontal,
  Mail,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DepartmentCode, KPIItem, MonthKey, MONTHS } from '../types';

interface BreachedKpiData {
  kpi: KPIItem;
  failedMonths: Array<{ month: string; actual: string }>;
  latestFailingValue?: string;
  reason: string;
}

interface TrackedKpisTabProps {
  items: KPIItem[];
  breachedKpis: BreachedKpiData[];
  onSelectKpi: (kpi: KPIItem) => void;
  onOpenReportModal?: (preSelectedKpi?: KPIItem) => void;
  onOpenRcaModal?: (preSelectedKpi?: KPIItem) => void;
  onOpenAlertsModal: (preSelectedKpi?: KPIItem) => void;
  onNavigateToActionPlan?: () => void;
  isAdmin?: boolean;
}

export const TrackedKpisTab: React.FC<TrackedKpisTabProps> = ({
  items,
  breachedKpis,
  onSelectKpi,
  onOpenReportModal,
  onOpenRcaModal,
  onOpenAlertsModal,
  onNavigateToActionPlan,
  isAdmin = false,
}) => {
  const { language, t, getKpiName, getDeptName } = useLanguage();

  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Unique departments present in breached items
  const breachedDepts = useMemo(() => {
    const set = new Set<string>();
    breachedKpis.forEach((b) => set.add(b.kpi.department));
    return Array.from(set).sort();
  }, [breachedKpis]);

  // Filtered breached KPIs based on dept and search query
  const filteredBreached = useMemo(() => {
    return breachedKpis.filter((b) => {
      const matchDept = selectedDept === 'ALL' || b.kpi.department === selectedDept;
      if (!matchDept) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch =
        b.kpi.nameTh.toLowerCase().includes(q) ||
        (b.kpi.nameEn && b.kpi.nameEn.toLowerCase().includes(q)) ||
        b.kpi.codeNumber.toLowerCase().includes(q) ||
        b.kpi.department.toLowerCase().includes(q) ||
        (b.kpi.pic && b.kpi.pic.toLowerCase().includes(q));
      return nameMatch;
    });
  }, [breachedKpis, selectedDept, searchQuery]);

  return (
    <div className="space-y-5 font-['Prompt',sans-serif]">
      {/* Header Banner - Matching User Screenshot */}
      <div className="rounded-2xl border border-red-200/90 bg-linear-to-r from-red-50/90 via-rose-50/70 to-amber-50/40 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-2xs tracking-wider">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{language === 'th' ? 'แจ้งเตือนฝ่ายบริหาร' : 'Executive Alert'}</span>
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700">
                {language === 'th'
                  ? `ตรวจพบ KPI ไม่บรรลุเป้าหมาย (${breachedKpis.length})`
                  : `Detected ${breachedKpis.length} KPIs Below Target`}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {language === 'th'
                ? 'รายการตัวชี้วัดที่ต้องติดตามและส่งการแจ้งเตือนอีเมล'
                : 'Tracked KPIs Watchlist & Email Dispatch'}
            </h1>
            <p className="text-xs text-slate-600 max-w-3xl">
              {language === 'th'
                ? 'รวบรวมตัวชี้วัดที่มีผลการดำเนินงานต่ำกว่าเป้าหมายที่กำหนด สำหรับติดตาม กำกับดูแล และส่งอีเมลแจ้งเตือนผู้รับผิดชอบ (PIC)'
                : 'Consolidated list of below-target KPIs for monitoring, review, and dispatching email notifications.'}
            </p>
          </div>

          {/* Action Buttons Matching Screenshot - Admin Only */}
          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                id="btn-tracked-dispatch-email"
                onClick={() => onOpenAlertsModal()}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:bg-red-800 transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{language === 'th' ? 'ส่งอีเมลแจ้งเตือนผู้รับผิดชอบ' : 'Dispatch Email Alerts'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Filters, Search, View Switcher */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Department Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            {language === 'th' ? 'ฝ่าย:' : 'Dept:'}
          </span>
          <button
            onClick={() => setSelectedDept('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedDept === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {language === 'th' ? 'ทั้งหมด' : 'All'} ({breachedKpis.length})
          </button>
          {breachedDepts.map((dept) => {
            const count = breachedKpis.filter((b) => b.kpi.department === dept).length;
            const isSelected = selectedDept === dept;
            return (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                title={getDeptName(dept as DepartmentCode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-2xs font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{dept}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-red-800/80 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Search & View Mode Switch */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'th' ? 'ค้นหาชื่อ KPI, รหัส, PIC...' : 'Search KPI, code, PIC...'}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
            />
          </div>

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'th' ? 'การ์ด' : 'Cards'}
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {language === 'th' ? 'ตาราง' : 'Table'}
            </button>
          </div>
        </div>
      </div>

      {/* Zero Breaches State */}
      {breachedKpis.length === 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-emerald-950">
            {language === 'th' ? 'ยอดเยี่ยม! ไม่พบ KPI ที่ตกเป้าหมาย' : 'All KPIs are on Target!'}
          </h3>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            {language === 'th'
              ? 'ขณะนี้ทุกหน่วยงานดำเนินงานได้ตามเกณฑ์มาตรฐานขององค์กร FY2026 อย่างครบถ้วน'
              : 'All departments are currently meeting or exceeding corporate benchmarks for FY2026.'}
          </p>
        </div>
      )}

      {/* Grid View: Cards matching screenshot */}
      {breachedKpis.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredBreached.map((b) => (
            <div
              key={b.kpi.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-red-200/90 bg-white p-4 shadow-2xs hover:border-red-400 hover:shadow-md transition-all duration-200"
            >
              {/* Top Row: Dept Code + Target Badge */}
              <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 tracking-tight">
                    {b.kpi.department} #{b.kpi.codeNumber}
                  </span>
                  <span className="rounded-md bg-red-50 border border-red-200/80 px-2 py-0.5 text-[11px] font-bold text-red-700">
                    {language === 'th' ? 'เป้า:' : 'Target:'} {b.kpi.targetRaw}
                  </span>
                </div>

                {/* KPI Name */}
                <h3
                  onClick={() => onSelectKpi(b.kpi)}
                  title={getKpiName(b.kpi)}
                  className="line-clamp-2 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-red-700 transition-colors cursor-pointer"
                >
                  {getKpiName(b.kpi)}
                </h3>
              </div>

              {/* Bottom Details */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-red-600 text-sm">
                    {language === 'th' ? 'จริง:' : 'Actual:'} {b.latestFailingValue || '-'}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium truncate max-w-[130px]">
                    PIC: {b.kpi.pic || b.kpi.department}
                  </span>
                </div>

                {/* Month Tag & Quick Actions */}
                <div className="mt-2.5 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="h-3 w-3 text-red-400" />
                    <span>
                      {b.failedMonths.length > 0
                        ? `${b.failedMonths[b.failedMonths.length - 1].month} (${b.failedMonths.length} ${
                            language === 'th' ? 'ด.' : 'mo.'
                          })`
                        : '-'}
                    </span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenAlertsModal(b.kpi)}
                        title={language === 'th' ? 'ส่งอีเมลแจ้งเตือน' : 'Send Alert Email'}
                        className="p-1 rounded text-red-600 hover:bg-red-50 border border-red-200/60 cursor-pointer"
                      >
                        <Mail className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View Option for Detailed Matrix */}
      {breachedKpis.length > 0 && viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-semibold">
                  <th className="py-3 px-4 w-28">{language === 'th' ? 'ฝ่าย / รหัส' : 'Dept / Code'}</th>
                  <th className="py-3 px-4 min-w-[220px]">{language === 'th' ? 'ชื่อตัวชี้วัด (KPI)' : 'KPI Name'}</th>
                  <th className="py-3 px-3 text-center">{language === 'th' ? 'เป้าหมาย' : 'Target'}</th>
                  <th className="py-3 px-3 text-center">{language === 'th' ? 'ผลจริงล่าสุด' : 'Latest Actual'}</th>
                  <th className="py-3 px-3 min-w-[130px]">{language === 'th' ? 'เดือนที่ไม่ผ่าน' : 'Failing Months'}</th>
                  <th className="py-3 px-4">{language === 'th' ? 'ผู้รับผิดชอบ (PIC)' : 'PIC'}</th>
                  <th className="py-3 px-4 text-center">{language === 'th' ? 'จัดการด่วน' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredBreached.map((b) => (
                  <tr key={b.kpi.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-700">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px]">
                        {b.kpi.department} #{b.kpi.codeNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <button
                        onClick={() => onSelectKpi(b.kpi)}
                        className="hover:text-red-600 transition-colors text-left cursor-pointer"
                      >
                        {getKpiName(b.kpi)}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-700">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px]">
                        {b.kpi.targetRaw}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-extrabold text-red-600">
                      <span className="rounded-md bg-red-100/90 px-2 py-0.5 text-[11px]">
                        {b.latestFailingValue || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {b.failedMonths.map((fm, i) => (
                          <span
                            key={i}
                            className="rounded bg-red-50 text-red-700 border border-red-200/80 px-1.5 py-0.2 text-[10px] font-semibold"
                          >
                            {fm.month}: {fm.actual}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {b.kpi.pic || b.kpi.department}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isAdmin ? (
                          <button
                            onClick={() => onOpenAlertsModal(b.kpi)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer"
                            title={language === 'th' ? 'ส่งการแจ้งเตือนอีเมล' : 'Send Alert Email'}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
