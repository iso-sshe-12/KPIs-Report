import React from 'react';
import {
  AlertTriangle,
  ArrowDownRight,
  Award,
  Bell,
  CheckCircle2,
  Clock,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DepartmentCode, KPIItem } from '../types';
import { ExecutiveKpiCards } from './ExecutiveKpiCards';

interface ExecutiveSummaryProps {
  items: KPIItem[];
  breachedKpis: Array<{
    kpi: KPIItem;
    failedMonths: Array<{ month: string; actual: string }>;
    latestFailingValue?: string;
    reason: string;
  }>;
  onFilterStatus: (status: 'all' | 'failed' | 'passed' | 'pending') => void;
  onFilterDepartment: (dept: 'ALL' | DepartmentCode) => void;
  onOpenAlertsModal: () => void;
  onSelectKpi: (kpi: KPIItem) => void;
  onNavigateToActionPlan?: () => void;
  onNavigateToTrackedKpis?: () => void;
  onOpenRcaModal?: (preSelectedKpi?: KPIItem) => void;
  onOpenReportModal?: (preSelectedKpi?: KPIItem) => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  items,
  breachedKpis,
  onFilterStatus,
  onFilterDepartment,
  onOpenAlertsModal,
  onSelectKpi,
  onNavigateToActionPlan,
  onNavigateToTrackedKpis,
  onOpenRcaModal,
  onOpenReportModal,
}) => {
  const { language, t, getKpiName } = useLanguage();

  const handleSelectByKeyword = (keyword: string) => {
    let found: KPIItem | undefined;
    if (keyword.includes('อุบัติเหตุ') || keyword.toLowerCase().includes('accident') || keyword.toLowerCase().includes('safety')) {
      found = items.find(
        (k) => k.department === 'Corporate' && (k.codeNumber === '1' || k.nameTh.includes('อุบัติเหตุ'))
      );
    } else if (keyword.includes('ความพึงพอใจ') || keyword.toLowerCase().includes('csat') || keyword.toLowerCase().includes('satisfaction')) {
      found = items.find(
        (k) =>
          k.department === 'Corporate' &&
          (k.codeNumber === '2' || k.nameTh.includes('ความพึงพอใจรวม'))
      );
    } else if (keyword.includes('กำไร') || keyword.toLowerCase().includes('profit') || keyword.toLowerCase().includes('cost')) {
      found = items.find(
        (k) =>
          k.department === 'Corporate' &&
          (k.codeNumber === '3' || k.nameTh.includes('กำไร') || k.nameTh.includes('ลดต้นทุน'))
      );
    } else {
      found = items.find((k) => k.nameTh.includes(keyword) || (k.nameEn && k.nameEn.toLowerCase().includes(keyword.toLowerCase())));
    }

    if (found) {
      onSelectKpi(found);
    }
  };

  return (
    <section className="space-y-4">
      {/* 4 Executive Metric Cards Matching User Design */}
      <ExecutiveKpiCards
        items={items}
        onSelectKpi={onSelectKpi}
        onSelectKpiByName={handleSelectByKeyword}
        onFilterStatus={onFilterStatus}
      />

      {/* Subtle Navigation Shortcut Strip to Tracked KPIs Tab */}
      {breachedKpis.length > 0 && onNavigateToTrackedKpis && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-red-50/80 border border-red-200/80 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
              <AlertTriangle className="h-3 w-3" /> {language === 'th' ? 'แจ้งเตือน' : 'Alert'}
            </span>
            <span>
              {language === 'th'
                ? `ตรวจพบ ${breachedKpis.length} ตัวชี้วัดที่ต้องติดตาม (ไม่บรรลุเป้าหมาย)`
                : `Detected ${breachedKpis.length} below-target KPIs requiring attention`}
            </span>
          </div>
          <button
            id="btn-overview-goto-tracked-tab"
            onClick={onNavigateToTrackedKpis}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 transition-colors cursor-pointer"
          >
            <span>{language === 'th' ? 'เปิดดูแท็บ "รายการตัวชี้วัดที่ต้องติดตาม" ->' : 'View Tracked KPIs Tab ->'}</span>
          </button>
        </div>
      )}
    </section>
  );
};
