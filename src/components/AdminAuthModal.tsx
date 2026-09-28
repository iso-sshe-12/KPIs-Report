import React, { useState } from 'react';
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LogOut,
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PIN,
  getAdminBookmarkUrl,
  getViewerShareUrl,
  verifyAdminCredentials,
} from '../services/authService';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onLoginSuccess: () => void;
  onLogout: () => void;
  isViewerPreview: boolean;
  onToggleViewerPreview: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  isAdmin,
  onLoginSuccess,
  onLogout,
  isViewerPreview,
  onToggleViewerPreview,
}) => {
  const [credentialInput, setCredentialInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedViewer, setCopiedViewer] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (verifyAdminCredentials(credentialInput)) {
      setCredentialInput('');
      onLoginSuccess();
      onClose();
    } else {
      setErrorMessage(`รหัส PIN หรืออีเมลไม่ถูกต้อง (สามารถใช้ PIN: ${DEFAULT_ADMIN_PIN} หรือ ${DEFAULT_ADMIN_EMAIL})`);
    }
  };

  const handleCopyViewerUrl = () => {
    const url = getViewerShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedViewer(true);
    setTimeout(() => setCopiedViewer(false), 2000);
  };

  const handleCopyAdminUrl = () => {
    const url = getAdminBookmarkUrl();
    navigator.clipboard.writeText(url);
    setCopiedAdmin(true);
    setTimeout(() => setCopiedAdmin(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isAdmin ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
              {isAdmin ? <ShieldCheck className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isAdmin ? 'การจัดการสิทธิ์ผู้ดูแลระบบ (Admin)' : 'เข้าสู่ระบบผู้ดูแลระบบ (Admin Only)'}
              </h2>
              <p className="text-[11px] text-slate-500">
                {isAdmin ? `กำลังใช้งานในนาม: ${DEFAULT_ADMIN_EMAIL}` : 'ซ่อนปุ่ม Google Sheets, Google Chat & แจ้งเตือนอีเมลจากบุคคลอื่น'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isAdmin ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 space-y-1.5 text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>คุณมีสิทธิ์เห็นปุ่มทั้งหมดแล้ว</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  ปุ่ม <strong>Google Sheets</strong>, <strong>Google Chat</strong> และ <strong>แจ้งเตือนอีเมล</strong> จะแสดงผลให้ <strong>คุณเห็นเพียงคนเดียว</strong> บนเบราว์เซอร์เครื่องนี้ คนอื่นที่เปิดลิงก์ทั่วไปจะไม่เห็นปุ่มเหล่านี้โดยเด็ดขาด
                </p>
              </div>

              {/* Mode Toggle: Preview as Viewer */}
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {isViewerPreview ? <EyeOff className="h-4 w-4 text-amber-500" /> : <Eye className="h-4 w-4 text-blue-600" />}
                      จำลองมุมมองของบุคคลอื่น (Viewer Preview)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {isViewerPreview
                        ? 'กำลังแสดงผลเหมือนที่ผู้อื่นเห็น (ซ่อนปุ่ม Sheets, Chat และอีเมลแล้ว)'
                        : 'คลิกเพื่อทดสอบดูว่าคนอื่นจะมองเห็นหน้าจออย่างไร'}
                    </p>
                  </div>
                  <button
                    onClick={onToggleViewerPreview}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      isViewerPreview
                        ? 'bg-amber-500 text-white hover:bg-amber-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isViewerPreview ? 'ปิดโหมดจำลอง' : 'ลองดูมุมมองคนอื่น'}
                  </button>
                </div>
              </div>

              {/* Copy Links Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">ลิงก์สำหรับแชร์และใช้งาน</label>
                
                {/* Clean share link for others */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-slate-800 block">ลิงก์ส่งให้ผู้อื่น (ไม่เห็นปุ่มใดๆ)</span>
                    <span className="text-[11px] text-slate-500 block truncate">ปลอดภัยสำหรับแชร์ทั่วไป</span>
                  </div>
                  <button
                    onClick={handleCopyViewerUrl}
                    className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0 shadow-2xs"
                  >
                    {copiedViewer ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedViewer ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์'}</span>
                  </button>
                </div>

                {/* Bookmark link for you */}
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50/50 p-2.5">
                  <div className="min-w-0 pr-2">
                    <span className="text-xs font-semibold text-blue-900 block">ลิงก์ Bookmark ส่วนตัวของคุณ</span>
                    <span className="text-[11px] text-blue-700 block truncate">เปิดแล้วเป็นแอดมินอัตโนมัติทันที</span>
                  </div>
                  <button
                    onClick={handleCopyAdminUrl}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 text-white px-2.5 py-1 text-xs font-medium hover:bg-blue-700 cursor-pointer shrink-0 shadow-2xs"
                  >
                    {copiedAdmin ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedAdmin ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                  </button>
                </div>
              </div>

              {/* Logout button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">ออกจากระบบเมื่อใช้งานบนเครื่องสาธารณะ</span>
                <button
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>ออกจากโหมดแอดมิน</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1 text-xs text-slate-700">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-slate-500" />
                  การเข้าถึงแบบส่วนตัว (Private Access)
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  เนื่องจากปุ่ม Google Sheets, Google Chat และการแจ้งเตือนอีเมลถูกตั้งค่าให้ <strong>ซ่อนจากผู้อื่น</strong> โปรดใส่รหัส PIN หรืออีเมลผู้ดูแลระบบเพื่อเปิดการแสดงผล
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                  <span>รหัสผ่าน PIN หรือ อีเมล</span>
                </label>
                <input
                  type="password"
                  value={credentialInput}
                  onChange={(e) => setCredentialInput(e.target.value)}
                  placeholder={`ใส่รหัส PIN (เช่น ${DEFAULT_ADMIN_PIN}) หรืออีเมล`}
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
                {errorMessage && (
                  <p className="text-[11px] font-medium text-red-600 flex items-center gap-1 mt-1">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  ค่าเริ่มต้น: ใส่ PIN <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{DEFAULT_ADMIN_PIN}</code> หรือ <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">{DEFAULT_ADMIN_EMAIL}</code>
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  ยืนยันและเข้าสู่ระบบ
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
