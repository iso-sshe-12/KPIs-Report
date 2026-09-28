import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck2,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DepartmentCode, KPIItem, MONTHS } from '../types';

interface KpiTableProps {
  items: KPIItem[];
  selectedDepartment: 'ALL' | DepartmentCode;
  selectedStatus: 'all' | 'failed' | 'passed' | 'pending';
  onSelectDepartment: (dept: 'ALL' | DepartmentCode) => void;
  onSelectStatus: (status: 'all' | 'failed' | 'passed' | 'pending') => void;
  onSelectKpi: (kpi: KPIItem) => void;
  onOpenReportModal?: (kpi?: KPIItem) => void;
}

export const KpiTable: React.FC<KpiTableProps> = ({
  items,
  selectedDepartment,
  selectedStatus,
  onSelectDepartment,
  onSelectStatus,
  onSelectKpi,
  onOpenReportModal,
}) => {
  const { t, language, getKpiName, getKpiSecondaryName, getMonthName } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on department, status, and search query
  const filteredItems = items.filter((item) => {
    if (selectedDepartment !== 'ALL' && item.department !== selectedDepartment) {
      return false;
    }

    if (selectedStatus === 'failed' && item.status !== 'failed') return false;
    if (selectedStatus === 'passed' && item.status !== 'passed') return false;
    if (selectedStatus === 'pending' && item.status !== 'pending') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName =
        item.nameTh.toLowerCase().includes(q) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(q));
      const matchPic = item.pic && item.pic.toLowerCase().includes(q);
      const matchCode = item.codeNumber.toLowerCase().includes(q);
      const matchDept = item.department.toLowerCase().includes(q);
      return matchName || matchPic || matchCode || matchDept;
    }

    return true;
  });

  // Export current table view to CSV
  const handleExportCsv = () => {
    const headers = [
      'Department',
      'No',
      'KPI Name',
      'Target',
      ...MONTHS,
      'Total',
      'Average',
      'PIC',
      'Status',
    ];

    const rows = filteredItems.map((item) => [
      `"${item.department}"`,
      `"${item.codeNumber}"`,
      `"${item.nameTh} ${item.nameEn ? `(${item.nameEn})` : ''}"`,
      `"${item.targetRaw}"`,
      ...MONTHS.map((m) => `"${item.monthlyValues[m]?.raw || ''}"`),
      `"${item.totalRaw || ''}"`,
      `"${item.averageRaw || ''}"`,
      `"${item.pic || ''}"`,
      `"${item.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `FY2026_KPI_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="kpi-table-section" className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="border-b border-slate-200 bg-slate-50/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.kpiTable.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:border-slate-400 focus:ring-1 focus:ring-slate-400 shadow-2xs"
            />
          </div>

          {/* Status Filters & Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs shadow-2xs">
              <button
                onClick={() => onSelectStatus('all')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  selectedStatus === 'all'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.kpiTable.filterAll} ({items.length})
              </button>
              <button
                onClick={() => onSelectStatus('failed')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  selectedStatus === 'failed'
                    ? 'bg-red-600 text-white font-semibold'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {t.kpiTable.filterFailed} ({items.filter((k) => k.status === 'failed').length})
              </button>
              <button
                onClick={() => onSelectStatus('passed')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  selectedStatus === 'passed'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t.kpiTable.filterPassed} ({items.filter((k) => k.status === 'passed').length})
              </button>
              <button
                onClick={() => onSelectStatus('pending')}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  selectedStatus === 'pending'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.kpiTable.filterPending} ({items.filter((k) => k.status === 'pending').length})
              </button>
            </div>


            <button
              onClick={handleExportCsv}
              title={t.kpiTable.exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              <span>{t.kpiTable.exportCsv}</span>
            </button>
          </div>
        </div>

        {/* Legend Information */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
          <span className="font-semibold text-slate-700">{t.kpiTable.legendTitle}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <strong className="text-red-700">{t.kpiTable.legendRed}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <strong className="text-blue-700">{t.kpiTable.legendBlue}</strong>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>{t.kpiTable.legendGreen}</span>
          </span>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 font-semibold text-slate-800">
              <th className="py-3 px-3 text-center w-12 sticky left-0 bg-slate-100/90 z-10">{t.kpiTable.colDept}</th>
              <th className="py-3 px-2 text-center w-10">{t.kpiTable.colNo}</th>
              <th className="py-3 px-4 min-w-[280px]">{t.kpiTable.colKpiName}</th>
              <th className="py-3 px-3 min-w-[100px] text-right font-bold text-slate-900">{t.kpiTable.colTarget}</th>
              {MONTHS.map((m) => (
                <th key={m} className="py-3 px-2.5 text-center min-w-[58px] font-semibold text-slate-600">
                  {getMonthName(m)}
                </th>
              ))}
              <th className="py-3 px-3 text-center min-w-[70px]">{t.kpiTable.colTotal}</th>
              <th className="py-3 px-3 text-center min-w-[70px] font-bold">{t.kpiTable.colAverage}</th>
              <th className="py-3 px-3 min-w-[90px]">{t.kpiTable.colPic}</th>
              <th className="py-3 px-2 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={19} className="py-12 text-center text-slate-400">
                  {t.kpiTable.noMatchingKpi}
                </td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const hasBreach = item.status === 'failed';
                const primaryName = getKpiName(item);
                const secondaryName = getKpiSecondaryName(item);

                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectKpi(item)}
                    className={`group cursor-pointer transition-colors hover:bg-slate-50/80 ${
                      hasBreach ? 'bg-red-50/20' : ''
                    }`}
                  >
                    {/* Department Badge */}
                    <td className="py-2.5 px-3 text-center sticky left-0 bg-white group-hover:bg-slate-50/90 z-10">
                      <span className="inline-block rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                        {item.department}
                      </span>
                    </td>

                    {/* Code Number */}
                    <td className="py-2.5 px-2 text-center font-mono font-semibold text-slate-500 text-[11px]">
                      {item.codeNumber}
                    </td>

                    {/* KPI Name + New Badge */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-start gap-1.5">
                        {item.isNew && (
                          <span
                            title="26/05/2025"
                            className="mt-0.5 shrink-0 rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 flex items-center gap-0.5"
                          >
                            <Sparkles className="h-2.5 w-2.5" /> {t.kpiTable.newBadge}
                          </span>
                        )}
                        <div>
                          <div className={`font-semibold ${item.isNew ? 'text-blue-900 font-bold' : 'text-slate-900'}`}>
                            {primaryName}
                          </div>
                          {secondaryName && (
                            <div className="text-[11px] text-slate-400 font-normal leading-tight">
                              {secondaryName}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target Raw */}
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-900 whitespace-nowrap">
                      {item.targetRaw}
                    </td>

                    {/* Monthly Columns (APR - MAR) */}
                    {MONTHS.map((m) => {
                      const cell = item.monthlyValues[m];
                      if (!cell || !cell.raw) {
                        return (
                          <td key={m} className="py-2.5 px-2 text-center text-slate-300 font-mono">
                            -
                          </td>
                        );
                      }

                      if (cell.isFailing) {
                        return (
                          <td key={m} className="py-2.5 px-1.5 text-center">
                            <span
                              title={`${t.kpiTable.statusFailed}: ${cell.raw} (${t.kpiTable.colTarget}: ${item.targetRaw})`}
                              className="inline-block rounded-md bg-red-100 px-1.5 py-0.5 font-bold text-red-700 ring-1 ring-red-300 font-mono text-[11px]"
                            >
                              {cell.raw}
                            </span>
                          </td>
                        );
                      }

                      if (cell.isPending) {
                        return (
                          <td key={m} className="py-2.5 px-1 text-center">
                            <span
                              title={cell.raw}
                              className="inline-block rounded bg-amber-50/80 border border-amber-200/60 px-1 py-0.5 text-[9px] font-medium text-amber-700 truncate max-w-[64px]"
                            >
                              {t.kpiTable.statusPending}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td key={m} className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-700">
                          {cell.raw}
                        </td>
                      );
                    })}

                    {/* Total Column */}
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                      {item.totalRaw === 'รอผลการประเมิน' ? (
                        <span className="text-[10px] text-slate-400">{t.kpiTable.statusPending}</span>
                      ) : (
                        item.totalRaw || '-'
                      )}
                    </td>

                    {/* Average Column with Failing Indicator */}
                    <td className="py-2.5 px-3 text-center">
                      {item.isAverageFailing ? (
                        <span className="inline-block rounded-md bg-red-100 px-2 py-0.5 font-bold text-red-700 ring-1 ring-red-300 font-mono text-[11px]">
                          {item.averageRaw}
                        </span>
                      ) : item.status === 'pending' || item.averageRaw === 'รอผลการประเมิน' ? (
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                          {t.kpiTable.statusPending}
                        </span>
                      ) : (
                        <span className="font-mono text-[11px] font-semibold text-slate-800">
                          {item.averageRaw || '-'}
                        </span>
                      )}
                    </td>

                    {/* PIC */}
                    <td className="py-2.5 px-3 text-slate-600 text-[11px] whitespace-nowrap">
                      {item.pic || item.department}
                    </td>

                    {/* Arrow action */}
                    <td className="py-2.5 px-2 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-transform group-hover:translate-x-0.5" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer Summary */}
      <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          {language === 'th'
            ? `แสดง ${filteredItems.length} จากทั้งหมด ${items.length} รายการตัวชี้วัด`
            : `Showing ${filteredItems.length} of ${items.length} KPI records`}
        </span>
        <span className="text-[11px]">
          {t.kpiTable.footerHint}
        </span>
      </div>
    </div>
  );
};
