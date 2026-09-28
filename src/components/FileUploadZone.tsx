import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  ExternalLink,
  Eye,
  Download,
  AlertCircle,
} from 'lucide-react';
import { AttachmentFile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface FileUploadZoneProps {
  attachments: AttachmentFile[];
  onChange: (attachments: AttachmentFile[]) => void;
  maxFiles?: number;
  maxSizeMb?: number;
  acceptedTypes?: string;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  attachments,
  onChange,
  maxFiles = 5,
  maxSizeMb = 10,
  acceptedTypes = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.zip',
}) => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext) || fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4 text-purple-600" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext) || fileType.includes('sheet') || fileType.includes('csv')) {
      return <FileSpreadsheet className="h-4 w-4 text-emerald-600" />;
    }
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const availableSlots = maxFiles - attachments.length;
    if (availableSlots <= 0) {
      setErrorMessage(
        language === 'th'
          ? `แนบไฟล์ได้สูงสุด ${maxFiles} ไฟล์เท่านั้น`
          : `You can attach up to ${maxFiles} files maximum`
      );
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    const newAttachments: AttachmentFile[] = [];

    filesToProcess.forEach((file) => {
      if (file.size > maxSizeMb * 1024 * 1024) {
        setErrorMessage(
          language === 'th'
            ? `ไฟล์ "${file.name}" มีขนาดเกิน ${maxSizeMb} MB`
            : `File "${file.name}" exceeds ${maxSizeMb} MB limit`
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const item: AttachmentFile = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result as string,
          uploadedAt: new Date().toISOString(),
        };

        onChange([...attachments, item]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(attachments.filter((a) => a.id !== id));
  };

  const handleDownloadOrOpen = (att: AttachmentFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!att.dataUrl) return;
    const link = document.createElement('a');
    link.href = att.dataUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-2.5">
      {/* Upload Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-blue-500 bg-blue-50/80 scale-[1.005]'
            : 'border-slate-200 bg-slate-50/60 hover:border-blue-400 hover:bg-slate-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />

        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100/70 text-blue-600 group-hover:scale-110 transition-transform mb-2">
          <UploadCloud className="h-5 w-5" />
        </div>

        <div className="text-xs font-semibold text-slate-700">
          <span className="text-blue-600 font-bold hover:underline">
            {language === 'th' ? 'คลิกเพื่อเลือกไฟล์' : 'Click to browse'}
          </span>{' '}
          {language === 'th' ? 'หรือลากไฟล์มาวางที่นี่' : 'or drag and drop'}
        </div>

        <p className="text-[11px] text-slate-500 mt-1">
          {language === 'th'
            ? 'รองรับ Excel (.xlsx, .csv), PDF, รูปภาพ (.jpg, .png), Word (สูงสุด 10MB/ไฟล์, ไม่เกิน 5 ไฟล์)'
            : 'Excel (.xlsx, .csv), PDF, Images, Word documents up to 10MB (max 5 files)'}
        </p>
      </div>

      {/* Error notification */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-2 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Attached Files List */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3 text-slate-400" />
              {language === 'th'
                ? `ไฟล์แนบ (${attachments.length}/${maxFiles})`
                : `Attached Files (${attachments.length}/${maxFiles})`}
            </span>
            <span className="text-slate-400 font-normal">
              {language === 'th' ? 'คลิกชื่อไฟล์เพื่อดาวน์โหลด' : 'Click to download file'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {attachments.map((file) => (
              <div
                key={file.id}
                onClick={(e) => handleDownloadOrOpen(file, e)}
                className="group flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer"
                title={language === 'th' ? 'คลิกเพื่อดาวน์โหลดไฟล์' : 'Click to download'}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-blue-50">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleDownloadOrOpen(file, e)}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                    title={language === 'th' ? 'ดาวน์โหลด' : 'Download'}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(file.id, e)}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title={language === 'th' ? 'ลบไฟล์' : 'Remove'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
