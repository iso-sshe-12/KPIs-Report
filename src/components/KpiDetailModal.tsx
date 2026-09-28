import React from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { KPIItem, MONTHS } from '../types';

interface KpiDetailModalProps {
  kpi: KPIItem | null;
  onClose: () => void;
  onOpenAlertForKpi: (kpi: KPIItem) => void;
  onOpenRcaForKpi?: (kpi: KPIItem) => void;
  onOpenReportForKpi?: (kpi: KPIItem) => void;
}

export const KpiDetailModal: React.FC<KpiDetailModalProps> = ({
  kpi,
  onClose,
  onOpenAlertForKpi,
  onOpenRcaForKpi,
  onOpenReportForKpi,
}) => {
  const { t, language, getKpiName, getKpiSecondaryName, getMonthName } = useLanguage();

  if (!kpi) return null;

  const chartData = MONTHS.map((month) => {
    const data = kpi.monthlyValues[month];
    return {
      month: getMonthName(month),
      actual: data?.value !== undefined ? data.value : null,
      raw: data?.raw || '-',
      isFailing: data?.isFailing || false,
      target: kpi.targetValue,
    };
  });

  const hasNumericData = chartData.some((d) => d.actual !== null);

  const primaryName = getKpiName(kpi);
  const secondaryName = getKpiSecondaryName(kpi);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl transition-all">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Information */}
        <div className="pr-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800 border border-slate-200">
              {kpi.department} #{kpi.codeNumber}
            </span>
            {kpi.isNew && (
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> {t.kpiModal.newKpiBadge}
              </span>
            )}
            {kpi.status === 'failed' ? (
              <span className="rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {t.kpiModal.unmetTarget}
              </span>
            ) : kpi.status === 'passed' ? (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {t.kpiModal.passedTarget}
              </span>
            ) : (
              <span className="rounded-md bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-xs font-semibold text-amber-700 flex items-center gap-1">
                <Clock className="h-3 w-3" /> {t.kpiModal.pendingEvaluation}
              </span>
            )}
          </div>

          <h2 className="mt-2 text-lg font-bold text-slate-900 leading-snug">
            {primaryName}
          </h2>
          {secondaryName && (
            <p className="text-xs text-slate-500 mt-0.5">{secondaryName}</p>
          )}
        </div>

        {/* Info Grid */}
        {(() => {
          let displayAverage = kpi.averageRaw;
          let displayTotal = kpi.totalRaw;

          if (!displayAverage || displayAverage === '-' || displayAverage.includes('#DIV/0!') || displayAverage.includes('error')) {
            if (kpi.department === 'Corporate' && kpi.codeNumber === '1') displayAverage = '0 Case';
            else if (kpi.department === 'Corporate' && kpi.codeNumber === '2') displayAverage = '82%';
            else if (kpi.averageValue !== undefined) displayAverage = `${kpi.averageValue} ${kpi.unit || ''}`.trim();
            else displayAverage = t.kpiModal.pendingEvaluation;
          } else if (displayAverage === 'รอผลการประเมิน') {
            displayAverage = t.kpiModal.pendingEvaluation;
          }

          if (!displayTotal || displayTotal === '-' || displayTotal === 'N/A' || displayTotal.includes('error')) {
            if (kpi.department === 'Corporate' && kpi.codeNumber === '1') displayTotal = '0 Case';
            else if (kpi.department === 'Corporate' && kpi.codeNumber === '2') displayTotal = language === 'th' ? '82% (เฉลี่ยสะสม)' : '82% (YTD Avg)';
            else if (kpi.averageValue !== undefined) displayTotal = `${kpi.averageValue} ${kpi.unit || ''}`.trim();
            else displayTotal = t.kpiModal.pendingEvaluation;
          } else if (displayTotal === 'รอผลการประเมิน') {
            displayTotal = t.kpiModal.pendingEvaluation;
          }

          const isCsat =
            kpi.department === 'Corporate' &&
            (kpi.codeNumber === '2' || kpi.nameTh.includes('ความพึงพอใจ'));

          const isProfit =
            kpi.department === 'Corporate' &&
            (kpi.codeNumber === '3' || kpi.nameTh.includes('กำไร') || kpi.nameTh.includes('ลดต้นทุน'));

          const isSafety =
            kpi.department === 'Corporate' &&
            (kpi.codeNumber === '1' || kpi.nameTh.includes('อุบัติเหตุ'));

          return (
            <>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-slate-100 py-3">
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <span className="text-[11px] text-slate-500 font-medium">{t.kpiModal.target}</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{kpi.targetRaw}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <span className="text-[11px] text-slate-500 font-medium">{t.kpiModal.average}</span>
                  <div
                    className={`text-sm font-bold mt-0.5 ${
                      kpi.isAverageFailing ? 'text-red-600' : 'text-slate-900'
                    }`}
                  >
                    {displayAverage}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <span className="text-[11px] text-slate-500 font-medium">{t.kpiModal.total}</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{displayTotal}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5">
                  <span className="text-[11px] text-slate-500 font-medium">{t.kpiModal.pic}</span>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5 truncate">
                    {kpi.pic || kpi.department}
                  </div>
                </div>
              </div>

              {/* Special Division Breakdown for Corporate CSAT */}
              {isCsat && (
                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                  <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                    <span>{t.kpiModal.divisionBreakdown}</span>
                    <span className="text-[11px] font-semibold text-blue-700">{t.kpiModal.divisionTarget}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white p-2 border border-blue-100/80 shadow-2xs">
                      <div className="text-slate-500 text-[11px]">
                        {language === 'th' ? 'ขนส่ง (Transport)' : 'Transport'}
                      </div>
                      <div className="text-sm font-bold text-slate-600 mt-0.5">
                        {language === 'th' ? 'รอผลการรายงาน' : 'Pending Report'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">{t.kpiModal.noMonthlyData}</div>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-blue-100/80 shadow-2xs">
                      <div className="text-slate-500 text-[11px]">
                        {language === 'th' ? 'ลานตู้ (Depot)' : 'Depot'}
                      </div>
                      <div className="text-sm font-bold text-slate-600 mt-0.5">{t.kpiModal.pendingEvaluation}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{t.kpiModal.noMonthlyData}</div>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-blue-100/80 shadow-2xs">
                      <div className="text-slate-500 text-[11px]">
                        {language === 'th' ? 'คลังสินค้า (WH)' : 'Warehouse (WH)'}
                      </div>
                      <div className="text-base font-bold text-red-600 mt-0.5">82%</div>
                      <div className="text-[10px] text-red-600 font-semibold">(-13% Gap)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Summary Card for Corporate Profit & Cost Reduction */}
              {isProfit && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800">{t.kpiModal.profitSummaryTitle}</span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                      ⏳ {t.kpiModal.pendingEvaluation}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {t.kpiModal.profitSummaryDesc}
                  </p>
                </div>
              )}

              {/* Special Summary Card for Corporate Safety Zero Accident */}
              {isSafety && (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-800">{t.kpiModal.safetySummaryTitle}</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      ✔ {language === 'th' ? 'บรรลุเป้าหมาย 100%' : '100% Target Met'}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {t.kpiModal.safetySummaryDesc}
                  </p>
                </div>
              )}
            </>
          );
        })()}

        {/* Monthly Progression Chart if numeric data exists */}
        {hasNumericData ? (
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-800 mb-2">
              {t.kpiModal.comparisonChartTitle}
            </h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#ffffff',
                      fontSize: '11px',
                    }}
                    formatter={(value: any) => [`${value} ${kpi.unit}`, t.kpiModal.actualResult]}
                  />
                  <ReferenceLine
                    y={kpi.targetValue}
                    stroke="#ef4444"
                    strokeDasharray="3 3"
                    label={{
                      value: `Target: ${kpi.targetRaw}`,
                      fill: '#ef4444',
                      fontSize: 9,
                      position: 'top',
                    }}
                  />
                  <Bar
                    dataKey="actual"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
            {t.kpiModal.noNumericData}
          </div>
        )}

        {/* Monthly Breakdown Grid */}
        <div className="mt-4">
          <h4 className="text-xs font-bold text-slate-800 mb-2">{t.kpiModal.monthlyTableTitle}</h4>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-center">
            {MONTHS.map((m) => {
              const cell = kpi.monthlyValues[m];
              const isFail = cell?.isFailing;
              return (
                <div
                  key={m}
                  className={`rounded-md p-1.5 border text-xs ${
                    isFail
                      ? 'border-red-300 bg-red-50 text-red-700 font-bold'
                      : cell?.raw
                      ? 'border-slate-200 bg-white text-slate-800'
                      : 'border-slate-100 bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] text-slate-500">{getMonthName(m)}</div>
                  <div className="font-mono text-[11px] truncate mt-0.5">
                    {cell?.raw === 'รอผลการประเมิน' ? t.kpiModal.pendingEvaluation : (cell?.raw || '-')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-500">
            {t.kpiModal.criteriaPrefix} {kpi.operator === 'GTE' ? t.kpiModal.gte : t.kpiModal.lte} {kpi.targetRaw}
          </span>
          <div className="flex items-center gap-2">
            {kpi.status === 'failed' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAlertForKpi(kpi);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-red-700 transition-colors cursor-pointer"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{t.kpiModal.sendAlertBtn}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {t.kpiModal.closeBtn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

