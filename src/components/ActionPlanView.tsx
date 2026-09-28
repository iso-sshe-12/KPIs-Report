import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
  TrendingDown,
  UserCheck,
  Paperclip,
  FileText,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DepartmentCode, KPIItem } from '../types';
import { ActionPlanRecord, RcaCapaModal } from './RcaCapaModal';

interface ActionPlanViewProps {
  items: KPIItem[];
  breachedKpis: Array<{
    kpi: KPIItem;
    failedMonths: Array<{ month: string; actual: string }>;
    latestFailingValue?: string;
    reason: string;
  }>;
  onSelectKpi: (kpi: KPIItem) => void;
  onOpenAlertsModal: () => void;
  onOpenGoogleChatModal: () => void;
  isAdmin?: boolean;
}

const DEFAULT_ACTION_PLANS: ActionPlanRecord[] = [
  {
    id: 'act-1',
    kpiCode: '3.1',
    kpiNameTh: 'กำไรขั้นต้นงานบริการลานตู้ (Depot Gross Profit)',
    kpiNameEn: 'Depot Gross Profit Margin',
    department: 'OPS',
    severity: 'high',
    target: '> 5%',
    actual: '-138%',
    gap: '-143%',
    rootCauseTh:
      'ปริมาณตู้ผ่านลานคอนเทนเนอร์ช่วง Q1 ต่ำกว่าประมาณการ 28% ขณะที่ต้นทุนคงที่ (Fixed Costs) ค่าเช่าพื้นที่ และค่าบำรุงรักษาเครื่องจักรยังคงเดิม',
    rootCauseEn:
      'Q1 container throughput was 28% below forecast while fixed costs, yard lease, and equipment maintenance remained unchanged.',
    correctiveActionTh:
      '1. เจรจาขยายสัญญาบริการกับสายการเดินเรือรายใหญ่เพิ่ม 2 สาย\n2. ปรับลดค่าใช้จ่ายการซ่อมบำรุงเชิงรุกและจัดตารางกะพนักงานตามปริมาณงานจริง\n3. ปรับโครงสร้างค่าบริการ Storage Fee สำหรับตู้ค้างลานเกินกำหนด',
    correctiveActionEn:
      '1. Negotiate additional volume contracts with 2 major shipping lines\n2. Rationalize shift scheduling based on actual throughput\n3. Adjust yard storage tariffs for extended dwell times',
    picTh: 'คุณสมคิด (ผู้จัดการฝ่ายลานตู้ OPS)',
    picEn: 'Somkid (Depot Operations Manager)',
    deadline: 'มิ.ย. 2025',
    status: 'in_progress',
  },
  {
    id: 'act-2',
    kpiCode: '3.2',
    kpiNameTh: 'กำไรขั้นต้นฝ่ายขนส่ง (Transport Gross Profit)',
    kpiNameEn: 'Transport Gross Profit Margin',
    department: 'Transport',
    severity: 'high',
    target: '> 5%',
    actual: '-26%',
    gap: '-31%',
    rootCauseTh:
      'อัตราเที่ยววิ่งขากลับ (Backhaul) ว่างเปล่าสูงถึง 42% และต้นทุนค่าน้ำมันเชื้อเพลิงรวมถึงค่าจ้างเหมาช่วง (Subcontractors) เพิ่มขึ้น',
    rootCauseEn:
      'Empty backhaul rate reached 42%, compounded by diesel price fluctuations and high third-party subcontract rates.',
    correctiveActionTh:
      '1. นำระบบจับคู่เที่ยวขากลับ (Backhaul Load Matching) ร่วมกับเครือข่ายคู่ค้า\n2. ควบคุมพฤติกรรมการขับขี่ผ่าน GPS Telematics เพื่อลดการสิ้นเปลืองน้ำมัน 5-8%\n3. ทบทวนสัญญาจ้างเหมาช่วงเพื่อควบคุมต้นทุนต่อเที่ยว',
    correctiveActionEn:
      '1. Implement digital backhaul load matching with logistics partners\n2. Enforce eco-driving standards via GPS telematics to cut fuel by 5-8%\n3. Renegotiate subcontractor rate structures',
    picTh: 'คุณประภาส (ผู้จัดการฝ่ายขนส่ง)',
    picEn: 'Prapas (Transport Manager)',
    deadline: 'ก.ค. 2025',
    status: 'in_progress',
  },
  {
    id: 'act-3',
    kpiCode: '3.3',
    kpiNameTh: 'กำไรขั้นต้นฝ่ายคลังสินค้า (Warehouse Gross Profit)',
    kpiNameEn: 'Warehouse Gross Profit Margin',
    department: 'WH',
    severity: 'high',
    target: '> 5%',
    actual: '-29%',
    gap: '-34%',
    rootCauseTh:
      'อัตราการใช้พื้นที่คลังสินค้า (Space Utilization) ในเดือน เม.ย. ต่ำกว่า 60% จากช่วงเปลี่ยนผ่านสัญญาลูกค้าเดิมและสินค้าเข้าใหม่ล่าช้า',
    rootCauseEn:
      'Warehouse space utilization dropped below 60% in April during customer contract turnover and delayed incoming inventory.',
    correctiveActionTh:
      '1. ขยายบริการเสริมคลังสินค้า (Value-added Services เช่น Repacking & Barcoding)\n2. ยุบรวมพื้นที่จัดเก็บ (Space Consolidation) เพื่อลดค่าไฟฟ้าและระบบควบคุมอุณหภูมิ\n3. เร่งปิดการขายลูกค้ารายใหม่สำหรับพื้นที่โซน B',
    correctiveActionEn:
      '1. Expand value-added services (repacking, labeling, cross-docking)\n2. Consolidate active storage bays to reduce energy & cooling overhead\n3. Expedite onboarding for new Zone B client leads',
    picTh: 'คุณวิโรจน์ (ผู้จัดการฝ่ายคลังสินค้า)',
    picEn: 'Wirote (Warehouse Manager)',
    deadline: 'มิ.ย. 2025',
    status: 'in_progress',
  },
  {
    id: 'act-4',
    kpiCode: '1.3',
    kpiNameTh: 'สถิติอุบัติเหตุถึงขั้นหยุดงานฝ่ายคลังสินค้า (WH Zero LTI)',
    kpiNameEn: 'Zero Lost Time Injury Incident (Warehouse)',
    department: 'WH',
    severity: 'medium',
    target: '0 ครั้ง',
    actual: '1 ครั้ง (เม.ย.)',
    gap: '+1 ครั้ง',
    rootCauseTh:
      'เกิดอุบัติเหตุเฉี่ยวชนพาเลทของรถยกโฟล์คลิฟต์ระหว่างขนย้ายสินค้ากะดึก พนักงานมีอาการล้าและจุดอับสายตาบริเวณทางเลี้ยว',
    rootCauseEn:
      'Forklift clipped pallet corner during night-shift handling due to operator fatigue and blind curve blindspot.',
    correctiveActionTh:
      '1. ติดตั้งกระจกโค้งเตือนมุมอับและไฟส่องสว่าง Blue Safety Spot ประจำรถโฟล์คลิฟต์ทุกคัน\n2. บังคับใช้มาตรการพักผ่อนก่อนเข้ากะดึกและทบทวน Safe Operating Procedure (SOP)\n3. จัดประชุม Toolbox Talk เน้นย้ำความปลอดภัยทุกวันจันทร์',
    correctiveActionEn:
      '1. Install convex mirrors and blue spot safety warning lights on all forklifts\n2. Enforce fatigue management and re-train on Warehouse SOPs\n3. Conduct mandatory weekly safety toolbox briefings',
    picTh: 'คุณสุภาพร (จป.วิชาชีพ / QSHE)',
    picEn: 'Supaporn (QSHE Safety Officer)',
    deadline: 'พ.ค. 2025',
    status: 'resolved',
  },
  {
    id: 'act-5',
    kpiCode: '2.1',
    kpiNameTh: 'การรายงานผลความพึงพอใจลูกค้าฝ่ายขนส่งและลานตู้',
    kpiNameEn: 'Transport & Depot CSAT Evaluation Tracking',
    department: 'Corporate',
    severity: 'medium',
    target: '>= 95%',
    actual: 'รอผลการรายงาน',
    gap: 'รอผล',
    rootCauseTh:
      'การรวบรวมแบบประเมินความพึงพอใจลูกค้า (Customer Satisfaction Survey) จากบริษัทคู่ค้าล่าช้ากว่ากำหนดรอบปิดบัญชี',
    rootCauseEn:
      'Collection of customer quarterly satisfaction survey responses is pending submission from client partners.',
    correctiveActionTh:
      '1. มอบหมายทีมลูกค้าสัมพันธ์ (CR) ติดตามผลการประเมินโดยตรงผ่านระบบอิเล็กทรอนิกส์\n2. ปรับเปลี่ยนแบบฟอร์มการประเมินเป็นระบบ Digital CSAT ผ่าน QR Code บนใบส่งมอบงาน',
    correctiveActionEn:
      '1. Assign Customer Relations to follow up directly via digital survey links\n2. Transition delivery notes to include QR-code instant CSAT scoring',
    picTh: 'คุณกิตติศักดิ์ (ทีมลูกค้าสัมพันธ์ CR)',
    picEn: 'Kittisak (Customer Relations Lead)',
    deadline: 'ก.ค. 2025',
    status: 'planned',
  },
];

