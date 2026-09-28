import React, { useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  History,
  Info,
  Mail,
  Plus,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import {
  dispatchEmailAlert,
  generateEmailHtml,
  generateGoogleAppsScriptEmailAlertCode,
  getBreachedKpis,
  getNotificationLogs,
  saveAlertSettings,
} from '../services/notificationService';
import { AlertSettings, EmailRecipient, KPIItem, NotificationLog } from '../types';

interface EmailAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: KPIItem[];
  alertSettings: AlertSettings;
  onUpdateAlertSettings: (settings: AlertSettings) => void;
  focusedKpi?: KPIItem | null;
}

export const EmailAlertModal: React.FC<EmailAlertModalProps> = ({
  isOpen,
  onClose,
  items,
  alertSettings,
  onUpdateAlertSettings,
  focusedKpi,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'schedule' | 'recipients' | 'logs'>('preview');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>(getNotificationLogs());

  if (!isOpen) return null;

  const scheduleDay = alertSettings.scheduleDayOfMonth || 16;
  const scheduleTime = alertSettings.scheduleTime || '08:00';

  // Filter breached KPIs
  const allBreached = getBreachedKpis(items, alertSettings.alertOnDepartments);
  const breachedList = focusedKpi
    ? allBreached.filter((b) => b.kpi.id === focusedKpi.id)
    : allBreached;

  const emailPreview = generateEmailHtml(breachedList, alertSettings, 'manual');

  // Apps Script code for Google Sheets automation
  const activeRecipientsList = alertSettings.recipients.filter((r) => r.enabled).map((r) => r.email).join(', ');
  const appsScriptCode = generateGoogleAppsScriptEmailAlertCode(
    activeRecipientsList || 'iso-sshe@krctrans.com',
    scheduleDay,
    scheduleTime
  );

  // Handle Add Recipient
  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) return;

    const newRecip: EmailRecipient = {
      id: `recip-${Date.now()}`,
      email: newEmail.trim(),
      name: newName.trim() || newEmail.split('@')[0],
      role: 'Staff',
      departmentScope: 'ALL',
      enabled: true,
    };

    const updated = {
      ...alertSettings,
      recipients: [...alertSettings.recipients, newRecip],
    };
    onUpdateAlertSettings(updated);
    saveAlertSettings(updated);
    setNewEmail('');
    setNewName('');
  };

  // Remove Recipient
  const handleRemoveRecipient = (id: string) => {
    const updated = {
      ...alertSettings,
      recipients: alertSettings.recipients.filter((r) => r.id !== id),
    };
    onUpdateAlertSettings(updated);
    saveAlertSettings(updated);
  };

  // Toggle Recipient
  const handleToggleRecipient = (id: string) => {
    const updated = {
      ...alertSettings,
      recipients: alertSettings.recipients.map((r) =>
        r.id === id ? { ...r, enabled: !r.enabled } : r
      ),
    };
    onUpdateAlertSettings(updated);
    saveAlertSettings(updated);
  };

  // Toggle Auto-notify on sync
  const handleToggleAutoSync = () => {
    const updated = {
      ...alertSettings,
      notifyOnSync: !alertSettings.notifyOnSync,
    };
    onUpdateAlertSettings(updated);
    saveAlertSettings(updated);
  };

  // Dispatch Email Alert
  const handleSendAlert = async () => {
    setIsSending(true);
    setSendSuccess(null);
    try {
      const log = await dispatchEmailAlert(breachedList, alertSettings, 'manual');
      setLogs([log, ...logs]);
      setSendSuccess(`ส่งอีเมลแจ้งเตือนสำเร็จไปยัง ${log.recipient}!`);
      setTimeout(() => setSendSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setSendSuccess('เกิดข้อผิดพลาดในการส่ง กรุณาลองใหม่');
    } finally {
      setIsSending(false);
    }
  };

  // Copy Email Text
  const handleCopyText = () => {
    navigator.clipboard.writeText(emailPreview.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Mailto Link
  const activeEmails = alertSettings.recipients.filter((r) => r.enabled).map((r) => r.email).join(',');
  const mailtoUrl = `mailto:${activeEmails}?subject=${encodeURIComponent(
    emailPreview.subject
  )}&body=${encodeURIComponent(emailPreview.text)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b border-slate-200 bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  ระบบแจ้งเตือนอีเมลเมื่อ KPI ต่ำกว่าเป้าหมาย
                </h2>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-300 border border-red-500/30">
                  {breachedList.length} รายการที่ตกเป้า
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                FY2026 Executive Notification Center • แจ้งเตือนอัตโนมัติทุกวันที่ {scheduleDay} เวลา {scheduleTime} น.
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

        {/* Tabs Bar */}
        <div className="border-b border-slate-200 bg-slate-50 px-5 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex flex-wrap gap-2 py-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              พรีวิวรายงานอีเมล ({breachedList.length})
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'schedule'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              <span>รอบการส่ง (ทุกวันที่ {scheduleDay} @ {scheduleTime})</span>
            </button>
            <button
              onClick={() => setActiveTab('recipients')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                activeTab === 'recipients'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ผู้รับอีเมล ({alertSettings.recipients.filter((r) => r.enabled).length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`rounded-lg px-3 py-1.5 font-semibold transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ประวัติการส่ง ({logs.length})
            </button>
          </div>

          {/* Quick Auto-Schedule Trigger Toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={alertSettings.notifyOnSync}
              onChange={handleToggleAutoSync}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-[11px] font-medium text-slate-700">
              เปิดการแจ้งเตือนอัตโนมัติทุกวันที่ {scheduleDay} เวลา {scheduleTime} น.
            </span>
          </label>
        </div>

        {/* Tab 1: Preview & Send */}
        {activeTab === 'preview' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {sendSuccess && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{sendSuccess}</span>
              </div>
            )}

            {/* Email Meta bar */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-semibold text-slate-500">ผู้รับ (To): </span>
                  <span className="font-mono text-slate-800 font-medium">
                    {activeEmails || 'ไม่มีผู้รับที่เปิดใช้งาน'}
                  </span>
                </div>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700 font-semibold">
                  HTML Email Digest
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-500">หัวเรื่อง (Subject): </span>
                <span className="text-slate-900 font-semibold">{emailPreview.subject}</span>
              </div>
            </div>

            {/* Rendered HTML Preview */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <div
                className="overflow-x-auto text-xs"
                dangerouslySetInnerHTML={{ __html: emailPreview.html }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Schedule Settings (Every 16th at 08:00 AM) */}
        {activeTab === 'schedule' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-3">
              <div className="flex items-center gap-2 font-bold text-blue-900 text-sm">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span>กำหนดการส่งรายงานอีเมลอัตโนมัติประจำเดือน</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                ระบบถูกตั้งค่าให้ส่งอีเมลสรุปตัวชี้วัด KPI ที่ตกเป้าหมายโดยอัตโนมัติใน <strong>ทุกวันที่ {scheduleDay} ของเดือน เวลา {scheduleTime} น.</strong>
              </p>
            </div>

            {/* Schedule Configuration Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900">ตั้งค่ารอบเวลาและวันที่</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-500" />
                    <span>วันที่ส่งในแต่ละเดือน (Day of Month)</span>
                  </label>
                  <select
                    value={alertSettings.scheduleDayOfMonth || 16}
                    onChange={(e) => {
                      const updated = {
                        ...alertSettings,
                        scheduleDayOfMonth: parseInt(e.target.value, 10),
                      };
                      onUpdateAlertSettings(updated);
                      saveAlertSettings(updated);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        ทุกวันที่ {d} ของทุกเดือน
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">ค่าเริ่มต้นปัจจุบัน: ทุกวันที่ 16 ของเดือน</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span>เวลาที่ต้องการส่ง (Time)</span>
                  </label>
                  <input
                    type="time"
                    value={alertSettings.scheduleTime || '08:00'}
                    onChange={(e) => {
                      const updated = {
                        ...alertSettings,
                        scheduleTime: e.target.value,
                      };
                      onUpdateAlertSettings(updated);
                      saveAlertSettings(updated);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">เวลาในเขตเวลาไทย (ICT, UTC+7)</p>
                </div>
              </div>

              {/* Status summary */}
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900">สถานะการส่งรอบล่าสุด: </span>
                  <span className="text-slate-600">
                    {alertSettings.lastDispatchedDate
                      ? `ส่งสำเร็จแล้วในวันที่ ${alertSettings.lastDispatchedDate}`
                      : 'ยังไม่เคยมีการส่งรอบประจำเดือน'}
                  </span>
                </div>
                {alertSettings.lastDispatchedDate && (
                  <button
                    onClick={() => {
                      const updated = {
                        ...alertSettings,
                        lastDispatchedDate: undefined,
                      };
                      onUpdateAlertSettings(updated);
                      saveAlertSettings(updated);
                    }}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                  >
                    รีเซ็ตสถานะเพื่อส่งซ้ำ
                  </button>
                )}
              </div>
            </div>

            {/* Google Apps Script Integration for Automated Background Execution */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-900">
                    สคริปต์ส่งอัตโนมัติผ่าน Google Sheets (Google Apps Script)
                  </h3>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appsScriptCode);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {copiedScript ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedScript ? 'คัดลอกโค้ดแล้ว!' : 'คัดลอกสคริปต์'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                เพื่อให้ระบบสามารถส่งอีเมลได้ตรงเวลาในทุกวันที่ {scheduleDay} เวลา {scheduleTime} น. แม้ไม่มีผู้เปิดหน้า Dashboard ไว้ ท่านสามารถนำสคริปต์นี้ไปติดตั้งใน Google Sheets ต้นทางได้โดยตรง
              </p>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-48">
                {appsScriptCode}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Recipients Management */}
        {activeTab === 'recipients' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Add new recipient form */}
            <form onSubmit={handleAddRecipient} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-xs font-bold text-slate-900 mb-2">เพิ่มผู้รับอีเมลแจ้งเตือนใหม่</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="email"
                  placeholder="อีเมลผู้รับ เช่น manager@krctrans.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="sm:col-span-3 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-hidden focus:border-slate-400"
                  required
                />
                <input
                  type="text"
                  placeholder="ชื่อ / ตำแหน่ง (เช่น ผจก.คลัง)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-hidden focus:border-slate-400"
                />
              </div>
              <div className="mt-2.5 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-slate-800 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>เพิ่มผู้รับ</span>
                </button>
              </div>
            </form>

            {/* Recipient list */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">รายชื่อผู้รับที่ตั้งค่าไว้</h4>
              {alertSettings.recipients.map((recip) => (
                <div
                  key={recip.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={recip.enabled}
                      onChange={() => handleToggleRecipient(recip.id)}
                      className="rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <span>{recip.name}</span>
                        <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                          {recip.role}
                        </span>
                      </div>
                      <div className="font-mono text-slate-500 text-[11px]">{recip.email}</div>
                    </div>
                  </div>

                  {alertSettings.recipients.length > 1 && (
                    <button
                      onClick={() => handleRemoveRecipient(recip.id)}
                      className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="ลบผู้รับนี้"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Webhook integration */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  Webhook URL สำรอง (เช่น Slack, MS Teams, Line Notify)
                </span>
                <span className="text-[10px] text-slate-500">ไม่บังคับ</span>
              </div>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/..."
                value={alertSettings.webhookUrl || ''}
                onChange={(e) => {
                  const updated = { ...alertSettings, webhookUrl: e.target.value };
                  onUpdateAlertSettings(updated);
                  saveAlertSettings(updated);
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-mono text-slate-800 outline-hidden focus:border-slate-400"
              />
              <p className="text-[11px] text-slate-500">
                เมื่อส่งการแจ้งเตือน ระบบจะยิงข้อความ JSON สรุปไปยัง Webhook นี้ด้วยทันที
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Logs */}
        {activeTab === 'logs' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {/* Explanatory Notice */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-950 space-y-1.5 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Info className="h-4 w-4 text-amber-600 shrink-0" />
                <span>คำชี้แจงเกี่ยวกับประวัติการส่งอีเมล (System Log)</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                ประวัติด้านล่างคือการบันทึกประวัติการกระตุ้นเตือนในแดชบอร์ด (Audit Log) ทั้งแบบอัตโนมัติตามรอบกำหนดการ (ทุกวันที่ {scheduleDay} เวลา {scheduleTime} น.) และแบบกดส่งด้วยตนเอง 
                หากท่านยังไม่ได้รับอีเมลเข้า Inbox กล่องจดหมายจริง แนะนำให้คลิก <strong>"เปิดใน Email Client"</strong> ด้านล่าง หรือใช้ฟังก์ชันเชื่อมต่อ <strong>Google Chat Webhook</strong> เพื่อรับข้อความแจ้งเตือนทันที
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={mailtoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-amber-700" />
                  <span>เปิดส่งผ่าน Outlook / Email Client ทันที</span>
                </a>
                <button
                  onClick={handleCopyText}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-amber-700" />}
                  <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความไปวางในอีเมล'}</span>
                </button>
              </div>
            </div>

            {logs.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                ยังไม่มีประวัติการส่งการแจ้งเตือน
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
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          บันทึกสำเร็จ (Logged)
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleString('th-TH')}
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-600">
                        {log.triggerType === 'auto_10min' ? 'รอบ 10 นาทีอัตโนมัติ' : 'กดส่งโดยผู้ใช้'}
                      </span>
                    </div>

                    <div className="font-semibold text-slate-900">{log.subject}</div>
                    <div className="text-[11px] text-slate-600">
                      ผู้รับ: <span className="font-mono text-slate-800">{log.recipient}</span>
                    </div>

                    {log.breachedKpis && log.breachedKpis.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {log.breachedKpis.map((k, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 text-[10px]"
                          >
                            {k.department}: {k.name} ({k.actual} vs {k.target})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyText}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความอีเมล'}</span>
            </button>

            <a
              href={mailtoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>เปิดใน Email Client</span>
            </a>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              ปิด
            </button>

            <button
              onClick={handleSendAlert}
              disabled={isSending || breachedList.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 active:bg-red-800 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <Send className={`h-3.5 w-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'กำลังส่งแจ้งเตือน...' : 'ส่งอีเมลแจ้งเตือนทันที'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
