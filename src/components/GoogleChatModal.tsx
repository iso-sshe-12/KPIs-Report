import React, { useState } from 'react';
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  HelpCircle,
  History,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  formatGoogleChatMessage,
  generateGoogleAppsScriptCode,
  getGoogleChatLogs,
  saveGoogleChatSettings,
  sendGoogleChatMessage,
} from '../services/googleChatService';
import { GoogleChatLog, GoogleChatSettings } from '../types';

interface GoogleChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GoogleChatSettings;
  onUpdateSettings: (settings: GoogleChatSettings) => void;
}

export const GoogleChatModal: React.FC<GoogleChatModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'guide' | 'script' | 'logs'>('settings');
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || '');
  const [reminderDay, setReminderDay] = useState(settings.reminderDayOfMonth || 10);
  const [deadlineDay, setDeadlineDay] = useState(settings.deadlineDayOfMonth || 15);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || '09:00');
  const [spaceName, setSpaceName] = useState(settings.spaceName || 'ห้องแจ้งเตือน KPI ผู้บริหาร');
  const [customNote, setCustomNote] = useState(settings.customNote || '');
  const [isSending, setIsSending] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [logs, setLogs] = useState<GoogleChatLog[]>(getGoogleChatLogs());

  if (!isOpen) return null;

  const currentSettings: GoogleChatSettings = {
    ...settings,
    webhookUrl: webhookUrl.trim(),
    reminderDayOfMonth: reminderDay,
    deadlineDayOfMonth: deadlineDay,
    reminderTime,
    spaceName,
    customNote,
  };

  const preview = formatGoogleChatMessage(currentSettings);
  const appsScriptCode = generateGoogleAppsScriptCode(webhookUrl.trim(), reminderDay, deadlineDay);

  const handleSaveSettings = () => {
    onUpdateSettings(currentSettings);
    saveGoogleChatSettings(currentSettings);
    setStatusFeedback({
      type: 'success',
      message: 'บันทึกการตั้งค่า Google Chat เรียบร้อยแล้ว',
    });
    setTimeout(() => setStatusFeedback(null), 4000);
  };

  const handleSendTest = async () => {
    if (!webhookUrl.trim()) {
      setStatusFeedback({
        type: 'error',
        message: 'กรุณาวาง Google Chat Webhook URL ก่อนกดทดสอบส่ง',
      });
      return;
    }

    setIsSending(true);
    setStatusFeedback(null);

    try {
      handleSaveSettings();
      const log = await sendGoogleChatMessage(currentSettings, 'manual_test');
      setLogs([log, ...logs]);
      setStatusFeedback({
        type: 'success',
        message: 'ส่งข้อความแจ้งเตือนทดสอบเข้าห้อง Google Chat สำเร็จเรียบร้อย! กรุณาเปิดตรวจสอบใน Google Chat',
      });
    } catch (err: any) {
      console.error(err);
      setStatusFeedback({
        type: 'error',
        message: err.message || 'ไม่สามารถส่งข้อความได้ โปรดตรวจสอบ Webhook URL',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleCopyMessageText = () => {
    navigator.clipboard.writeText(preview.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto font-['Prompt',sans-serif]">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="border-b border-slate-200 bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  ระบบแจ้งเตือน Google Chat (ส่งรายงานทุกวันที่ {reminderDay})
                </h2>
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] font-semibold text-blue-300 border border-blue-500/30">
                  ก่อนวันที่ {deadlineDay}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                เตือนทุกฝ่ายให้บันทึกรายงานผลงานก่อนรอบประเมินประจำเดือน • รองรับ Webhook & Apps Script
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

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 flex items-center justify-between text-xs">
          <div className="flex gap-2 py-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('settings')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตั้งค่า & พรีวิวข้อความ
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>วิธีสร้าง Webhook ใน Chat</span>
            </button>
            <button
              onClick={() => setActiveTab('script')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'script'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>โค้ดสคริปต์ Google Sheets (อัตโนมัติ 100%)</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ประวัติการส่ง ({logs.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Settings & Preview */}
        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {statusFeedback && (
              <div
                className={`rounded-xl border p-3 text-xs font-semibold flex items-center gap-2 ${
                  statusFeedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {statusFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{statusFeedback.message}</span>
              </div>
            )}

            {/* Webhook Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>Google Chat Webhook URL</span>
                  <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('guide')}
                  className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  ดูวิธีเอาลิงก์ Webhook จาก Google Chat คลิกที่นี่
                </button>
              </div>
              <input
                type="url"
                placeholder="https://chat.googleapis.com/v1/spaces/XXXXXX/messages?key=YYYYYY&token=ZZZZZZ"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-mono text-slate-900 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
              <p className="text-[11px] text-slate-500">
                เมื่อตั้งค่า URL นี้ ระบบจะสามารถส่งข้อความแจ้งเตือนเข้าไปยังห้องแชท (Space) ของคุณใน Google Chat ได้โดยตรง
              </p>
            </div>

            {/* Schedule Configuration Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-blue-600" />
                  <span>วันส่งการแจ้งเตือน (ทุกเดือน)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">ทุกวันที่</span>
                  <select
                    value={reminderDay}
                    onChange={(e) => setReminderDay(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-900 outline-hidden"
                  >
                    {[1, 5, 8, 9, 10, 11, 12].map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 10 ? '(ตามที่คุณกำหนด)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-red-600" />
                  <span>กำหนดส่งรายงาน (Deadline)</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">ก่อนวันที่</span>
                  <select
                    value={deadlineDay}
                    onChange={(e) => setDeadlineDay(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-red-600 outline-hidden"
                  >
                    {[12, 13, 14, 15, 16, 20].map((d) => (
                      <option key={d} value={d}>
                        {d} {d === 15 ? '(ตามที่คุณกำหนด)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-[11px] font-bold text-slate-700 block mb-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-slate-600" />
                  <span>เวลาส่งแจ้งเตือน</span>
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-900 outline-hidden"
                />
              </div>
            </div>

            {/* Space Name & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  ชื่อห้องแชท (สำหรับบันทึกช่วยจำ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ห้องผู้จัดการฝ่าย / ห้อง KRC KPI"
                  value={spaceName}
                  onChange={(e) => setSpaceName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-900 block mb-1">
                  ข้อความหมายเหตุเพิ่มเติม
                </label>
                <input
                  type="text"
                  placeholder="เช่น ตรวจสอบความถูกต้องก่อนบันทึก"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Live Message Preview */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                  <span>ตัวอย่างข้อความที่จะปรากฏใน Google Chat:</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyMessageText}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
                >
                  {copiedText ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedText ? 'คัดลอกข้อความแล้ว' : 'คัดลอกข้อความ'}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs font-mono whitespace-pre-wrap text-slate-800 leading-relaxed shadow-2xs border-l-4 border-l-blue-600">
                {preview.text}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Guide How to Create Google Chat Webhook */}
        {activeTab === 'guide' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-1.5">
              <h3 className="font-bold text-sm text-blue-950 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                วิธีสร้าง Webhook URL ใน Google Chat (ใช้เวลาไม่ถึง 1 นาที)
              </h3>
              <p className="text-blue-900">
                Incoming Webhook เป็นฟังก์ชันมาตรฐานฟรีของ Google Workspace ช่วยให้ระบบภายนอกส่งข้อความเข้าห้องแชทได้อัตโนมัติ
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3 items-start rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">เปิดห้องแชท (Space) ใน Google Chat</h4>
                  <p className="text-slate-600 mt-0.5">
                    เปิด Google Chat บนคอมพิวเตอร์ แล้วเข้าไปยังห้องแชท (Space) ที่ต้องการให้มีการแจ้งเตือน (เช่น ห้องรวมผู้จัดการฝ่าย หรือห้องติดตามงาน KPI)
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">ไปที่เมนูแอปและการผสานรวม (Apps & integrations)</h4>
                  <p className="text-slate-600 mt-0.5">
                    คลิกที่ <strong>ชื่อห้องแชท</strong> ที่ด้านบนสุดของหน้าจอ แล้วเลือกเมนู <strong>"แอปและการผสานรวม (Apps & integrations)"</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 items-start rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">จัดการเว็บฮุก (Manage Webhooks) และสร้างใหม่</h4>
                  <p className="text-slate-600 mt-0.5">
                    คลิกที่ <strong>"จัดการเว็บฮุก (Manage webhooks)"</strong> จากนั้นกดปุ่ม <strong>"เพิ่มเว็บฮุก (Add webhook)"</strong>
                  </p>
                  <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
                    <li>
                      <strong>ชื่อ (Name):</strong> ตั้งชื่อ เช่น <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">KPI Reminder Bot</code>
                    </li>
                    <li>
                      <strong>URL ของรูปแทน (Avatar URL):</strong> เว้นว่างไว้ หรือใส่ URL รูปภาพที่ต้องการ
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 items-start rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  4
                </span>
                <div>
                  <h4 className="font-bold text-slate-900">คัดลอกลิงก์ Webhook แล้วนำมาวาง</h4>
                  <p className="text-slate-600 mt-0.5">
                    กดปุ่ม <strong>"บันทึก (Save)"</strong> แล้วคลิกไอคอนรูปกระดาษเพื่อ <strong>"คัดลอกลิงก์ (Copy URL)"</strong> จากนั้นนำมาวางในช่อง <em>Google Chat Webhook URL</em> ในแท็บแรก แล้วกดทดสอบส่งได้ทันที!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Google Apps Script Ready-To-Use Code */}
        {activeTab === 'script' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-1.5">
              <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                วิธีติดตั้ง Google Apps Script ให้รันอัตโนมัติ 100% บน Google Sheets
              </h3>
              <p className="text-emerald-900">
                วิธีนี้จะทำให้ Google Cloud ยิงแจ้งเตือนเข้า Google Chat ทุกวันที่ {reminderDay} เวลา 09:00 น. โดยอัตโนมัติตลอดไป แม้คุณจะปิดคอมพิวเตอร์ก็ตาม!
              </p>
            </div>

            {/* Instruction Steps */}
            <ol className="list-decimal pl-5 space-y-2 text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>เปิดไฟล์ <strong>Google Sheets</strong> บันทึก KPI ของคุณ</li>
              <li>เลือกเมนูด้านบน: <strong>ส่วนขยาย (Extensions) &gt; Apps Script</strong></li>
              <li>ลบโค้ดในหน้าต่างเดิม แล้ว <strong>คัดลอกโค้ดด้านล่างไปวางแทนที่</strong></li>
              <li>คลิกไอคอนรูปนาฬิกา <strong>"ทริกเกอร์ (Triggers)"</strong> ทางแถบเมนูด้านซ้าย &gt; กด <strong>"เพิ่มทริกเกอร์ (Add Trigger)"</strong></li>
              <li>
                ตั้งค่าทริกเกอร์:
                <span className="block pl-3 text-slate-600 mt-1">
                  • ฟังก์ชัน: <code>sendKpiMonthlyReminder</code><br />
                  • แหล่งที่มา: <strong>ขับเคลื่อนตามเวลา (Time-driven)</strong><br />
                  • ประเภทตัวจับเวลา: <strong>ตัวจับเวลารายเดือน (Month timer)</strong><br />
                  • เลือกวันที่: <strong>วันที่ {reminderDay}</strong> | เวลา: <strong>9:00 - 10:00 น.</strong>
                </span>
              </li>
              <li>กด <strong>"บันทึก (Save)"</strong> และอนุญาตสิทธิ์การทำงาน ก็เป็นอันเสร็จสิ้น!</li>
            </ol>

            {/* Code Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">
                  โค้ด Google Apps Script สำเร็จรูป (ใส่ Webhook URL ให้แล้ว):
                </span>
                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 cursor-pointer"
                >
                  {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedScript ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ดทั้งหมด'}</span>
                </button>
              </div>

              <pre className="max-h-72 overflow-y-auto rounded-xl border border-slate-300 bg-slate-900 p-4 font-mono text-[11px] text-slate-100 leading-normal">
                {appsScriptCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 4: Logs */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-5">
            {logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                ยังไม่มีประวัติการส่งแจ้งเตือนเข้า Google Chat
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            log.status === 'sent'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {log.status === 'sent' ? 'ส่งสำเร็จ (Sent)' : 'เกิดข้อผิดพลาด (Failed)'}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleString('th-TH')}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-600">
                        {log.triggerType === 'manual_test' ? 'ทดสอบส่งโดยผู้ใช้' : 'รอบประจำวันที่ 10'}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900">{log.spaceName}</div>
                    <div className="text-[11px] text-slate-600">{log.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>
              ตั้งเตือน: ทุกวันที่ <strong>{reminderDay}</strong> (ส่งก่อนวันที่ <strong>{deadlineDay}</strong>)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              ปิด
            </button>

            <button
              onClick={handleSaveSettings}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 cursor-pointer"
            >
              บันทึกการตั้งค่า
            </button>

            <button
              onClick={handleSendTest}
              disabled={isSending}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className={`h-3.5 w-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'กำลังส่งแจ้งเตือน...' : 'ทดสอบส่งเข้า Google Chat ทันที'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
