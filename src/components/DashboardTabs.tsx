import React from 'react';
import { AlertTriangle, BarChart3, Bell, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type DashboardTab = 'overview' | 'tracked_kpis' | 'monthly_sheet' | 'action_plan';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onChangeTab: (tab: DashboardTab) => void;
  breachCount?: number;
  totalKpiCount?: number;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onChangeTab,
  breachCount = 0,
  totalKpiCount = 0,
}) => {
  const { language } = useLanguage();

  const tabs: Array<{
    id: DashboardTab;
    labelTh: string;
    labelEn: string;
    icon: React.ReactNode;
    badge?: number;
    badgeType?: 'danger' | 'neutral';
  }> = [
    {
      id: 'overview',
      labelTh: 'ภาพรวมแดชบอร์ด FY2026 (Overview)',
      labelEn: 'Dashboard Overview FY2026',
      icon: <BarChart3 className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'monthly_sheet',
      labelTh: 'ตารางตัวชี้วัด 12 เดือน (Monthly Sheet)',
      labelEn: '12-Month KPI Matrix (Monthly Sheet)',
      icon: <FileSpreadsheet className="h-4 w-4 shrink-0" />,
      badge: totalKpiCount > 0 ? totalKpiCount : undefined,
      badgeType: 'neutral',
    },
    {
      id: 'tracked_kpis',
      labelTh: 'รายการตัวชี้วัดที่ต้องติดตาม',
      labelEn: 'Tracked KPIs Watchlist',
      icon: <Bell className="h-4 w-4 shrink-0" />,
      badge: breachCount > 0 ? breachCount : undefined,
      badgeType: 'danger',
    },
  ];

  return (
    <div className="w-full font-['Prompt',sans-serif]">
      {/* Scrollable Tabs Wrapper */}
      <div className="relative overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        <nav
          className="flex items-center gap-2 min-w-max py-1"
          aria-label="Dashboard View Tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer select-none whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-700 border border-blue-200/90 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                <span
                  className={`${
                    isActive
                      ? 'text-blue-600'
                      : tab.id === 'action_plan' && breachCount > 0
                      ? 'text-amber-500'
                      : 'text-slate-400'
                  }`}
                >
                  {tab.icon}
                </span>
                <span>{language === 'th' ? tab.labelTh : tab.labelEn}</span>

                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tab.badgeType === 'danger'
                        ? 'bg-red-500 text-white shadow-2xs'
                        : isActive
                        ? 'bg-blue-200/70 text-blue-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subtle border bottom divider */}
      <div className="h-px w-full bg-slate-200/80 -mt-0.5" />
    </div>
  );
};