const STORAGE_KEY = 'krc_kpi_capa_action_plans';

export const ActionPlanView: React.FC<ActionPlanViewProps> = ({
  items,
  breachedKpis,
  onSelectKpi,
  onOpenAlertsModal,
  onOpenGoogleChatModal,
  isAdmin = false,
}) => {
  const { language } = useLanguage();
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<'ALL' | DepartmentCode>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'in_progress' | 'planned' | 'resolved'>('all');

  // Load plans from localStorage or fallback
  const [actionPlans, setActionPlans] = useState<ActionPlanRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_ACTION_PLANS;
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlanRecord | null>(null);

  // Save changes to localStorage
  const saveActionPlans = (plans: ActionPlanRecord[]) => {
    setActionPlans(plans);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch (e) {
      console.error('Failed to save action plans', e);
    }
  };

  const handleSavePlan = (record: ActionPlanRecord) => {
    const existingIndex = actionPlans.findIndex((p) => p.id === record.id);
    if (existingIndex >= 0) {
      const updated = [...actionPlans];
      updated[existingIndex] = record;
      saveActionPlans(updated);
    } else {
      saveActionPlans([record, ...actionPlans]);
    }
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      window.confirm(
        language === 'th'
          ? 'คุณต้องการลบรายการมาตรการนี้ใช่หรือไม่?'
          : 'Are you sure you want to delete this action item?'
      )
    ) {
      const updated = actionPlans.filter((p) => p.id !== id);
      saveActionPlans(updated);
    }
  };

  const filteredPlans = actionPlans.filter((plan) => {
    if (selectedDeptFilter !== 'ALL' && plan.department !== selectedDeptFilter) return false;
    if (selectedStatusFilter !== 'all' && plan.status !== selectedStatusFilter) return false;
    return true;
  });

  const toggleStatus = (id: string) => {
    const updated = actionPlans.map((item) => {
      if (item.id === id) {
        const nextStatus =
          item.status === 'in_progress'
            ? 'resolved'
            : item.status === 'resolved'
            ? 'planned'
            : 'in_progress';
        return { ...item, status: nextStatus };
      }
      return item;
    });
    saveActionPlans(updated);
  };

  const handleOpenKpi = (kpiCode: string) => {
    const found = items.find(
      (k) => k.codeNumber === kpiCode || k.codeNumber.endsWith(`.${kpiCode}`)
    );
    if (found) {
      onSelectKpi(found);
    }
  };

  const inProgressCount = actionPlans.filter((p) => p.status === 'in_progress').length;
  const resolvedCount = actionPlans.filter((p) => p.status === 'resolved').length;
  const plannedCount = actionPlans.filter((p) => p.status === 'planned').length;

  // Distinct departments with high-risk issues
  const highRiskDepts = Array.from(
    new Set(actionPlans.filter((p) => p.severity === 'high').map((p) => p.department))
  );

  return (
    <div className="space-y-6 font-['Prompt',sans-serif]">
      {/* Header Banner */}
      <div className="rounded-2xl border border-red-200/90 bg-linear-to-r from-red-50 via-rose-50/70 to-amber-50/50 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-0.5 text-xs font-bold text-white shadow-2xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                {language === 'th' ? 'ประเด็นวิกฤต & แผนยุทธศาสตร์' : 'Critical Issues & Strategic Plan'}
              </span>
              <span className="rounded-md bg-red-100/80 px-2 py-0.5 text-[11px] font-bold text-red-800">
                {language === 'th'
                  ? `ตรวจพบตัวชี้วัดตกเกณฑ์ ${breachedKpis.length} รายการ`
                  : `${breachedKpis.length} Breached KPIs Detected`}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {language === 'th'
                ? 'แผนปฏิบัติการแก้ไขและฟื้นฟูผลการดำเนินงาน (Corrective Action Plan - CAPA)'
                : 'Performance Recovery & Corrective Action Matrix (CAPA)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {language === 'th'
                ? 'วิเคราะห์สาเหตุเชิงลึก (Root Cause Analysis) กำหนดมาตรการแก้ไขเร่งด่วน พร้อมมอบหมายผู้รับผิดชอบ (PIC) และกำหนดเส้นตายเพื่อดึงผลงานกลับเข้าสู่เกณฑ์มาตรฐาน'
                : 'In-depth root cause analysis, urgent recovery countermeasures, assigned Person-in-Charge (PIC), and deadlines to restore performance to target.'}
            </p>
          </div>

          {/* Action Triggers */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* NEW: Button to Add RCA/CAPA for each department */}
            <button
              id="btn-add-rca-capa"
              onClick={() => {
                setEditingPlan(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{language === 'th' ? '+ บันทึก RCA / CAPA ใหม่' : '+ Add RCA / CAPA'}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  id="btn-action-plan-email"
                  onClick={onOpenAlertsModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:bg-red-800 transition-colors cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{language === 'th' ? 'ส่งอีเมลเตือนผู้บริหาร' : 'Email Alert to Execs'}</span>
                </button>
                <button
                  id="btn-action-plan-chat"
                  onClick={onOpenGoogleChatModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                  <span>{language === 'th' ? 'แจ้งเตือนผ่าน Google Chat' : 'Notify Google Chat'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-red-200/80 bg-white/90 p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'th' ? 'ประเด็นวิกฤตความเสี่ยงสูง' : 'High-Risk Breaches'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-red-600">{highRiskDepts.length}</span>
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'th'
                  ? `ฝ่าย (${highRiskDepts.slice(0, 3).join(', ')})`
                  : 'Divisions'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-white/90 p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'th' ? 'กำลังดำเนินการแก้ไข' : 'In Progress'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-amber-600">{inProgressCount}</span>
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'th' ? 'มาตรการ' : 'actions'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200/80 bg-white/90 p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'th' ? 'วางแผนงานระยะถัดไป' : 'Planned'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-blue-600">{plannedCount}</span>
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'th' ? 'มาตรการ' : 'actions'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200/80 bg-white/90 p-3.5 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500">
              {language === 'th' ? 'แก้ไขลุล่วงแล้ว' : 'Resolved / Safe'}
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-600">{resolvedCount}</span>
              <span className="text-[11px] font-medium text-slate-500">
                {language === 'th' ? 'มาตรการ' : 'actions'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            {language === 'th' ? 'กรองสถานะ:' : 'Status:'}
          </span>
          {(['all', 'in_progress', 'planned', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedStatusFilter === st
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all'
                ? language === 'th'
                  ? 'ทั้งหมด'
                  : 'All'
                : st === 'in_progress'
                ? language === 'th'
                  ? 'กำลังดำเนินการ'
                  : 'In Progress'
                : st === 'planned'
                ? language === 'th'
                  ? 'วางแผนงาน'
                  : 'Planned'
                : language === 'th'
                ? 'เสร็จสิ้นแล้ว'
                : 'Resolved'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">
            {language === 'th'
              ? `แสดง ${filteredPlans.length} จากทั้งหมด ${actionPlans.length} แผนยุทธศาสตร์`
              : `Showing ${filteredPlans.length} of ${actionPlans.length} action items`}
          </div>
          <button
            onClick={() => {
              setEditingPlan(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{language === 'th' ? 'เพิ่มมาตรการ' : 'Add Item'}</span>
          </button>
        </div>
      </div>

      {/* Action Plan Cards */}
      <div className="space-y-4">
        {filteredPlans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all"
          >
            {/* Top row: Code, Department, Severity, Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                  {plan.department} #{plan.kpiCode}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'th' ? plan.kpiNameTh : plan.kpiNameEn}
                </h3>
                {plan.severity === 'high' ? (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-700 uppercase">
                    High Risk
                  </span>
                ) : plan.severity === 'medium' ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 uppercase">
                    Watchlist
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 uppercase">
                    Low Risk
                  </span>
                )}
              </div>

              {/* Status Toggle Badge and Edit/Delete */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Edit Button */}
                <button
                  onClick={() => {
                    setEditingPlan(plan);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
                  title={language === 'th' ? 'แก้ไข RCA / CAPA' : 'Edit RCA / CAPA'}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{language === 'th' ? 'แก้ไข' : 'Edit'}</span>
                </button>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeletePlan(plan.id, e)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  title={language === 'th' ? 'ลบรายการนี้' : 'Delete'}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <button
                  onClick={() => toggleStatus(plan.id)}
                  title={language === 'th' ? 'คลิกเพื่อเปลี่ยนสถานะ' : 'Click to change status'}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                    plan.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
                      : plan.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200'
                  }`}
                >
                  {plan.status === 'in_progress' ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : plan.status === 'resolved' ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {plan.status === 'in_progress'
                      ? language === 'th'
                        ? 'กำลังดำเนินการ (In Progress)'
                        : 'In Progress'
                      : plan.status === 'resolved'
                      ? language === 'th'
                        ? 'บรรลุผลแล้ว (Resolved)'
                        : 'Resolved'
                      : language === 'th'
                      ? 'อยู่ในแผนงาน (Planned)'
                      : 'Planned'}
                  </span>
                </button>
              </div>
            </div>

            {/* Target vs Actual Grid */}
            <div className="grid grid-cols-3 gap-3 my-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {language === 'th' ? 'เป้าหมายที่กำหนด' : 'Target'}
                </div>
                <div className="text-sm font-bold text-slate-800 mt-0.5">{plan.target}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {language === 'th' ? 'ผลงานจริงปัจจุบัน' : 'Current Actual'}
                </div>
                <div className="text-sm font-black text-red-600 mt-0.5">{plan.actual}</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-500">
                  {language === 'th' ? 'ผลต่างเทียบเป้าหมาย (Gap)' : 'Variance / Gap'}
                </div>
                <div className="text-sm font-black text-red-700 mt-0.5">{plan.gap}</div>
              </div>
            </div>

            {/* Root Cause & Corrective Action Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Root Cause Box */}
              <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5">
                <div className="flex items-center gap-1.5 font-bold text-red-900 mb-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{language === 'th' ? 'การวิเคราะห์สาเหตุเชิงลึก (Root Cause):' : 'Root Cause Analysis:'}</span>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {language === 'th' ? plan.rootCauseTh : plan.rootCauseEn}
                </p>
              </div>

              {/* Corrective Action Box */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                <div className="flex items-center gap-1.5 font-bold text-blue-900 mb-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                  <span>
                    {language === 'th'
                      ? 'มาตรการแก้ไขและฟื้นฟูผลงาน (Corrective Countermeasures):'
                      : 'Corrective Action Plan:'}
                  </span>
                </div>
                <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {language === 'th' ? plan.correctiveActionTh : plan.correctiveActionEn}
                </div>
              </div>
            </div>

            {/* Attached Files Section if present */}
            {plan.attachments && plan.attachments.length > 0 && (
              <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200/70 p-2.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-2">
                  <Paperclip className="h-3.5 w-3.5 text-blue-600" />
                  <span>
                    {language === 'th' ? 'เอกสารและหลักฐานแนบ:' : 'Attached Evidence / Files:'}
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    ({plan.attachments.length} ไฟล์)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plan.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.dataUrl}
                      download={att.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/50 shadow-2xs transition-all"
                      title={language === 'th' ? 'คลิกเพื่อดาวน์โหลด' : 'Click to download'}
                    >
                      <FileText className="h-3 w-3 text-blue-500" />
                      <span className="max-w-[180px] truncate">{att.name}</span>
                      <Download className="h-3 w-3 text-slate-400" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Footer: PIC, Deadline, and Drilldown Button */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">
                    {language === 'th' ? 'ผู้รับผิดชอบ (PIC):' : 'PIC:'}
                  </span>
                  <span>{language === 'th' ? plan.picTh : plan.picEn}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">
                    {language === 'th' ? 'เส้นตาย (Deadline):' : 'Target Due:'}
                  </span>
                  <span className="font-medium text-slate-700">{plan.deadline}</span>
                </div>
              </div>

              <button
                onClick={() => handleOpenKpi(plan.kpiCode)}
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold transition-colors cursor-pointer self-end sm:self-auto"
              >
                <span>{language === 'th' ? 'เปิดดูตัวชี้วัดฉบับเต็ม' : 'View Full KPI Detail'}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* RcaCapaModal for Inserting / Editing Actions */}
      <RcaCapaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        initialData={editingPlan}
        items={items}
      />
    </div>
  );
};

