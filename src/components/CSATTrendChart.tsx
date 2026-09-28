import React, { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Database, Info, Sparkles, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { KPIItem, MonthKey, MONTHS } from '../types';

interface CSATTrendChartProps {
  items?: KPIItem[];
  onDrillDown?: () => void;
}

// Historical Benchmark Data (FY2025)
const FY2025_BENCHMARK_VALUES = [
  { monthKey: 'APR' as MonthKey, overall: 90, transport: 100, depot: 78, wh: 89 },
  { monthKey: 'MAY' as MonthKey, overall: 88, transport: 100, depot: 78, wh: 84 },
  { monthKey: 'JUN' as MonthKey, overall: 90, transport: 100, depot: 92, wh: 79 },
  { monthKey: 'JUL' as MonthKey, overall: 86, transport: 100, depot: 89, wh: 70 },
  { monthKey: 'AUG' as MonthKey, overall: 88, transport: 100, depot: 78, wh: 84 },
  { monthKey: 'SEP' as MonthKey, overall: 86, transport: null, depot: 90, wh: 81 },
  { monthKey: 'OCT' as MonthKey, overall: 89, transport: null, depot: 94, wh: 84 },
  { monthKey: 'NOV' as MonthKey, overall: 92, transport: null, depot: 100, wh: 84 },
  { monthKey: 'DEC' as MonthKey, overall: 93, transport: null, depot: 100, wh: 86 },
  { monthKey: 'JAN' as MonthKey, overall: 89, transport: null, depot: 95, wh: 82 },
  { monthKey: 'FEB' as MonthKey, overall: 89, transport: null, depot: 92, wh: 86 },
  { monthKey: 'MAR' as MonthKey, overall: 93, transport: null, depot: 96, wh: 90 },
];

export const CSATTrendChart: React.FC<CSATTrendChartProps> = ({
  items = [],
  onDrillDown,
}) => {
  const { language, t, getMonthName } = useLanguage();
  const [selectedYearMode, setSelectedYearMode] = useState<'FY2025' | 'FY2026'>('FY2026');

  // Extract Live FY2026 CSAT from items
  const corporateCsatKpi = items.find(
    (k) =>
      k.department === 'Corporate' &&
      (k.nameTh.includes('ความพึงพอใจรวม') || (k.nameTh.includes('ความพึงพอใจ') && k.codeNumber === '2'))
  );

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

  // Build live FY2026 dataset from entered monthly values
  const fy2026LiveData = MONTHS.map((m) => {
    const monthLabel = getMonthName(m);
    const overallVal = corporateCsatKpi?.monthlyValues[m]?.value ?? null;
    const transportVal = transportKpi?.monthlyValues[m]?.value ?? null;
    const depotVal = depotKpi?.monthlyValues[m]?.value ?? null;
    const whVal = whKpi?.monthlyValues[m]?.value ?? null;

    return {
      month: monthLabel,
      overall: overallVal,
      transport: transportVal,
      depot: depotVal,
      wh: whVal,
    };
  });

  const fy2025Data = FY2025_BENCHMARK_VALUES.map((d) => ({
    month: getMonthName(d.monthKey),
    overall: d.overall,
    transport: d.transport,
    depot: d.depot,
    wh: d.wh,
  }));

  // Active chart data depending on mode
  const chartData = selectedYearMode === 'FY2025' ? fy2025Data : fy2026LiveData;

  // Calculate legend averages
  const calcAvg = (key: 'overall' | 'transport' | 'depot' | 'wh') => {
    const vals = chartData
      .map((d) => d[key])
      .filter((v): v is number => v !== null && v !== undefined && !isNaN(v));
    if (vals.length === 0) {
      if (selectedYearMode === 'FY2025') {
        return key === 'transport' ? '97%' : key === 'depot' ? '91%' : key === 'wh' ? '83%' : '89%';
      }
      if (key === 'transport') {
        return language === 'th' ? 'รอผลการรายงาน' : 'Pending Report';
      }
      return t.csatChart.pendingEvaluation;
    }
    const sum = vals.reduce((a, b) => a + b, 0);
    return `${Math.round(sum / vals.length)}%`;
  };

  const avgOverall = calcAvg('overall');
  const avgTransport = calcAvg('transport');
  const avgDepot = calcAvg('depot');
  const avgWH = calcAvg('wh');

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs font-['Prompt',sans-serif]">
      {/* Chart Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {language === 'th'
                ? `แนวโน้มความพึงพอใจลูกค้าตลอดปี ${selectedYearMode} (CSAT by Division)`
                : `Annual Customer Satisfaction Trend ${selectedYearMode} (CSAT by Division)`}
            </h2>
            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
              {t.csatChart.target95}
            </span>

            {/* Mode Tag */}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                selectedYearMode === 'FY2025'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              }`}
            >
              {selectedYearMode === 'FY2025'
                ? (language === 'th' ? 'ปีฐานเปรียบเทียบ (Benchmark)' : 'Historical Benchmark')
                : (language === 'th' ? 'รับข้อมูลจริงตาม Google Sheets' : 'Live from Google Sheets')}
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {language === 'th'
              ? 'เปรียบเทียบคะแนนภาพรวมองค์กร, งานบริการลานตู้ (Depot), คลังสินค้า (Warehouse), และฝ่ายขนส่ง (Transport)'
              : 'Benchmark of corporate overall score, Depot services, Warehouse operations, and Transport division.'}
          </p>
        </div>

        {/* Action / Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100/80 p-1 text-xs font-medium">
            <button
              onClick={() => setSelectedYearMode('FY2025')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                selectedYearMode === 'FY2025'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.csatChart.fy2025Tab}
            </button>
            <button
              onClick={() => setSelectedYearMode('FY2026')}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                selectedYearMode === 'FY2026'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.csatChart.fy2026Tab}
            </button>
          </div>
        </div>
      </div>

      {/* Legend pills matching user's image */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-2 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
            <span>{t.csatChart.overall}</span>
            <span className="font-bold text-slate-900">({avgOverall})</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
            <span>{t.csatChart.transport}</span>
            <span className="font-bold text-slate-900">({avgTransport})</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm font-medium border border-emerald-200/50">
              {language === 'th' ? '09/25-03/26 รอผล' : '09/25-03/26 Pending'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
            <span>{t.csatChart.depot}</span>
            <span className="font-bold text-slate-900">({avgDepot})</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
            <span>{t.csatChart.warehouse}</span>
            <span className="font-bold text-slate-900">({avgWH})</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 font-medium">
          {language === 'th'
            ? '*ฝ่ายขนส่ง (Transport): ข้อมูลจริง เม.ย. - ส.ค. 2025 ได้ 100% | เดือน 09/2025 - 03/2026 ยังรอผลการรายงาน'
            : '*Transport: Apr-Aug 2025 at 100% | 09/2025-03/2026 evaluations pending report'}
        </span>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              stroke="#64748b"
              fontSize={11}
              tickLine={true}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              unit="%"
              stroke="#64748b"
              fontSize={11}
              tickLine={true}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
              }}
              formatter={(val: any, name: any) => {
                const labelMap: Record<string, string> = {
                  overall: t.csatChart.overall,
                  transport: t.csatChart.transport,
                  depot: t.csatChart.depot,
                  wh: t.csatChart.warehouse,
                };
                let displayVal = val !== null && val !== undefined ? `${val}%` : t.csatChart.pendingEvaluation;
                if (String(name) === 'transport' && (val === null || val === undefined)) {
                  displayVal = language === 'th' ? 'รอผลการรายงาน (09/2025-03/2026)' : 'Pending report (09/2025-03/2026)';
                }
                return [
                  displayVal,
                  labelMap[String(name)] || name,
                ];
              }}
            />

            {/* Target 95% Reference Line */}
            <ReferenceLine
              y={95}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: 'Target 95%',
                position: 'right',
                fill: '#dc2626',
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            {/* 1. Transport line - stops cleanly at AUG (08/2025) as 09/2025-03/2026 is pending */}
            <Line
              type="monotone"
              dataKey="transport"
              name="transport"
              stroke="#10b981"
              strokeWidth={2}
              connectNulls={false}
              dot={{ r: 3.5, fill: '#ffffff', stroke: '#10b981', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />

            {/* 2. Depot line */}
            <Line
              type="monotone"
              dataKey="depot"
              name="depot"
              stroke="#f59e0b"
              strokeDasharray="2 3"
              strokeWidth={2}
              connectNulls={true}
              dot={{ r: 3.5, fill: '#ffffff', stroke: '#f59e0b', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />

            {/* 3. Overall line */}
            <Line
              type="monotone"
              dataKey="overall"
              name="overall"
              stroke="#2563eb"
              strokeWidth={2.5}
              connectNulls={true}
              dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2.5 }}
              activeDot={{ r: 6 }}
            />

            {/* 4. Warehouse line */}
            <Line
              type="monotone"
              dataKey="wh"
              name="wh"
              stroke="#ef4444"
              strokeWidth={2}
              connectNulls={true}
              dot={{ r: 3.5, fill: '#ffffff', stroke: '#ef4444', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Executive Observation Callout */}
      <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:p-4 text-xs text-slate-700 flex items-start gap-2.5">
        <div className="rounded-full bg-blue-100 p-1 text-blue-700 shrink-0 mt-0.5">
          <Info className="h-3.5 w-3.5" />
        </div>
        <div className="leading-relaxed">
          <strong className="text-slate-900 font-bold">
            {language === 'th' ? 'ข้อสังเกตของผู้บริหาร:' : 'Executive Insight:'}
          </strong>{' '}
          {selectedYearMode === 'FY2025' ? (
            language === 'th' ? (
              <>
                ฝ่ายขนส่ง (Transport) ผลงาน 100% ในช่วง 5 เดือนแรก (เม.ย.-ส.ค. 2025) และตั้งแต่เดือน 09/2025-03/2026 อยู่ระหว่างรอผลการรายงาน ขณะที่คะแนน Depot มีการฟื้นตัวแตะ 100% ในเดือน พ.ย.-ธ.ค. และ Warehouse ทะยานขึ้นสู่ 90% ในปลายปี
              </>
            ) : (
              <>
                Transport division achieved 100% in the first 5 months (Apr–Aug 2025), with 09/2025–03/2026 pending report. Depot CSAT recovered to 100% in Nov–Dec, while Warehouse rose to 90% at year-end.
              </>
            )
          ) : (
            language === 'th' ? (
              <>
                ระบบบันทึกผลงานประจำปี FY2026: ฝ่ายขนส่ง (Transport) ผลประเมินได้ 100% เต็มตามเป้าหมายในช่วง เม.ย. - ส.ค. 2025 โดยผลการรายงานตั้งแต่เดือน 09/2025 - 03/2026 ยังอยู่ระหว่างรอผลการรายงานจากลูกค้า ส่วนคลังสินค้า (WH) เฉลี่ย 82% และ Depot อยู่ระหว่างรวบรวมข้อมูล
              </>
            ) : (
              <>
                FY2026 live performance: Transport achieved 100% satisfaction in the first 5 months (Apr–Aug 2025), with results from 09/2025 to 03/2026 pending report. Warehouse averages 82%, and Depot is compiling evaluations.
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};
