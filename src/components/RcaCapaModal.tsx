import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HelpCircle,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  User,
  X,
  Paperclip,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { AttachmentFile, DepartmentCode, KPIItem } from '../types';
import { FileUploadZone } from './FileUploadZone';

export interface ActionPlanRecord {
  id: string;
  kpiCode: string;
  kpiNameTh: string;
  kpiNameEn: string;
  department: DepartmentCode;
  severity: 'high' | 'medium' | 'low';
  target: string;
  actual: string;
  gap: string;
  rootCauseTh: string;
  rootCauseEn: string;
  correctiveActionTh: string;
  correctiveActionEn: string;
  picTh: string;
  picEn: string;
  deadline: string;
  status: 'in_progress' | 'planned' | 'resolved';
  attachments?: AttachmentFile[];
  updatedAt?: string;
  updatedBy?: string;
}

interface RcaCapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ActionPlanRecord) => void;
  initialData?: ActionPlanRecord | null;
  items?: KPIItem[];
  preSelectedKpi?: KPIItem | null;
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

export const RcaCapaModal: React.FC<RcaCapaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  items = [],
  preSelectedKpi,
}) => {
  const { language, getDeptName } = useLanguage();

  const [selectedDept, setSelectedDept] = useState<DepartmentCode>(
    initialData?.department || preSelectedKpi?.department || 'OPS'
  );
  const [selectedKpiCode, setSelectedKpiCode] = useState<string>(
    initialData?.kpiCode || preSelectedKpi?.codeNumber || ''
  );
  const [kpiNameTh, setKpiNameTh] = useState<string>(
    initialData?.kpiNameTh || preSelectedKpi?.nameTh || ''
  );
  const [kpiNameEn, setKpiNameEn] = useState<string>(
    initialData?.kpiNameEn || preSelectedKpi?.nameEn || ''
  );
  const [target, setTarget] = useState<string>(
    initialData?.target || preSelectedKpi?.targetValue || ''
  );
  const [actual, setActual] = useState<string>(
    initialData?.actual ||
      (preSelectedKpi?.averageValue !== undefined ? `${preSelectedKpi.averageValue}%` : '')
  );
  const [gap, setGap] = useState<string>(initialData?.gap || '');
  const [severity, setSeverity] = useState<'high' | 'medium' | 'low'>(
    initialData?.severity || 'high'
  );
  const [status, setStatus] = useState<'in_progress' | 'planned' | 'resolved'>(
    initialData?.status || 'in_progress'
  );

  // 5-Whys / Root cause
  const [rootCauseTh, setRootCauseTh] = useState<string>(initialData?.rootCauseTh || '');
  const [correctiveActionTh, setCorrectiveActionTh] = useState<string>(
    initialData?.correctiveActionTh || ''
  );
  const [picTh, setPicTh] = useState<string>(initialData?.picTh || '');
  const [deadline, setDeadline] = useState<string>(initialData?.deadline || '');
  const [attachments, setAttachments] = useState<AttachmentFile[]>(initialData?.attachments || []);

  // Reset or fill form when modal opens or target changes
  useEffect(() => {
    if (initialData) {
      setSelectedDept(initialData.department);
      setSelectedKpiCode(initialData.kpiCode);
      setKpiNameTh(initialData.kpiNameTh);
      setKpiNameEn(initialData.kpiNameEn);
      setTarget(initialData.target);
      setActual(initialData.actual);
      setGap(initialData.gap);
      setSeverity(initialData.severity);
      setStatus(initialData.status);
      setRootCauseTh(initialData.rootCauseTh);
      setCorrectiveActionTh(initialData.correctiveActionTh);
      setPicTh(initialData.picTh);
      setDeadline(initialData.deadline);
      setAttachments(initialData.attachments || []);
    } else if (preSelectedKpi) {
      setSelectedDept(preSelectedKpi.department);
      setSelectedKpiCode(preSelectedKpi.codeNumber);
      setKpiNameTh(preSelectedKpi.nameTh);
      setKpiNameEn(preSelectedKpi.nameEn);
      setTarget(preSelectedKpi.targetValue);
      setActual(
        preSelectedKpi.averageValue !== undefined ? `${preSelectedKpi.averageValue}%` : '-'
      );
      setGap('ตกเกณฑ์เป้าหมาย');
      setSeverity('high');
      setStatus('in_progress');
      setRootCauseTh('');
      setCorrectiveActionTh('');
      setPicTh(`ผู้จัดการฝ่าย ${preSelectedKpi.department}`);
      setDeadline('');
      setAttachments([]);
    } else {
      setAttachments([]);
    }
  }, [initialData, preSelectedKpi, isOpen]);

  if (!isOpen) return null;

  // Filter KPI options by selected department
  const availableKpis = items.filter((k) => k.department === selectedDept);

  const handleSelectKpiOption = (code: string) => {
    setSelectedKpiCode(code);
    const found = items.find((k) => k.department === selectedDept && k.codeNumber === code);
    if (found) {
      setKpiNameTh(found.nameTh);
      setKpiNameEn(found.nameEn);
      setTarget(found.targetValue);
      if (found.averageValue !== undefined) {
        setActual(`${found.averageValue}%`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kpiNameTh || !rootCauseTh || !correctiveActionTh) {
      alert(
        language === 'th'
          ? 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน (ชื่อตัวชี้วัด, สาเหตุ RCA, และมาตรการแก้ไข CAPA)'
          : 'Please fill in required fields (KPI Name, RCA Root Cause, and CAPA Action)'
      );
      return;
    }

    const record: ActionPlanRecord = {
      id: initialData?.id || `capa-${Date.now()}`,
      kpiCode: selectedKpiCode || 'Custom',
      kpiNameTh,
      kpiNameEn: kpiNameEn || kpiNameTh,
      department: selectedDept,
      severity,
      target: target || '-',
      actual: actual || '-',
      gap: gap || '-',
      rootCauseTh,
      rootCauseEn: rootCauseTh,
      correctiveActionTh,
      correctiveActionEn: correctiveActionTh,
      picTh: picTh || `ฝ่าย ${selectedDept}`,
      picEn: picTh || selectedDept,
      deadline: deadline || 'ภายในไตรมาส',
      status,
      attachments: attachments.length > 0 ? attachments : undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: 'ผู้รับผิดชอบสายงาน',
    };

    onSave(record);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto font-['Prompt',sans-serif]">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl transition-all my-8 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="border-b border-slate-100 pb-4 pr-8">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <span className="rounded-md bg-red-50 text-red-700 px-2.5 py-0.5 text-xs font-bold border border-red-200">
              ISO / QSHE Form
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
            {initialData
              ? language === 'th'
                ? 'แก้ไขบันทึก RCA / CAPA (Corrective Action)'
                : 'Edit RCA / CAPA Action Plan'
              : language === 'th'
              ? 'บันทึกวิเคราะห์สาเหตุ (RCA) และแผนแก้ไขฟื้นฟูผลงาน (CAPA)'
              : 'Add Root Cause Analysis (RCA) & CAPA Action Plan'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'th'
              ? 'สำหรับให้แต่ละส่วนงานระบุสาเหตุที่แท้จริง (Root Cause), แนวทางแก้ไขป้องกัน และผู้รับผิดชอบตามเกณฑ์ ISO'
              : 'Empower department teams to document root cause analysis, action plans, and assignees.'}
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Section 1: Department & KPI Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
            {/* Department */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'th' ? 'สายงาน / ฝ่ายรับผิดชอบ *' : 'Department *'}
              </label>
              <select
                value={selectedDept}
                onChange={(e) => {
                  const dept = e.target.value as DepartmentCode;
                  setSelectedDept(dept);
                  setSelectedKpiCode('');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept} - {getDeptName(dept)}
                  </option>
                ))}
              </select>
            </div>

            {/* Select from existing KPIs */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'th' ? 'เลือกตัวชี้วัด KPI ของฝ่าย' : 'Select KPI (Optional)'}
              </label>
              <select
                value={selectedKpiCode}
                onChange={(e) => handleSelectKpiOption(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
              >
                <option value="">-- {language === 'th' ? 'พิมพ์ระบุเอง หรือเลือกจากรายการ' : 'Select or type custom'} --</option>
                {availableKpis.map((k) => (
                  <option key={k.id} value={k.codeNumber}>
                    #{k.codeNumber} {k.nameTh.substring(0, 60)}...
                  </option>
                ))}
              </select>
            </div>

            {/* KPI Full Name */}
            <div className="sm:col-span-3">
              <label className="block font-bold text-slate-700 mb-1">
                {language === 'th' ? 'ชื่อตัวชี้วัด (KPI Title) *' : 'KPI Name *'}
              </label>
              <input
                type="text"
                required
                value={kpiNameTh}
                onChange={(e) => setKpiNameTh(e.target.value)}
                placeholder={language === 'th' ? 'เช่น กำไรขั้นต้นงานบริการลานตู้, อัตราอุบัติเหตุ 0 ครั้ง' : 'e.g. Depot Gross Profit'}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-500 focus:outline-none shadow-2xs"
              />
            </div>
          </div>

          {/* Section 2: Target, Actual, Gap & Risk Level */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-150">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                {language === 'th' ? 'เป้าหมาย (Target)' : 'Target'}
              </label>
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="> 5% หรือ 0 ครั้ง"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                {language === 'th' ? 'ผลงานจริง (Actual)' : 'Actual Value'}
              </label>
              <input
                type="text"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                placeholder="-138% หรือ 1 ครั้ง"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-red-600 font-bold focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                {language === 'th' ? 'ผลต่าง (Gap / Variance)' : 'Gap'}
              </label>
              <input
                type="text"
                value={gap}
                onChange={(e) => setGap(e.target.value)}
                placeholder="-143% ต่ำกว่าเป้า"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                {language === 'th' ? 'ระดับความเสี่ยง' : 'Risk Severity'}
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none"
              >
                <option value="high">🔴 วิกฤตสูง (High)</option>
                <option value="medium">🟡 ปานกลาง (Medium)</option>
                <option value="low">🟢 ต่ำ (Low)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Root Cause Analysis (RCA) */}
          <div className="rounded-xl border border-red-200 bg-red-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-red-900 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-red-600" />
                <span>{language === 'th' ? '1. การวิเคราะห์สาเหตุเชิงลึก (Root Cause Analysis - RCA) *' : '1. Root Cause Analysis (RCA) *'}</span>
              </label>
              <span className="text-[11px] text-red-700/80">ใช้หลัก 5-Whys หรือ Fishbone</span>
            </div>
            <textarea
              required
              rows={3}
              value={rootCauseTh}
              onChange={(e) => setRootCauseTh(e.target.value)}
              placeholder={
                language === 'th'
                  ? 'อธิบายสาเหตุที่แท้จริงที่ทำให้ผลงานไม่เป็นไปตามเป้าหมาย เช่น เครื่องจักรขัดข้อง, ปริมาณตู้ผ่านลานลดลง, พนักงานกะดึกเหนื่อยล้า ฯลฯ'
                  : 'Identify direct and underlying causes (e.g. equipment downtime, backhaul imbalance, shortage)...'
              }
              className="w-full rounded-lg border border-red-200 bg-white p-3 text-xs text-slate-800 focus:border-red-500 focus:outline-none leading-relaxed shadow-2xs"
            />
          </div>

          {/* Section 4: Corrective & Preventive Action (CAPA) */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-extrabold text-blue-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>{language === 'th' ? '2. มาตรการแก้ไขและป้องกัน (Corrective Action - CAPA) *' : '2. Corrective Action Plan (CAPA) *'}</span>
              </label>
              <span className="text-[11px] text-blue-700/80">ระบุเป็นข้อปฏิบัติชัดเจน</span>
            </div>
            <textarea
              required
              rows={4}
              value={correctiveActionTh}
              onChange={(e) => setCorrectiveActionTh(e.target.value)}
              placeholder={
                language === 'th'
                  ? '1. ปรับปรุงกระบวนการหรือมาตรการเร่งด่วน\n2. กำหนดการอบรมหรือทบทวน SOP\n3. ติดตั้งอุปกรณ์ความปลอดภัยหรือปรับโครงสร้างราคา'
                  : '1. Immediate countermeasure...\n2. Preventive procedural update...'
              }
              className="w-full rounded-lg border border-blue-200 bg-white p-3 text-xs text-slate-800 focus:border-blue-500 focus:outline-none leading-relaxed shadow-2xs font-mono"
            />
          </div>

          {/* Section 5: PIC, Target Deadline & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span>{language === 'th' ? 'ผู้รับผิดชอบ (PIC) *' : 'Person-in-Charge (PIC) *'}</span>
              </label>
              <input
                type="text"
                required
                value={picTh}
                onChange={(e) => setPicTh(e.target.value)}
                placeholder="เช่น คุณสมคิด (ผจก.ฝ่ายลานตู้)"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>{language === 'th' ? 'กำหนดเสร็จ (Target Deadline) *' : 'Target Due Date *'}</span>
              </label>
              <input
                type="text"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="เช่น มิ.ย. 2025 หรือ 15/07/2025"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                <span>{language === 'th' ? 'สถานะมาตรการ' : 'Action Status'}</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'in_progress' | 'planned' | 'resolved')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none shadow-2xs"
              >
                <option value="in_progress">🟡 กำลังดำเนินการ (In Progress)</option>
                <option value="planned">🔵 วางแผนงาน (Planned)</option>
                <option value="resolved">🟢 แก้ไขลุล่วงแล้ว (Resolved)</option>
              </select>
            </div>
          </div>

          {/* Section 6: File Attachments (RCA Evidence / Investigation Report) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Paperclip className="h-4 w-4 text-blue-600" />
                <span>{language === 'th' ? 'เอกสารหลักฐานประกอบ RCA / แผนงาน CAPA (ถ้ามี)' : 'Evidence & Action Attachments (Optional)'}</span>
              </label>
              <span className="text-[11px] text-slate-500">รายงานการสอบสวน, รูปถ่าย, ตาราง Excel</span>
            </div>
            <FileUploadZone
              attachments={attachments}
              onChange={setAttachments}
              maxFiles={5}
              maxSizeMb={10}
            />
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{language === 'th' ? 'บันทึกข้อมูล RCA / CAPA' : 'Save Action Plan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
