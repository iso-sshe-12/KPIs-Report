import React, { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DepartmentSummary, KPIItem, MONTHS } from '../types';

interface KpiTrendsChartProps {
  departments: DepartmentSummary[];
  items: KPIItem[];
  selectedKpiId?: string;
  onSelectKpiId: (id: string) => void;
}

export const KpiTrendsChart: React.FC<KpiTrendsChartProps> = ({
  departments,
  items,
  selectedKpiId,
  onSelectKpiId,
}) => {
  const { t, language, getKpiName, getMonthName } = useLanguage();
  const [viewMode, setViewMode] = useState<'department' | 'metric'>('department');

  // Find metrics with numeric data for the metric view
  const trackableItems = items.filter(
    (k) =>
      k.monthlyValues &&
      Object.values(k.monthlyValues).some((v) => v && (v as { value?: number }).value !== undefined)
  );

  const activeKpi = items.find((k) => k.id === selectedKpiId) || trackableItems[0] || items[0];

  const passedLabel = t.kpiAnalytics.passedLabel;
  const failedLabel = t.kpiAnalytics.failedLabel;
  const pendingLabel = t.kpiAnalytics.pendingLabel;

  // Data for department overview chart
  const deptChartData = departments.map((d) => ({
    name: d.code,
    [passedLabel]: d.passedKpis,
    [failedLabel]: d.failingKpis,
    [pendingLabel]: d.pendingKpis,
    achievement: d.achievementRate,
  }));

  // Data for selected metric monthly trend
  const metricTrendData = MONTHS.map((month) => {
    const data = activeKpi?.monthlyValues?.[month];
    return {
      month: getMonthName(month),
      actual: data?.value !== undefined ? data.value : null,
      raw: data?.raw || null,
      isFailing: data?.isFailing || false,
      target: activeKpi ? activeKpi.targetValue : null,
    };
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            {viewMode === 'department' ? (
              <BarChart3 className="h-4 w-4" />
            ) : (
              <LineChartIcon className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {viewMode === 'department'
                ? (language === 'th'
                    ? 'เปรียบเทียบผลการดำเนินงานรายฝ่าย (Department Performance Breakdown)'
                    : 'Department Performance Breakdown')
                : `${language === 'th' ? 'แนวโน้มรายเดือน:' : 'Monthly Trend:'} [${activeKpi?.department}] ${activeKpi ? getKpiName(activeKpi) : ''}`}
            </h3>
            <p className="text-xs text-slate-500">
              {viewMode === 'department'
                ? (language === 'th'
                    ? 'แสดงสัดส่วน KPI ที่ผ่านเกณฑ์เทียบกับที่ไม่บรรลุเป้าหมาย'
                    : 'Proportion of met vs unmet KPI targets across departments')
                : `${language === 'th' ? 'เป้าหมาย:' : 'Target:'} ${activeKpi?.targetRaw || '-'} | ${language === 'th' ? 'หน่วย:' : 'Unit:'} ${activeKpi?.unit || '-'}`}
            </p>
          </div>
        </div>

        {/* View Switcher & Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'metric' && (
            <select
              value={activeKpi?.id}
              onChange={(e) => onSelectKpiId(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-hidden focus:border-slate-400 max-w-[200px] truncate"
            >
              {trackableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.department}] {getKpiName(item).substring(0, 30)}...
                </option>
              ))}
            </select>
          )}

          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('department')}
              className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'department'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.kpiAnalytics.deptBreakdownTab}
            </button>
            <button
              onClick={() => setViewMode('metric')}
              className={`rounded-md px-3 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === 'metric'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.kpiAnalytics.monthlyDrilldownTab}
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-68 w-full pt-4">
        {viewMode === 'department' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey={passedLabel} stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey={failedLabel} stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              <Bar dataKey={pendingLabel} stackId="a" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metricTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '12px',
                }}
                formatter={(value: any) => [`${value} ${activeKpi?.unit || ''}`, language === 'th' ? 'ผลจริง' : 'Actual']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              {activeKpi && (
                <ReferenceLine
                  y={activeKpi.targetValue}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: `Target: ${activeKpi.targetRaw}`,
                    fill: '#ef4444',
                    fontSize: 10,
                    position: 'top',
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="actual"
                name={language === 'th' ? 'ผลการดำเนินงานจริง (Actual)' : 'Actual Performance'}
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

