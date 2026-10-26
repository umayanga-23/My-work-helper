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
  Globe,
  Monitor,
  FolderOpen,
  AlertCircle
} from 'lucide-react';
import type { DocumentItem } from '../../types';
import { formatFileSize, documentService } from '../../services/documentService';
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
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState<string | null>(null);
  const [loadingBlob, setLoadingBlob] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setImageZoom(1);
    setTextContent(null);
    setLocalBlobUrl(null);
    setResolvedBlobUrl(null);
    setErrorMsg(null);
    setViewerEngine('NATIVE');

    if (doc && isOpen) {
      setLoadingBlob(true);
      documentService.getDownloadUrl(doc.id, doc.downloadUrl)
        .then((url) => {
          setResolvedBlobUrl(url);
          const ext = (doc.originalFileName || doc.name).split('.').pop()?.toLowerCase() || '';
          if (['txt', 'ts', 'tsx', 'js', 'jsx', 'java', 'py', 'json', 'md', 'html', 'css', 'sql'].includes(ext)) {
            setLoadingText(true);
            fetch(url)
              .then((res) => res.text())
              .then((txt) => {
                setTextContent(txt);
                setLoadingText(false);
              })
              .catch(() => {
                setLoadingText(false);
              });
          }
        })
        .catch((err) => {
          console.error('Failed to load document preview:', err);
          setErrorMsg('Failed to load document preview from vault.');
        })
        .finally(() => {
          setLoadingBlob(false);
        });
    }
  }, [doc, isOpen]);

  // Clean up blob URLs when component unmounts or doc changes
  useEffect(() => {
    return () => {
      if (resolvedBlobUrl && resolvedBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(resolvedBlobUrl);
      }
      if (localBlobUrl && localBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localBlobUrl);
      }
    };
  }, [resolvedBlobUrl, localBlobUrl]);

  if (!isOpen || !doc) return null;

  const fileName = doc.originalFileName || doc.name;
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  const isPdf = doc.fileType?.includes('pdf') || ext === 'pdf';
  const isImage = doc.fileType?.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
  const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext);
  const isCode = ['txt', 'ts', 'tsx', 'js', 'jsx', 'java', 'py', 'json', 'md', 'html', 'css', 'sql'].includes(ext);

  // Use the local blob, the resolved authenticated blob, or public Supabase URL
  const activeUrl = localBlobUrl || resolvedBlobUrl || (doc.downloadUrl && !doc.downloadUrl.startsWith('/api/') ? doc.downloadUrl : '');

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

  const isBlobUrl = activeUrl.startsWith('blob:');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#08170F]/85 backdrop-blur-md animate-in fade-in">
      <div
        className={clsx(
          'w-full bg-white dark:bg-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300',
          isFullscreen
            ? 'fixed inset-1 sm:inset-2 z-50 rounded-2xl h-[calc(100vh-0.5rem)] max-w-none'
            : 'w-[96vw] max-w-[1720px] h-[92vh]'
        )}
      >
        {/* Modal Header */}
        <div className="p-3 sm:px-6 border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between gap-3 bg-[#ECF9F1] dark:bg-[#10271C] shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-[#08170F] border border-[#BBEAD0] dark:border-[#1E4933] shadow-xs shrink-0">
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
                {doc.categoryName && (
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                    style={{
                      backgroundColor: `${doc.categoryColor || '#10B981'}15`,
                      color: doc.categoryColor || '#10B981',
                      borderColor: `${doc.categoryColor || '#10B981'}30`,
                    }}
                  >
                    {doc.categoryName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#3D7858] dark:text-[#72B38F] font-mono truncate">
                {doc.originalFileName} • {formatFileSize(doc.fileSize)}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 shrink-0">
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

        {/* Viewer Engine Selector Toolbar (Only for Office Documents with Public URLs) */}
        {isOfficeDoc && !isBlobUrl && (
          <div className="px-4 sm:px-6 py-2 bg-white dark:bg-[#08170F] border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between gap-3 flex-wrap text-xs shrink-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-[#3D7858] dark:text-[#72B38F] uppercase tracking-wider mr-1">
                Office Viewer:
              </span>

              {/* Microsoft Office Online Viewer */}
              <button
                onClick={() => setViewerEngine('MICROSOFT')}
                className={clsx(
                  'px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 border text-xs',
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
                  'px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1.5 border text-xs',
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
                onChange={handleLocalFileSelect}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* Modal Main Preview Body (Spacious Canvas) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-4 bg-[#F9FDFB] dark:bg-[#08140E] flex flex-col">
          {loadingBlob ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Fetching document from secure vault...
              </p>
              <p className="text-xs text-gray-400">
                Decrypting and preparing high-definition preview
              </p>
            </div>
          ) : errorMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3">
              <AlertCircle className="w-10 h-10 text-rose-500" />
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{errorMsg}</p>
              <button
                onClick={() => onDownload(doc)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl"
              >
                Download File Directly
              </button>
            </div>
          ) : isPdf || isOfficeDoc ? (
            /* PDF & Office Embedded Frame */
            <div className="w-full flex-1 min-h-0 rounded-2xl overflow-hidden border border-[#BBEAD0] dark:border-[#1E4933] bg-white dark:bg-[#0D2218] shadow-inner flex flex-col">
              <iframe
                src={getEmbedUrl()}
                title={doc.name}
                className="w-full flex-1 min-h-[500px] border-0"
              />
            </div>
          ) : isImage ? (
            /* Image Preview with Zoom */
            <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center gap-2 bg-white dark:bg-[#0D2218] px-3 py-1.5 rounded-full border border-[#BBEAD0] dark:border-[#1E4933] shadow-sm shrink-0">
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

              <div className="w-full flex-1 overflow-auto p-4 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-md flex items-center justify-center">
                <img
                  src={activeUrl}
                  alt={doc.name}
                  style={{ transform: `scale(${imageZoom})`, transformOrigin: 'center center' }}
                  className="max-h-[75vh] max-w-full object-contain rounded-lg transition-transform duration-150"
                />
              </div>
            </div>
          ) : isCode ? (
            /* Code & Text Viewer */
            <div className="w-full flex-1 min-h-0 flex flex-col rounded-2xl border border-[#BBEAD0] dark:border-[#1E4933] overflow-hidden shadow-md">
              <div className="p-2.5 bg-[#ECF9F1] dark:bg-[#10271C] border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between text-xs font-mono text-[#3D7858] dark:text-[#72B38F] shrink-0">
                <span>{doc.originalFileName}</span>
                <span>UTF-8 Source</span>
              </div>
              <pre className="flex-1 p-4 bg-[#08170F] text-emerald-300 font-mono text-xs overflow-auto select-text leading-relaxed">
                {loadingText ? 'Loading file content...' : textContent || 'Empty file'}
              </pre>
            </div>
          ) : (
            /* General Binary / Archive File View */
            <div className="flex-1 flex items-center justify-center">
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
            </div>
          )}
        </div>

        {/* Modal Info Footer */}
        <div className="p-3 sm:px-6 bg-[#ECF9F1] dark:bg-[#10271C] border-t border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between text-xs text-[#3D7858] dark:text-[#72B38F] flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-[#25935C] dark:text-[#5FBF8F]">
              🔒 Verified Secure Storage Item
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

function getFileTypeIcon(fileType: string, ext: string) {
  if (fileType?.includes('pdf') || ext === 'pdf') {
    return <FileText className="w-5 h-5 text-rose-500" />;
  }
  if (fileType?.includes('image') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) {
    return <FileImage className="w-5 h-5 text-sky-500" />;
  }
  if (['docx', 'doc'].includes(ext)) {
    return <File className="w-5 h-5 text-blue-500" />;
  }
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-amber-500" />;
  }
  if (['ts', 'tsx', 'js', 'jsx', 'java', 'py', 'json', 'md', 'html', 'css', 'sql'].includes(ext)) {
    return <FileCode className="w-5 h-5 text-teal-500" />;
  }
  return <File className="w-5 h-5 text-gray-500" />;
}
