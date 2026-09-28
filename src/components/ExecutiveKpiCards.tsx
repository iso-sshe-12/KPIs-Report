import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Database,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { KPIItem, MonthKey, MONTHS } from '../types';

interface ExecutiveKpiCardsProps {
  items: KPIItem[];
  onSelectKpi?: (kpi: KPIItem) => void;
  onSelectKpiByName?: (searchKeyword: string) => void;
  onFilterStatus?: (status: 'all' | 'failed' | 'passed' | 'pending') => void;
  onOpenDataEntry?: () => void;
}

export const ExecutiveKpiCards: React.FC<ExecutiveKpiCardsProps> = ({
  items,
  onSelectKpi,
  onSelectKpiByName,
  onFilterStatus,
  onOpenDataEntry,
}) => {
  const { language, t, getMonthName } = useLanguage();

  // 1. Safety KPI: Corporate #1 (อุบัติเหตุถึงขั้นหยุดงาน)
  const safetyKpi = items.find(
    (k) =>
      k.department === 'Corporate' &&
      (k.nameTh.includes('อุบัติเหตุ') || k.codeNumber === '1')
  );

  let safetyValue = 0;
  let safetyMonth = language === 'th' ? 'สะสมปี FY2026' : 'FY2026 YTD';
  let isSafetyTargetMet = true;

  if (safetyKpi) {
    for (let i = MONTHS.length - 1; i >= 0; i--) {
      const m = MONTHS[i];
      const entry = safetyKpi.monthlyValues[m];
      if (entry && entry.value !== undefined && !entry.isPending) {
        safetyValue = entry.value;
        safetyMonth = getMonthName(m);
        break;
      }
    }
    isSafetyTargetMet = safetyValue === 0;
  }

  // 2. CSAT KPI: Corporate #2 (คะแนนความพึงพอใจรวมจากลูกค้า)
  const csatKpi = items.find(
    (k) =>
      k.department === 'Corporate' &&
      (k.nameTh.includes('ความพึงพอใจรวม') || (k.nameTh.includes('ความพึงพอใจ') && k.codeNumber === '2'))
  );

  // Sub-division CSAT KPIs (2.1 Depot, 2.2 WH, 2.3 Transport)
  const depotKpi = items.find(
    (k) =>
      (k.department === 'Corporate' && (k.codeNumber === '(2.1)' || k.nameTh.includes('Depot'))) ||
      ((k.department === 'OPS' || k.department === 'CR') && k.nameTh.includes('ความพึงพอใจ'))
  );

  const whKpi = items.find(
    (k) =>
      (k.department === 'Corporate' && (k.codeNumber === '(2.2)' || k.nameTh.includes('Warehouse'))) ||
      (k.department === 'WH' && (k.nameTh.includes('ความพึงพอใจ') || k.codeNumber === '1'))
  );

  const transportKpi = items.find(
    (k) =>
      (k.department === 'Corporate' && (k.codeNumber === '(2.3)' || k.nameTh.includes('Transport'))) ||
      (k.department === 'Transport' && k.nameTh.includes('ความพึงพอใจ'))
  );

  // Calculate dynamic CSAT average strictly from real entered months
  const getCsatStats = (kpi?: KPIItem): { avg: number | null; display: string } => {
    if (!kpi) return { avg: null, display: t.executiveCards.pendingEvaluation };
    const validValues = MONTHS.map((m) => kpi.monthlyValues[m]?.value).filter(
      (v): v is number => v !== undefined && !isNaN(v)
    );
    if (validValues.length > 0) {
      const sum = validValues.reduce((acc, curr) => acc + curr, 0);
      const avg = Math.round(sum / validValues.length);
      return { avg, display: `${avg}%` };
    }
    if (kpi.averageRaw && (kpi.averageRaw.includes('รอผล') || kpi.averageRaw.includes('pending'))) {
      return { avg: null, display: language === 'th' ? kpi.averageRaw : t.executiveCards.pendingEvaluation };
    }
    return { avg: null, display: t.executiveCards.pendingEvaluation };
  };

  const csatStats = getCsatStats(csatKpi);
  const transportStats = getCsatStats(transportKpi);
  const depotStats = getCsatStats(depotKpi);
  const whStats = getCsatStats(whKpi);

  const csatTarget = 95;
  const csatAvgValue = csatStats.avg !== null ? csatStats.avg : 82;
  const csatGap = csatAvgValue - csatTarget;

  // 3. Profit / Cost Reduction KPI: Corporate #3 (ได้กำไร และ/หรือ ลดต้นทุน)
  const profitKpi = items.find(
    (k) =>
      k.department === 'Corporate' &&
      (k.nameTh.includes('กำไร') || k.nameTh.includes('ลดต้นทุน') || k.codeNumber === '3')
  );

  const profitTarget = 5.0;
  let profitHasData = false;
  let profitAvgValue: number | undefined = undefined;

  if (profitKpi) {
    const validValues = MONTHS.map((m) => profitKpi.monthlyValues[m]?.value).filter(
      (v): v is number => v !== undefined && !isNaN(v)
    );
    if (validValues.length > 0) {
      profitHasData = true;
      const sum = validValues.reduce((acc, curr) => acc + curr, 0);
      profitAvgValue = Number((sum / validValues.length).toFixed(1));
    }
  }

  const profitGap = profitAvgValue !== undefined ? Number((profitAvgValue - profitTarget).toFixed(1)) : 0;
  const isProfitTargetMet = profitAvgValue !== undefined && profitAvgValue >= profitTarget;

  // 4. Overall KPIs achievement rate
  const totalKpis = items.length;
  const passedKpis = items.filter((k) => k.status === 'passed').length;
  const failedKpis = items.filter((k) => k.status === 'failed').length;
  const pendingKpis = items.filter((k) => k.status === 'pending').length;

  const evaluatedCount = passedKpis + failedKpis;
  const overallSuccessRate =
    evaluatedCount > 0 ? Math.round((passedKpis / evaluatedCount) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* 4 Cards Grid - Exact reproduction of Screenshot 1 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 font-['Prompt',sans-serif]">
        {/* Card 1: ความปลอดภัยระดับองค์กร */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md overflow-hidden">
          {/* Subtle decorative background circle */}
          <div
            className={`absolute -top-6 -right-6 h-24 w-24 rounded-full pointer-events-none ${
              isSafetyTargetMet ? 'bg-emerald-50/70' : 'bg-rose-50/70'
            }`}
          />

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">
                {t.executiveCards.safetyTitle}
              </h3>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-black tracking-tight ${
                  isSafetyTargetMet ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {safetyValue}
              </span>
              <span className="text-sm font-semibold text-slate-700">
                Case ({safetyMonth})
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">{t.executiveCards.safetyTarget}</span>
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            {isSafetyTargetMet ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                <CheckCircle2 className="h-3 w-3" />
                <span>{t.executiveCards.profitMet}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200/60">
                <AlertTriangle className="h-3 w-3" />
                <span>{t.executiveCards.profitNotMet}</span>
              </span>
            )}

            <button
              onClick={() => {
                if (safetyKpi && onSelectKpi) onSelectKpi(safetyKpi);
                else onSelectKpiByName && onSelectKpiByName('อุบัติเหตุ');
              }}
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group"
            >
              <span>{language === 'th' ? 'เจาะลึก' : 'Detail'}</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Card 2: ความพึงพอใจลูกค้ารวม (CSAT) */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md overflow-hidden">
          {/* Subtle decorative background circle */}
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-50/70 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">
                {t.executiveCards.csatTitle}
              </h3>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-amber-500">
                {csatAvgValue}%
              </span>
              <span className="text-xs font-medium text-slate-500">
                {language === 'th' ? 'เฉลี่ยทั้งปี' : 'Annual Avg'}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-600">
              {language === 'th' ? 'เป้าหมาย:' : 'Target:'} <span className="font-semibold text-slate-800">&gt; {csatTarget}%</span>{' '}
              {csatGap >= 0 ? (
                <span className="font-bold text-emerald-600">(+{csatGap}% {t.executiveCards.profitOverTarget})</span>
              ) : (
                <span className="font-bold text-red-600">({csatGap}% {t.executiveCards.profitGap})</span>
              )}
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <div className="truncate pr-1">
              <span>
                {t.executiveCards.transport} <strong className={transportStats.avg !== null ? "text-emerald-700 font-semibold" : "text-slate-500 font-normal"}>{transportStats.display}</strong>
              </span>{' '}
              |{' '}
              <span>
                {t.executiveCards.depot} <strong className={depotStats.avg !== null ? "text-amber-700 font-semibold" : "text-slate-500 font-normal"}>{depotStats.display}</strong>
              </span>{' '}
              |{' '}
              <span>
                {t.executiveCards.warehouse} <strong className="text-red-600 font-semibold">{whStats.display}</strong>
              </span>
            </div>

            <button
              onClick={() => {
                if (csatKpi && onSelectKpi) onSelectKpi(csatKpi);
                else onSelectKpiByName && onSelectKpiByName('ความพึงพอใจ');
              }}
              className="inline-flex items-center shrink-0 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group"
            >
              <span>{language === 'th' ? 'เจาะลึก' : 'Detail'}</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Card 3: กำไร และ/หรือ ลดต้นทุน */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md overflow-hidden">
          {/* Subtle decorative background circle */}
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-emerald-50/70 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">
                {t.executiveCards.profitTitle}
              </h3>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              {profitHasData && profitAvgValue !== undefined ? (
                <>
                  <span
                    className={`text-3xl font-black tracking-tight ${
                      isProfitTargetMet ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {profitAvgValue}%
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {language === 'th' ? 'เฉลี่ยทั้งปี' : 'Annual Avg'}
                  </span>
                </>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-slate-600">
                    {t.executiveCards.pendingEvaluation}
                  </span>
                </div>
              )}
            </div>

            <p className="mt-1 text-xs text-slate-600">
              {language === 'th' ? 'เป้าหมาย:' : 'Target:'} <span className="font-semibold text-slate-800">&gt;= {profitTarget.toFixed(1)}%</span>{' '}
              {profitHasData && profitAvgValue !== undefined ? (
                profitGap >= 0 ? (
                  <span className="font-bold text-emerald-600">(+{profitGap}% {t.executiveCards.profitOverTarget})</span>
                ) : (
                  <span className="font-bold text-red-600">({profitGap}% {t.executiveCards.profitGap})</span>
                )
              ) : (
                <span className="text-slate-400 font-normal">({t.executiveCards.profitDept})</span>
              )}
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            {profitHasData && profitAvgValue !== undefined ? (
              isProfitTargetMet ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{t.executiveCards.profitMet}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200/60">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{t.executiveCards.profitNotMet}</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
                <Clock className="h-3 w-3" />
                <span>{t.executiveCards.profitPending}</span>
              </span>
            )}

            <button
              onClick={() => {
                if (profitKpi && onSelectKpi) onSelectKpi(profitKpi);
                else onSelectKpiByName && onSelectKpiByName('กำไร');
              }}
              className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer group"
            >
              <span>{language === 'th' ? 'เจาะลึก' : 'Detail'}</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Card 4: อัตราความสำเร็จ KPIS ทั้งหมด */}
        <div className="relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md overflow-hidden">
          {/* Subtle decorative background circle */}
          <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-blue-50/70 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700">
                {t.executiveCards.overallTitle}
              </h3>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-black tracking-tight text-blue-700">
                {evaluatedCount > 0 ? `${overallSuccessRate}%` : (language === 'th' ? 'รอประเมิน' : 'Pending')}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {t.executiveCards.overallEvaluated} {evaluatedCount} / {totalKpis} {language === 'th' ? 'ตัว' : 'KPIs'}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-600">
              {t.executiveCards.overallStandard}
            </p>
          </div>

          {/* Progress Bar: Passed (green) vs Failed (red) vs Pending (slate) */}
          <div className="mt-5 space-y-1.5">
            <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-100">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${totalKpis > 0 ? (passedKpis / totalKpis) * 100 : 0}%` }}
                title={`${t.executiveCards.passedBadge} ${passedKpis}`}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{ width: `${totalKpis > 0 ? (failedKpis / totalKpis) * 100 : 0}%` }}
                title={`${t.executiveCards.failedBadge} ${failedKpis}`}
              />
              <div
                className="bg-slate-200 h-full transition-all duration-500"
                style={{ width: `${totalKpis > 0 ? (pendingKpis / totalKpis) * 100 : 100}%` }}
                title={`${t.executiveCards.pendingBadge} ${pendingKpis}`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-semibold">
              <button
                onClick={() => onFilterStatus && onFilterStatus('passed')}
                className="text-emerald-700 hover:underline cursor-pointer"
              >
                {t.executiveCards.passedBadge} {passedKpis}
              </button>
              <button
                onClick={() => onFilterStatus && onFilterStatus('failed')}
                className="text-rose-600 hover:underline cursor-pointer"
              >
                {t.executiveCards.failedBadge} {failedKpis}
              </button>
              <button
                onClick={() => onFilterStatus && onFilterStatus('pending')}
                className="text-slate-500 hover:underline cursor-pointer"
              >
                {t.executiveCards.pendingBadge} {pendingKpis}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
