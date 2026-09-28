import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Building2,
  TrendingUp,
  Target,
  User,
  Info,
  Save,
  HelpCircle,
  Paperclip,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AttachmentFile, ComparisonOperator, DepartmentCode, KPIItem, MONTHS, MonthKey } from '../types';
import { FileUploadZone } from './FileUploadZone';

export interface KpiReportSubmission {
  kpiId: string;
  kpiCode: string;
  kpiName: string;
  department: DepartmentCode;
  month: MonthKey;
  reportedValue: string;
  notes?: string;
  reporterName?: string;
  attachments?: AttachmentFile[];
  updatedAt: string;
}

interface KpiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: KPIItem[];
  preSelectedKpi?: KPIItem | null;
  onSaveReport: (submission: KpiReportSubmission) => void;
}

const DEPARTMENTS: DepartmentCode[] = [
  'Corporate',
  'OPS',
  'CR',
  'WH',
  'Transport',
  'EN',
  'PU',
  'HR&GA',
  'QSHE',
  'IT',
  'ACC&FN',
];

export const KpiReportModal: React.FC<KpiReportModalProps> = ({
  isOpen,
  onClose,
  items,
  preSelectedKpi,
  onSaveReport,
}) => {
  const { language, t, getKpiName, getMonthName, getDeptName } = useLanguage();

  const [selectedDept, setSelectedDept] = useState<DepartmentCode>('Corporate');
  const [selectedKpiId, setSelectedKpiId] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<MonthKey>('SEP');
  const [reportedValue, setReportedValue] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  // When modal opens or preSelectedKpi changes, initialize fields
  useEffect(() => {
    if (isOpen) {
      if (preSelectedKpi) {
        setSelectedDept(preSelectedKpi.department);
        setSelectedKpiId(preSelectedKpi.id);
        // Default month: pick current month or the latest with no data
        const currentMonthIdx = 5; // SEP in FY cycle (APR=0, MAY=1, JUN=2, JUL=3, AUG=4, SEP=5)
        const currentM = MONTHS[currentMonthIdx] || 'SEP';
        setSelectedMonth(currentM);
        const existingVal = preSelectedKpi.monthlyValues[currentM]?.raw || '';
        setReportedValue(existingVal && existingVal !== 'รอผลการประเมิน' ? existingVal : '');
        setReporterName(preSelectedKpi.pic || '');
      } else {
        const first = items[0];
        if (first) {
          setSelectedDept(first.department);
          setSelectedKpiId(first.id);
        }
        setSelectedMonth('SEP');
        setReportedValue('');
        setReporterName('');
      }
      setNotes('');
      setAttachments([]);
    }
  }, [isOpen, preSelectedKpi, items]);

  // KPIs filtered by selected department
  const departmentKpis = useMemo(() => {
    return items.filter((item) => item.department === selectedDept);
  }, [items, selectedDept]);

  // Current active KPI being reported
  const activeKpi = useMemo(() => {
    return items.find((k) => k.id === selectedKpiId) || departmentKpis[0] || null;
  }, [items, selectedKpiId, departmentKpis]);

  // When department changes, set first KPI of that department if active KPI is not in it
  const handleDeptChange = (dept: DepartmentCode) => {
    setSelectedDept(dept);
    const inDept = items.filter((k) => k.department === dept);
    if (inDept.length > 0) {
      setSelectedKpiId(inDept[0].id);
      const mVal = inDept[0].monthlyValues[selectedMonth]?.raw || '';
      setReportedValue(mVal && mVal !== 'รอผลการประเมิน' ? mVal : '');
      if (inDept[0].pic) setReporterName(inDept[0].pic);
    }
  };

  // When KPI selection changes
  const handleKpiChange = (kpiId: string) => {
    setSelectedKpiId(kpiId);
    const kpi = items.find((k) => k.id === kpiId);
    if (kpi) {
      const mVal = kpi.monthlyValues[selectedMonth]?.raw || '';
      setReportedValue(mVal && mVal !== 'รอผลการประเมิน' ? mVal : '');
      if (kpi.pic) setReporterName(kpi.pic);
    }
  };

  // When month selection changes
  const handleMonthChange = (month: MonthKey) => {
    setSelectedMonth(month);
    if (activeKpi) {
      const mVal = activeKpi.monthlyValues[month]?.raw || '';
      setReportedValue(mVal && mVal !== 'รอผลการประเมิน' ? mVal : '');
    }
  };

  // Evaluation calculation preview
  const evaluationPreview = useMemo(() => {
    if (!activeKpi || !reportedValue.trim()) return null;

    const trimmed = reportedValue.trim();
    if (trimmed === 'รอผลการประเมิน' || trimmed === 'N/A') {
      return { status: 'pending', text: 'รอผลการประเมิน (Pending)' };
    }

    const cleanNumber = trimmed.replace(/,/g, '').replace(/%/g, '').trim();
    const num = parseFloat(cleanNumber);
    if (isNaN(num)) {
      return { status: 'text', text: trimmed };
    }

    const targetVal = activeKpi.targetValue;
    const op = activeKpi.operator;
    let isFailing = false;

    if (op === 'GTE') {
      isFailing = num < targetVal;
    } else if (op === 'LTE') {
      isFailing = num > targetVal;
    } else {
      isFailing = num !== targetVal;
    }

    return {
      status: isFailing ? 'failed' : 'passed',
      text: isFailing
        ? `ต่ำกว่าเป้าหมาย (เกณฑ์: ${op === 'GTE' ? '≥' : op === 'LTE' ? '≤' : '='} ${activeKpi.targetRaw})`
        : `บรรลุเป้าหมาย (เกณฑ์: ${op === 'GTE' ? '≥' : op === 'LTE' ? '≤' : '='} ${activeKpi.targetRaw})`,
    };
  }, [activeKpi, reportedValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeKpi || !reportedValue.trim()) return;

    onSaveReport({
      kpiId: activeKpi.id,
      kpiCode: `${activeKpi.department} #${activeKpi.codeNumber}`,
      kpiName: getKpiName(activeKpi),
      department: activeKpi.department,
      month: selectedMonth,
      reportedValue: reportedValue.trim(),
      notes: notes.trim() || undefined,
      reporterName: reporterName.trim() || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {language === 'th' ? 'แบบฟอร์มรายงานผลตัวชี้วัด (KPIs Submission)' : 'KPI Result Submission Form'}
              </h3>
              <p className="text-xs text-slate-300">
                {language === 'th'
                  ? 'กรอกผลการดำเนินงานจริงประจำเดือน เพื่ออัพเดตสถานะและคำนวณอัตราความสำเร็จทันที'
                  : 'Submit monthly actual performance data to update achievement rates instantly'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Row 1: Department & Month Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                {language === 'th' ? 'สายงาน / ฝ่าย' : 'Department'}
              </label>
              <select
                value={selectedDept}
                onChange={(e) => handleDeptChange(e.target.value as DepartmentCode)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-colors"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} - {getDeptName(dept)} ({items.filter((k) => k.department === dept).length} ตัวชี้วัด)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                {language === 'th' ? 'รอบเดือนที่รายงาน (รอบปี FY2026)' : 'Reporting Month'}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value as MonthKey)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-colors"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {getMonthName(m)} {m === 'SEP' ? '(ปัจจุบัน / Current)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Select KPI from Department */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-blue-600" />
                {language === 'th' ? 'เลือกตัวชี้วัด (KPI)' : 'Select KPI'}
              </span>
              <span className="text-[11px] font-normal text-slate-500">
                {departmentKpis.length} {language === 'th' ? 'รายการในฝ่ายนี้' : 'items'}
              </span>
            </label>
            <select
              value={selectedKpiId}
              onChange={(e) => handleKpiChange(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-colors"
            >
              {departmentKpis.map((kpi) => (
                <option key={kpi.id} value={kpi.id}>
                  [{kpi.codeNumber}] {getKpiName(kpi)} (เป้าหมาย: {kpi.targetRaw})
                </option>
              ))}
            </select>
          </div>

          {/* Active KPI Target Info Callout */}
          {activeKpi && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 text-xs text-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">
                    {activeKpi.codeNumber}
                  </span>
                  <span className="font-bold text-slate-900">{getKpiName(activeKpi)}</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  {language === 'th' ? 'เกณฑ์เป้าหมาย:' : 'Target:'} <strong>{activeKpi.targetRaw}</strong> •{' '}
                  {language === 'th' ? 'หน่วยนับ:' : 'Unit:'} <strong>{activeKpi.unit || '-'}</strong> •{' '}
                  {language === 'th' ? 'ผู้รับผิดชอบ:' : 'PIC:'} <strong>{activeKpi.pic || activeKpi.department}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 block">
                  {language === 'th' ? 'ค่าปัจจุบันเดือน' : 'Current'} {selectedMonth}:
                </span>
                <span className="font-mono font-semibold text-slate-700">
                  {activeKpi.monthlyValues[selectedMonth]?.raw || (
                    <span className="text-slate-400 font-normal italic">
                      {language === 'th' ? 'ยังไม่ได้รายงาน' : 'No data'}
                    </span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Row 3: Reported Value & Reporter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  {language === 'th' ? 'ผลงานจริงที่รายงาน (Actual Value)' : 'Actual Reported Value'} *
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder={
                    activeKpi?.unit === '%'
                      ? 'เช่น 98% หรือ 85'
                      : activeKpi?.unit === 'Case'
                      ? 'เช่น 0 Case หรือ 1'
                      : 'กรอกผลงานจริง...'
                  }
                  value={reportedValue}
                  onChange={(e) => setReportedValue(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-colors shadow-2xs"
                />
                {activeKpi?.unit && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                    {activeKpi.unit}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {language === 'th'
                  ? 'รองรับตัวเลข, ทศนิยม, เปอร์เซ็นต์ เช่น 95% หรือ 0 Case'
                  : 'Supports numbers, percentages, or status strings'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-blue-600" />
                {language === 'th' ? 'ชื่อผู้รายงาน / ผู้รับผิดชอบ' : 'Reporter / PIC'}
              </label>
              <input
                type="text"
                placeholder="เช่น สิทธิชัย (ผู้จัดการฝ่าย), วาสนา..."
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Real-time Status Calculation Preview */}
          {evaluationPreview && (
            <div
              className={`rounded-xl border p-3 text-xs flex items-center gap-2.5 transition-all ${
                evaluationPreview.status === 'passed'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : evaluationPreview.status === 'failed'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              {evaluationPreview.status === 'passed' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : evaluationPreview.status === 'failed' ? (
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              ) : (
                <Info className="h-4 w-4 text-slate-500 shrink-0" />
              )}
              <div className="flex-1">
                <div className="font-bold">
                  {language === 'th' ? 'ผลการตรวจสอบเกณฑ์อัตโนมัติ:' : 'Auto Evaluation:'}{' '}
                  {evaluationPreview.status === 'passed'
                    ? 'ผ่านเกณฑ์ (Passed)'
                    : evaluationPreview.status === 'failed'
                    ? 'ไม่ผ่านเกณฑ์ (Breached Target)'
                    : 'รอประเมิน (Pending)'}
                </div>
                <div className="text-[11px] opacity-90">{evaluationPreview.text}</div>
              </div>
            </div>
          )}

          {/* Notes / Remark */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-500" />
              {language === 'th' ? 'หมายเหตุประกอบผลการรายงาน (ถ้ามี)' : 'Notes / Remarks (Optional)'}
            </label>
            <textarea
              rows={2}
              placeholder="ระบุคำชี้แจงเพิ่มเติม หรือปัจจัยที่มีผลต่อตัวเลข..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-hidden transition-colors resize-none shadow-2xs"
            />
          </div>

          {/* Section: File Attachments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-blue-600" />
              <span>{language === 'th' ? 'แนบไฟล์เอกสาร / หลักฐานประกอบ (ถ้ามี)' : 'Supporting Documents / Evidence (Optional)'}</span>
            </label>
            <FileUploadZone
              attachments={attachments}
              onChange={setAttachments}
              maxFiles={5}
              maxSizeMb={10}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
              {language === 'th'
                ? 'ข้อมูลจะถูกบันทึกและคำนวณบน Dashboard ทันที'
                : 'Data updates local state & calculates KPIs instantly'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 active:bg-emerald-800 transition-colors shadow-xs cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{language === 'th' ? 'บันทึกผลรายงานทันที' : 'Save Report Now'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
