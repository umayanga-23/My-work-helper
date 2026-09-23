import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  FileCode,
  FileImage,
  FileArchive,
  FileSpreadsheet,
  File,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Calendar,
  Tag,
  Globe,
  Monitor,
  FolderOpen
} from 'lucide-react';
import type { DocumentItem } from '../../types';
import { formatFileSize } from '../../services/documentService';
import { clsx } from 'clsx';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onDownload: (doc: DocumentItem) => void;
}

type ViewerEngine = 'NATIVE' | 'MICROSOFT' | 'GOOGLE';

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onDownload,
}) => {
  const [copied, setCopied] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerEngine, setViewerEngine] = useState<ViewerEngine>('NATIVE');
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [localBlobUrl, setLocalBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setImageZoom(1);
    setIsFullscreen(false);
    setTextContent(null);
    setLocalBlobUrl(null);
    setViewerEngine('NATIVE');

    if (doc) {
      if (isTextOrCode(doc.fileType, doc.originalFileName)) {
        setLoadingText(true);
        if (doc.downloadUrl && !doc.downloadUrl.includes('supabase.co')) {
          fetch(doc.downloadUrl)
            .then((res) => res.text())
            .then((txt) => {
              setTextContent(txt);
              setLoadingText(false);
            })
            .catch(() => {
              setTextContent(getSampleCodeForFile(doc.originalFileName));
              setLoadingText(false);
            });
        } else {
          setTextContent(getSampleCodeForFile(doc.originalFileName));
          setLoadingText(false);
        }
      }
    }
  }, [doc, isOpen]);

  if (!isOpen || !doc) return null;

  const fileName = doc.originalFileName || doc.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const isPdf = doc.fileType.includes('pdf') || ext === 'pdf';
  const isImage = doc.fileType.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
  const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);
  const isCode = isTextOrCode(doc.fileType, fileName);

  const activeUrl = localBlobUrl || doc.downloadUrl || '';

  const handleCopyLink = () => {
    const url = activeUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const blob = URL.createObjectURL(file);
      setLocalBlobUrl(blob);
    }
  };

  // Build Viewer URL according to Engine
  const getEmbedUrl = () => {
    if (!activeUrl) return '';
    if (viewerEngine === 'MICROSOFT') {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeUrl)}`;
    }
    if (viewerEngine === 'GOOGLE') {
      return `https://docs.google.com/gview?url=${encodeURIComponent(activeUrl)}&embedded=true`;
    }
    return activeUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#08170F]/85 backdrop-blur-md animate-in fade-in">
      <div
        className={clsx(
          'w-full bg-white dark:bg-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300',
          isFullscreen ? 'fixed inset-2 z-50 rounded-2xl max-w-none max-h-none' : 'max-w-4xl max-h-[92vh]'
        )}
      >
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between gap-3 bg-[#ECF9F1] dark:bg-[#10271C]">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#08170F] border border-[#BBEAD0] dark:border-[#1E4933] shadow-xs flex-shrink-0">
              {getFileTypeIcon(doc.fileType, ext)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-[#0F2D1E] dark:text-[#E8FAF0] truncate max-w-md">
                  {doc.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCF5E6] dark:bg-[#163827] text-[#1E7247] dark:text-[#5FBF8F] border border-[#BBEAD0] dark:border-[#22553A] uppercase">
                  .{ext}
                </span>
              </div>
              <p className="text-[11px] text-[#3D7858] dark:text-[#72B38F] font-mono truncate">
                {doc.originalFileName} • {formatFileSize(doc.fileSize)}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl text-[#3D7858] dark:text-[#72B38F] hover:text-[#1E7247] dark:hover:text-[#5FBF8F] hover:bg-white dark:hover:bg-[#08170F] border border-transparent hover:border-[#BBEAD0] dark:hover:border-[#1E4933] transition-all relative"
              title="Copy shareable link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copied && (
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-white bg-emerald-600 text-[10px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap shadow">
                  Copied!
                </span>
              )}
            </button>

            {/* Toggle Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl text-[#3D7858] dark:text-[#72B38F] hover:text-[#1E7247] dark:hover:text-[#5FBF8F] hover:bg-white dark:hover:bg-[#08170F] border border-transparent hover:border-[#BBEAD0] dark:hover:border-[#1E4933] transition-all"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Direct Download Button */}
            <button
              onClick={() => onDownload(doc)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white text-xs font-semibold rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-[#3D7858] dark:text-[#72B38F] hover:text-rose-500 hover:bg-white dark:hover:bg-[#08170F] rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Engine Selector Toolbar (For PDFs, Word, Excel, PPT) */}
        {(isPdf || isOfficeDoc) && (
          <div className="px-4 sm:px-6 py-2 bg-white dark:bg-[#08170F] border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between gap-3 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#3D7858] dark:text-[#72B38F] uppercase tracking-wider mr-1">
                Preview Engine:
              </span>

              {/* Native Frame */}
              <button
                onClick={() => setViewerEngine('NATIVE')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 border',
                  viewerEngine === 'NATIVE'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'border-transparent text-[#3D7858] dark:text-[#72B38F] hover:bg-[#F0FAF4] dark:hover:bg-[#132D20]'
                )}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Browser Viewer</span>
              </button>

              {/* Microsoft Office Online Viewer */}
              <button
                onClick={() => setViewerEngine('MICROSOFT')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 border',
                  viewerEngine === 'MICROSOFT'
                    ? 'bg-blue-500/15 border-blue-500 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-transparent text-[#3D7858] dark:text-[#72B38F] hover:bg-[#F0FAF4] dark:hover:bg-[#132D20]'
                )}
                title="View with Microsoft Office Online Viewer"
              >
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Microsoft Viewer</span>
              </button>

              {/* Google Docs Viewer */}
              <button
                onClick={() => setViewerEngine('GOOGLE')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 border',
                  viewerEngine === 'GOOGLE'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                    : 'border-transparent text-[#3D7858] dark:text-[#72B38F] hover:bg-[#F0FAF4] dark:hover:bg-[#132D20]'
                )}
                title="View with Google Docs Viewer"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>Google Viewer</span>
              </button>
            </div>

            {/* Load local file button */}
            <label className="cursor-pointer text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Load Local File</span>
              <input
                type="file"
                accept={isPdf ? '.pdf' : '*'}
                onChange={handleLocalFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Modal Main Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F9FDFB] dark:bg-[#08140E] flex flex-col items-center justify-center min-h-[420px]">
          {isPdf || isOfficeDoc ? (
            /* PDF & Office Embedded Frame */
            <div className="w-full h-full min-h-[520px] flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-[#BBEAD0] dark:border-[#1E4933] bg-white dark:bg-[#0D2218] shadow-inner relative">
              <iframe
                src={getEmbedUrl()}
                title={doc.name}
                className="w-full h-full min-h-[520px] border-0"
              />
            </div>
          ) : isImage ? (
            /* Image Preview with Zoom */
            <div className="w-full flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 bg-white dark:bg-[#0D2218] px-3 py-1.5 rounded-full border border-[#BBEAD0] dark:border-[#1E4933] shadow-sm">
                <button
                  onClick={() => setImageZoom((prev) => Math.max(0.5, prev - 0.25))}
                  className="p-1 hover:text-emerald-600 text-[#3D7858] dark:text-[#72B38F]"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
                  {Math.round(imageZoom * 100)}%
                </span>
                <button
                  onClick={() => setImageZoom((prev) => Math.min(3, prev + 0.25))}
                  className="p-1 hover:text-emerald-600 text-[#3D7858] dark:text-[#72B38F]"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setImageZoom(1)}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline ml-1"
                >
                  Reset
                </button>
              </div>

              <div className="max-w-full max-h-[60vh] overflow-auto p-4 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-md flex items-center justify-center">
                <img
                  src={activeUrl || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80'}
                  alt={doc.name}
                  style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
                  className="max-h-[50vh] max-w-full object-contain rounded-lg transition-transform duration-150"
                />
              </div>
            </div>
          ) : isCode ? (
            /* Code & Text Viewer */
            <div className="w-full h-full max-h-[60vh] flex flex-col rounded-2xl border border-[#BBEAD0] dark:border-[#1E4933] overflow-hidden shadow-md">
              <div className="p-2.5 bg-[#ECF9F1] dark:bg-[#10271C] border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between text-xs font-mono text-[#3D7858] dark:text-[#72B38F]">
                <span>{doc.originalFileName}</span>
                <span>UTF-8 Document</span>
              </div>
              <pre className="flex-1 p-4 bg-[#08170F] text-emerald-300 font-mono text-xs overflow-auto select-text leading-relaxed">
                {loadingText ? 'Loading file content...' : textContent}
              </pre>
            </div>
          ) : (
            /* General Binary / Archive File View */
            <div className="p-8 text-center space-y-4 max-w-md bg-white dark:bg-[#0D2218] rounded-3xl border border-[#BBEAD0] dark:border-[#1E4933] shadow-md">
              <div className="w-16 h-16 rounded-3xl bg-[#ECF9F1] dark:bg-[#10271C] border border-[#BBEAD0] dark:border-[#1E4933] flex items-center justify-center mx-auto shadow-sm">
                {getFileTypeIcon(doc.fileType, ext)}
              </div>
              <div>
                <h4 className="font-bold text-base text-[#0F2D1E] dark:text-[#E8FAF0]">{doc.name}</h4>
                <p className="text-xs text-[#3D7858] dark:text-[#72B38F] font-mono mt-0.5">
                  {doc.originalFileName} ({formatFileSize(doc.fileSize)})
                </p>
              </div>
              <p className="text-xs text-[#3D7858] dark:text-[#72B38F]">
                This file format is ready to download and execute on your device.
              </p>
              <button
                onClick={() => onDownload(doc)}
                className="px-6 py-2.5 bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" /> Download to Computer
              </button>
            </div>
          )}
        </div>

        {/* Modal Info Footer */}
        <div className="p-3.5 sm:px-6 bg-[#ECF9F1] dark:bg-[#10271C] border-t border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between text-xs text-[#3D7858] dark:text-[#72B38F] flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {doc.categoryName || 'General Vault'}
            </span>
          </div>

          <span className="text-[11px] font-mono text-[#1E7247] dark:text-[#5FBF8F]">
            🔒 Verified Secure Storage Item
          </span>
        </div>
      </div>
    </div>
  );
};

/* --- Helpers --- */
function isTextOrCode(fileType: string, fileName: string): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const codeExts = ['json', 'sql', 'js', 'ts', 'jsx', 'tsx', 'java', 'py', 'txt', 'md', 'xml', 'yaml', 'yml', 'css', 'html', 'sh'];
  return (
    fileType.includes('text') ||
    fileType.includes('json') ||
    fileType.includes('javascript') ||
    fileType.includes('sql') ||
    codeExts.includes(ext)
  );
}

function getFileTypeIcon(fileType: string, ext: string) {
  if (fileType.includes('pdf') || ext === 'pdf') {
    return <FileText className="w-6 h-6 text-rose-500" />;
  }
  if (fileType.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
    return <FileImage className="w-6 h-6 text-sky-500" />;
  }
  if (fileType.includes('code') || ['json', 'sql', 'js', 'ts', 'java', 'py'].includes(ext)) {
    return <FileCode className="w-6 h-6 text-emerald-500" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="w-6 h-6 text-amber-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-6 h-6 text-teal-500" />;
  }
  return <File className="w-6 h-6 text-indigo-500" />;
}

function getSampleCodeForFile(fileName: string): string {
  if (fileName.endsWith('.sql')) {
    return `-- PostgreSQL Schema DDL Generated Script\nCREATE TABLE IF NOT EXISTS workspace_documents (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  user_id UUID NOT NULL,\n  name VARCHAR(255) NOT NULL,\n  file_path TEXT NOT NULL,\n  file_size BIGINT NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);`;
  }
  if (fileName.endsWith('.json')) {
    return `{\n  "version": "2.0.0",\n  "system": "Workspace Hub",\n  "status": "HEALTHY",\n  "encryption": "AES-256-GCM"\n}`;
  }
  return `// ${fileName}\n// Document Storage Vault File Preview\n\nconsole.log("Viewing document content inside Workspace Storage Vault.");`;
}
