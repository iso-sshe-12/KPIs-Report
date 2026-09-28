import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileCheck2,
  FileX2,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DepartmentCode, DepartmentSummary, KPIItem } from '../types';

interface DepartmentOverviewProps {
  departments: DepartmentSummary[];
  selectedDepartment: 'ALL' | DepartmentCode;
  onSelectDepartment: (dept: 'ALL' | DepartmentCode) => void;
  items?: KPIItem[];
  breachedKpis?: Array<{
    kpi: KPIItem;
    failedMonths: Array<{ month: string; actual: string }>;
    latestFailingValue?: string;
    reason: string;
  }>;
  onViewKpiTable?: () => void;
  onOpenReportModal?: (preSelectedKpi?: KPIItem, dept?: DepartmentCode) => void;
}

const DEPT_METADATA: Record<
  DepartmentCode,
  {
    category: string;
    titleTh: string;
    titleEn: string;
  }
> = {
  Corporate: {
    category: 'CORPORATE KPIS',
    titleTh: 'เป้าหมายหลักองค์กร',
    titleEn: 'Corporate Objectives',
  },
  OPS: {
    category: 'OPERATIONS (OPS)',
    titleTh: 'ฝ่ายปฏิบัติการ',
    titleEn: 'Operations Department',
  },
  CR: {
    category: 'CUSTOMER RELATIONS (CR)',
    titleTh: 'ฝ่ายลูกค้าสัมพันธ์',
    titleEn: 'Customer Relations',
  },
  WH: {
    category: 'WAREHOUSE (WH)',
    titleTh: 'ฝ่ายคลังสินค้า',
    titleEn: 'Warehouse Department',
  },
  Transport: {
    category: 'TRANSPORTATION',
    titleTh: 'ฝ่ายขนส่งสินค้า',
    titleEn: 'Transportation Division',
  },
  EN: {
    category: 'ENGINEERING & CONSTRUCTION (EN)',
    titleTh: 'ฝ่ายวิศวกรรมและก่อสร้าง',
    titleEn: 'Engineering & Construction (EN)',
  },
  PU: {
    category: 'PROCUREMENT (PU)',
    titleTh: 'ฝ่ายจัดซื้อ',
    titleEn: 'Procurement',
  },
  'HR&GA': {
    category: 'HR & GA',
    titleTh: 'ฝ่ายทรัพยากรบุคคลและบริหารงานทั่วไป',
    titleEn: 'HR & General Administration (HR & GA)',
  },
  QSHE: {
    category: 'QUALITY, SAFETY, HEALTH & ENVIRONMENT (QSHE)',
    titleTh: 'ฝ่ายคุณภาพ ความปลอดภัย อาชีวอนามัย และสิ่งแวดล้อม',
    titleEn: 'Quality, Safety, Health & Environment (QSHE)',
  },
  IT: {
    category: 'INFORMATION TECH (IT)',
    titleTh: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    titleEn: 'Information Technology',
  },
  'ACC&FN': {
    category: 'ACCOUNTING & FINANCE',
    titleTh: 'ฝ่ายบัญชีและการเงิน',
    titleEn: 'Accounting & Finance',
  },
};

