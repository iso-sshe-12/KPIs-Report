import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  RefreshCw,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import { DEFAULT_RAW_CSV } from '../data/rawKpiCsv';
import { saveSyncSettings } from '../services/googleSheetsService';
import { SyncSettings } from '../types';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncSettings: SyncSettings;
  onUpdateSyncSettings: (settings: SyncSettings) => void;
  onTriggerSync: (customUrl?: string) => Promise<boolean>;
  onDirectCsvUpdate: (csvText: string) => void;
  isSyncing: boolean;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  syncSettings,
  onUpdateSyncSettings,
  onTriggerSync,
  onDirectCsvUpdate,
  isSyncing,
}) => {
  const [sheetUrl, setSheetUrl] = useState(syncSettings.sheetUrl);
  const [intervalMinutes, setIntervalMinutes] = useState(syncSettings.intervalMinutes);
  const [autoSync, setAutoSync] = useState(syncSettings.autoSyncEnabled);
  const [activeTab, setActiveTab] = useState<'sheet' | 'csv_paste' | 'guide'>('sheet');
  const [rawCsvInput, setRawCsvInput] = useState('');
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!isOpen) return null;

  const handleSaveAndSync = async () => {
    setSyncFeedback(null);
    const updated: SyncSettings = {
      ...syncSettings,
      sheetUrl: sheetUrl.trim(),
      intervalMinutes,
      autoSyncEnabled: autoSync,
    };
    onUpdateSyncSettings(updated);
    saveSyncSettings(updated);

    if (sheetUrl.trim()) {
      const success = await onTriggerSync(sheetUrl.trim());
      if (success) {
        setSyncFeedback({
          type: 'success',
          message: 'เชื่อมต่อและดึงข้อมูลจาก Google Sheets สำเร็จเรียบร้อย!',
        });
      } else {
        setSyncFeedback({
          type: 'error',
          message:
            'ไม่สามารถดึงข้อมูลได้ โปรดตรวจสอบว่าไฟล์ Google Sheets ได้เปิดสิทธิ์ "ทุกคนที่มีลิงก์สามารถดูได้" (Anyone with the link can view)',
        });
      }
    } else {
      setSyncFeedback({
        type: 'success',
        message: 'บันทึกการตั้งค่ารอบเวลาเรียบร้อยแล้ว',
      });
    }
  };

  const handleApplyCsv = () => {
    if (!rawCsvInput.trim()) return;
    onDirectCsvUpdate(rawCsvInput.trim());
    setSyncFeedback({
      type: 'success',
      message: 'อัพเดตข้อมูลจากข้อความ CSV เรียบร้อยแล้ว!',
    });
  };

  const handleResetDefault = () => {
    onDirectCsvUpdate(DEFAULT_RAW_CSV);
    setSheetUrl('');
    setRawCsvInput('');
    setSyncFeedback({
      type: 'success',
      message: 'รีเซ็ตกลับเป็นชุดข้อมูลมาตรฐาน FY2026 สำเร็จ',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="border-b border-slate-200 bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                ตั้งค่าการดึงข้อมูลจาก Google Sheets
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                เชื่อมต่อไฟล์สเปรดชีตจริง & ตั้งเวลาอัพเดตอัตโนมัติรอบทุก 10 นาที
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 flex gap-2 py-2 text-xs">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
              activeTab === 'sheet'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ลิงก์ Google Sheets
          </button>
          <button
            onClick={() => setActiveTab('csv_paste')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
              activeTab === 'csv_paste'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            วาง CSV โดยตรง / อัพโหลด
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            วิธีแชร์ไฟล์ Google Sheets
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {syncFeedback && (
            <div
              className={`rounded-lg border p-3 text-xs font-semibold flex items-center gap-2 ${
                syncFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {syncFeedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <span>{syncFeedback.message}</span>
            </div>
          )}

          {activeTab === 'sheet' && (
            <div className="space-y-4">
              {/* Sheet URL Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Google Sheets URL หรือ ลิงก์ที่แชร์</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    รองรับ URL รูปแบบ docs.google.com/spreadsheets/d/...
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit#gid=0"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-hidden focus:border-slate-500 focus:ring-1 focus:ring-slate-500 shadow-2xs"
                />
                <p className="text-[11px] text-slate-500">
                  ระบบจะแปลงเป็นคำสั่งดึงข้อมูล CSV อัตโนมัติ และใช้เซิร์ฟเวอร์ proxy เพื่อหลีกเลี่ยงข้อจำกัด CORS
                </p>
              </div>

              {/* Refresh Interval Selector */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-700" />
                    <span className="text-xs font-bold text-slate-900">
                      ตั้งเวลาอัพเดตอัตโนมัติ (Auto-Refresh Interval)
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-xs font-medium text-slate-700">เปิดใช้งาน</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[1, 5, 10, 15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setIntervalMinutes(mins)}
                      className={`rounded-lg border py-2 text-xs font-semibold transition-all cursor-pointer ${
                        intervalMinutes === mins
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {mins} นาที
                      {mins === 10 && (
                        <span className="block text-[9px] font-normal opacity-80">
                          (ที่แนะนำ)
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">
                  เมื่อเปิดใช้งาน ระบบจะมีนาฬิกานับถอยหลังบนแถบด้านบน และดึงข้อมูลใหม่ทุกๆ {intervalMinutes} นาที
                </p>
              </div>
            </div>
          )}

          {activeTab === 'csv_paste' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900">
                วางข้อความ Raw CSV จาก Google Sheets หรือไฟล์ของคุณ
              </label>
              <textarea
                rows={10}
                placeholder="วางข้อมูล CSV ที่มีหัวตาราง No, KPI Name, Target Value, APR, MAY..."
                value={rawCsvInput}
                onChange={(e) => setRawCsvInput(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 font-mono text-[11px] text-slate-800 outline-hidden focus:border-slate-500"
              />
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>คืนค่าเริ่มต้น FY2026</span>
                </button>
                <button
                  type="button"
                  onClick={handleApplyCsv}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-slate-800 cursor-pointer"
                >
                  นำเข้าและแสดงผล
                </button>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
                <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-blue-600" />
                  ขั้นตอนการแชร์ Google Sheets เพื่อเชื่อมต่อ:
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-blue-950">
                  <li>
                    เปิดไฟล์ Google Sheets ของคุณที่ต้องการเชื่อมต่อ
                  </li>
                  <li>
                    คลิกปุ่ม <strong>แชร์ (Share)</strong> ที่มุมขวาบน
                  </li>
                  <li>
                    ในส่วน <em>การเข้าถึงทั่วไป (General access)</em> เลือกเป็น <strong>"ทุกคนที่มีลิงก์ (Anyone with the link)"</strong> และตั้งสิทธิ์เป็น <strong>"ผู้มีสิทธิ์อ่าน (Viewer)"</strong>
                  </li>
                  <li>
                    คลิก <strong>คัดลอกลิงก์ (Copy link)</strong> แล้วนำมาวางในช่อง <em>Google Sheets URL</em> ในแท็บแรก
                  </li>
                  <li>
                    หรือเลือกเมนู <strong>ไฟล์ (File) &gt; แชร์ (Share) &gt; เผยแพร่ไปยังเว็บ (Publish to web)</strong> แล้วเลือกเป็นไฟล์ CSV
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>ใช้ข้อมูลตั้งต้น FY2026</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              ปิด
            </button>
            <button
              onClick={handleSaveAndSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : 'บันทึก & ซิงค์ข้อมูล'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