export const DepartmentOverview: React.FC<DepartmentOverviewProps> = ({
  departments,
  selectedDepartment,
  onSelectDepartment,
  items = [],
  breachedKpis = [],
  onViewKpiTable,
  onOpenReportModal,
}) => {
  const { language } = useLanguage();
  const [filterView, setFilterView] = useState<'all' | 'critical_only' | 'unreported_only' | 'passed_only'>('all');

  // Compute reporting status & critical points for a department
  const getDeptStats = (deptCode: DepartmentCode) => {
    const deptItems = items.filter((k) => k.department === deptCode);
    const total = deptItems.length;

    // A KPI is considered "Reported" (ส่งรายงานแล้ว) if it has at least one recorded numerical monthly value or non-pending evaluation
    const reportedItems = deptItems.filter((k) => {
      if (k.status === 'passed' || k.status === 'failed') return true;
      return Object.values(k.monthlyValues).some((m) => {
        const entry = m as { raw?: string; value?: number; isPending?: boolean } | undefined;
        return entry && entry.value !== undefined && !entry.isPending;
      });
    });
    const reportedCount = reportedItems.length;

    // Items that have recorded a pending status (e.g. "รอผลการประเมิน", Internal Audit pending audit cycle)
    const pendingItems = deptItems.filter((k) => {
      if (reportedItems.includes(k)) return false;
      if (k.status === 'pending') return true;
      if (k.totalRaw?.includes('รอผลการประเมิน') || k.averageRaw?.includes('รอผลการประเมิน')) return true;
      return Object.values(k.monthlyValues).some((m) => {
        const entry = m as { raw?: string; isPending?: boolean } | undefined;
        return entry && (entry.isPending || entry.raw?.includes('รอผลการประเมิน'));
      });
    });
    const pendingCount = pendingItems.length;

    // Truly unsubmitted items (no numeric data and no pending evaluation status recorded)
    const trulyUnreportedCount = Math.max(0, total - reportedCount - pendingCount);

    // Critical breaches (ตกเป้า)
    const breaches = breachedKpis.filter((b) => b.kpi.department === deptCode);
    const foundSummary = departments.find((d) => d.code === deptCode);
    const criticalCount = breaches.length > 0 ? breaches.length : (foundSummary ? foundSummary.failingKpis : 0);

    const passedCount = foundSummary ? foundSummary.passedKpis : deptItems.filter((k) => k.status === 'passed').length;
    const failingCount = foundSummary ? foundSummary.failingKpis : deptItems.filter((k) => k.status === 'failed').length;

    // Evaluated items
    const evaluated = passedCount + failingCount;
    const achievementRate = evaluated > 0 ? Math.round((passedCount / evaluated) * 100) : 0;

    return {
      total,
      reportedCount,
      pendingCount,
      unreportedCount: trulyUnreportedCount,
      criticalCount,
      passedCount,
      failingCount,
      achievementRate,
      isAllReported: total > 0 && trulyUnreportedCount === 0,
      isNoneReported: total > 0 && reportedCount === 0 && pendingCount === 0,
    };
  };

  const handleCardClick = (deptCode: DepartmentCode) => {
    if (selectedDepartment === deptCode) {
      onSelectDepartment('ALL');
    } else {
      onSelectDepartment(deptCode);
    }
    if (onViewKpiTable) {
      onViewKpiTable();
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const stats = getDeptStats(dept.code);
    if (filterView === 'critical_only') {
      return stats.criticalCount > 0 || stats.failingCount > 0;
    }
    if (filterView === 'unreported_only') {
      return stats.unreportedCount > 0;
    }
    if (filterView === 'passed_only') {
      return stats.criticalCount === 0 && stats.failingCount === 0;
    }
    return true;
  });

  const totalCriticalDepts = departments.filter((d) => {
    const stats = getDeptStats(d.code);
    return stats.criticalCount > 0 || stats.failingCount > 0;
  }).length;

  const totalUnreportedDepts = departments.filter((d) => {
    const stats = getDeptStats(d.code);
    return stats.unreportedCount > 0;
  }).length;

  return (
    <section className="space-y-4 font-['Prompt',sans-serif]">
      {/* Section Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {language === 'th'
                ? 'สรุปผลงานและการส่งรายงานตามสายงาน / ฝ่าย'
                : 'Department Performance & Reporting Status'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'th'
                ? 'ติดตามผลการบรรลุเป้าหมาย ตรวจสอบการส่งรายงาน และจุดวิกฤตของแต่ละฝ่าย'
                : 'Track KPI achievement rates, reporting submission progress, and critical points'}
            </p>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <button
            id="btn-filter-dept-all"
            onClick={() => {
              setFilterView('all');
              onSelectDepartment('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDepartment === 'ALL' && filterView === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              <span>{language === 'th' ? 'ทุกสายงาน (ALL)' : 'All Divisions'}</span>
            </span>
          </button>

          <button
            id="btn-filter-dept-critical"
            onClick={() => setFilterView('critical_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterView === 'critical_only'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>
                {language === 'th'
                  ? `เฉพาะจุดวิกฤต (${totalCriticalDepts})`
                  : `Critical Breaches (${totalCriticalDepts})`}
              </span>
            </span>
          </button>

          <button
            id="btn-filter-dept-unreported"
            onClick={() => setFilterView('unreported_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterView === 'unreported_only'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {language === 'th'
                  ? `ค้างส่งรายงาน (${totalUnreportedDepts})`
                  : `Pending Report (${totalUnreportedDepts})`}
              </span>
            </span>
          </button>

          <button
            id="btn-filter-dept-passed"
            onClick={() => setFilterView('passed_only')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterView === 'passed_only'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{language === 'th' ? 'ผ่านเกณฑ์ 100%' : '100% Met'}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Grid of Department Cards - Exact structure from user's image with enhanced reporting metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDepartments.map((dept) => {
          const isSelected = selectedDepartment === dept.code;
          const meta = DEPT_METADATA[dept.code] || {
            category: `${dept.code} KPIS`,
            titleTh: dept.name,
            titleEn: dept.name,
          };

          const stats = getDeptStats(dept.code);
          const hasFailing = stats.failingCount > 0 || stats.criticalCount > 0;
          const isPendingOnly = stats.reportedCount === 0;

          // Percentage pill styling: lavender/soft blue like the 75% pill in user image
          const pillStyle = isPendingOnly
            ? 'bg-slate-100 text-slate-600 border border-slate-200'
            : hasFailing
            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-100';

          return (
            <div
              key={dept.code}
              id={`dept-card-${dept.code}`}
              onClick={() => handleCardClick(dept.code)}
              className={`rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 flex flex-col justify-between cursor-pointer select-none hover:shadow-md hover:border-indigo-300 ${
                isSelected
                  ? 'ring-2 ring-indigo-600 border-indigo-400 bg-indigo-50/10 shadow-sm'
                  : 'border-slate-200/90'
              }`}
            >
              <div>
                {/* Header Row: Category Tag (e.g. OPERATIONS (OPS)) & Percentage Pill (e.g. 75%) */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    {meta.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${pillStyle}`}>
                    {isPendingOnly ? (language === 'th' ? 'รอข้อมูล' : 'Pending') : `${stats.achievementRate}%`}
                  </span>
                </div>

                {/* Title (e.g. ฝ่ายปฏิบัติการ) */}
                <h3 className="text-base font-extrabold text-slate-900 leading-tight mt-1 mb-3.5 tracking-tight">
                  {language === 'th' ? meta.titleTh : meta.titleEn}
                </h3>

                {/* Stats Row 1: Total KPIs (ตัวชี้วัดทั้งหมด: 12 รายการ) */}
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1.5">
                  <span>{language === 'th' ? 'ตัวชี้วัดทั้งหมด:' : 'Total KPIs:'}</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {stats.total} {language === 'th' ? 'รายการ' : 'items'}
                  </span>
                </div>

                {/* Stats Row 2: Passed vs Failed (บรรลุ 9 / ไม่บรรลุ 3) matching screenshot */}
                <div className="flex items-center justify-between text-xs mb-2.5 font-bold">
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500 text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                    </span>
                    <span>
                      {language === 'th' ? 'บรรลุ' : 'Met'} {stats.passedCount}
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 ${
                      stats.failingCount > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {language === 'th' ? 'ไม่บรรลุ' : 'Unmet'} {stats.failingCount}
                    </span>
                  </span>
                </div>

                {/* Progress Bar (Indigo/Purple style as in provided image) */}
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPendingOnly
                        ? 'bg-slate-300'
                        : hasFailing
                        ? 'bg-indigo-600'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: isPendingOnly ? '6%' : `${Math.max(stats.achievementRate, 5)}%`,
                    }}
                  />
                </div>

                {/* Reporting Status Row: ส่งรายงานแล้ว / รอผลประเมิน / ค้างส่ง */}
                <div className="rounded-xl bg-slate-50/80 border border-slate-150 p-2 text-xs mb-3.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-500">
                      {language === 'th' ? 'สถานะการส่งรายงาน:' : 'Reporting Status:'}
                    </span>
                    <span
                      className={`text-[11px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        stats.unreportedCount > 0
                          ? 'bg-amber-100 text-amber-800'
                          : stats.isNoneReported
                          ? 'bg-slate-200 text-slate-700'
                          : stats.pendingCount > 0 && stats.reportedCount === 0
                          ? 'bg-sky-100 text-sky-800'
                          : stats.pendingCount > 0
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {stats.unreportedCount > 0
                        ? stats.reportedCount > 0
                          ? language === 'th'
                            ? 'ส่งบางส่วน'
                            : 'Partially'
                          : language === 'th'
                          ? 'ยังไม่เริ่มส่ง'
                          : 'Not Started'
                        : stats.isNoneReported
                        ? language === 'th'
                          ? 'ยังไม่เริ่มส่ง'
                          : 'Not Started'
                        : stats.pendingCount > 0 && stats.reportedCount === 0
                        ? language === 'th'
                          ? 'รอผลการประเมิน'
                          : 'Pending Assessment'
                        : stats.pendingCount > 0
                        ? language === 'th'
                          ? `ส่งครบ (รอประเมิน ${stats.pendingCount})`
                          : `Complete (Pending ${stats.pendingCount})`
                        : language === 'th'
                        ? 'ส่งครบแล้ว'
                        : 'All Submitted'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <FileCheck2 className="h-3.5 w-3.5 text-blue-600" />
                      <span>
                        {language === 'th' ? 'ส่งแล้ว' : 'Submitted'}{' '}
                        <strong className="text-slate-900">{stats.reportedCount}</strong> {language === 'th' ? 'หัวข้อ' : 'kpis'}
                      </span>
                    </span>
                    {stats.pendingCount > 0 && stats.unreportedCount === 0 ? (
                      <span className="inline-flex items-center gap-1 text-sky-700">
                        <Clock className="h-3.5 w-3.5 text-sky-600" />
                        <span>
                          {language === 'th' ? 'รอผลประเมิน' : 'Pending'}{' '}
                          <strong className="text-sky-800">{stats.pendingCount}</strong> {language === 'th' ? 'หัวข้อ' : 'kpis'}
                        </span>
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 ${
                          stats.unreportedCount > 0 ? 'text-amber-700' : 'text-slate-400'
                        }`}
                      >
                        <FileX2 className="h-3.5 w-3.5 text-amber-600" />
                        <span>
                          {language === 'th' ? 'ค้างส่ง' : 'Pending'}{' '}
                          <strong className={stats.unreportedCount > 0 ? 'text-amber-800' : 'text-slate-500'}>
                            {stats.unreportedCount}
                          </strong> {language === 'th' ? 'หัวข้อ' : 'kpis'}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Row: Critical Points & Drilldown Link (e.g. 1 จุดวิกฤต & ดูตัวชี้วัด >) */}
              <div>
                <div className="h-px w-full bg-slate-100 mb-2.5" />
                <div className="flex items-center justify-between text-xs pt-0.5">
                  {/* Left: Critical points matching image (shield/alert icon with red/rose text) */}
                  <div
                    className={`inline-flex items-center gap-1.5 font-bold ${
                      stats.criticalCount > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  >
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {stats.criticalCount > 0
                        ? `${stats.criticalCount} ${language === 'th' ? 'จุดวิกฤต' : 'Critical'}`
                        : language === 'th'
                        ? '0 จุดวิกฤต'
                        : '0 Critical'}
                    </span>
                  </div>


                  {/* Right: View KPI Details link (e.g. ดูตัวชี้วัด > in bold indigo/blue) */}
                  <div
                    className={`inline-flex items-center gap-1 font-extrabold transition-colors cursor-pointer ${
                      isSelected
                        ? 'text-indigo-700 underline'
                        : 'text-indigo-600 hover:text-indigo-800'
                    }`}
                  >
                    <span>{language === 'th' ? 'ดูตัวชี้วัด' : 'View KPIs'}</span>
                    <ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};


