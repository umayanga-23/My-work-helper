import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileText, CheckCircle2, AlertCircle, Sparkles, Globe } from 'lucide-react';
import { Website } from '../../types';
import { websiteService } from '../../services/websiteService';
import { clsx } from 'clsx';

interface BookmarkImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  websites: Website[];
  onImportComplete: () => void;
}

export const BookmarkImportExportModal: React.FC<BookmarkImportExportModalProps> = ({
  isOpen,
  onClose,
  websites,
  onImportComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'IMPORT' | 'EXPORT'>('IMPORT');
  const [importing, setImporting] = useState(false);
  const [parsedBookmarks, setParsedBookmarks] = useState<Partial<Website>[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setStatusMessage(null);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setParsedBookmarks(parsed);
          } else {
            setStatusMessage({ type: 'error', text: 'Invalid JSON format. Expected an array of bookmark items.' });
          }
        } else {
          const parsed = websiteService.parseBookmarkHtml(content);
          if (parsed.length > 0) {
            setParsedBookmarks(parsed);
          } else {
            setStatusMessage({ type: 'error', text: 'No bookmarks could be found in the provided HTML file.' });
          }
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: 'Failed to read bookmark file. Please check format.' });
      }
    };

    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedBookmarks.length === 0) return;
    setImporting(true);
    setStatusMessage(null);
    try {
      await websiteService.importBookmarks(parsedBookmarks);
      setStatusMessage({
        type: 'success',
        text: `Successfully imported ${parsedBookmarks.length} bookmarks into your workspace!`,
      });
      setParsedBookmarks([]);
      setFileName('');
      setTimeout(() => {
        onImportComplete();
        onClose();
      }, 1200);
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Import encountered an issue. Please try again.' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base">
                Bookmarks Import & Export
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Migrate bookmarks between Chrome, Edge, Firefox, and your Workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-[#DCE9E1] dark:border-[#20372B] px-5 pt-3 gap-6">
          <button
            onClick={() => {
              setActiveTab('IMPORT');
              setStatusMessage(null);
            }}
            className={clsx(
              'pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors',
              activeTab === 'IMPORT'
                ? 'border-[#5FBF8F] text-[#17211B] dark:text-[#EAF7EF]'
                : 'border-transparent text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
            )}
          >
            <Upload className="w-4 h-4 text-[#5FBF8F]" />
            Import Bookmarks
          </button>
          <button
            onClick={() => {
              setActiveTab('EXPORT');
              setStatusMessage(null);
            }}
            className={clsx(
              'pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors',
              activeTab === 'EXPORT'
                ? 'border-[#5FBF8F] text-[#17211B] dark:text-[#EAF7EF]'
                : 'border-transparent text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
            )}
          >
            <Download className="w-4 h-4 text-[#5FBF8F]" />
            Export & Backup
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {statusMessage && (
            <div
              className={clsx(
                'p-3 rounded-xl text-xs flex items-center gap-2.5',
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
              )}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {activeTab === 'IMPORT' ? (
            <div className="space-y-4">
              {/* File Upload Drop Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] rounded-2xl p-6 text-center cursor-pointer bg-[#F3FBF7] dark:bg-[#13261C]/50 transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".html,.htm,.json"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#5FBF8F]/10 text-[#5FBF8F] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                  {fileName || 'Choose a bookmark HTML or JSON file'}
                </h4>
                <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] mt-1">
                  Supports Google Chrome, Edge, Firefox, Safari exported HTML bookmarks
                </p>
              </div>

              {/* Parsed Bookmark Preview List */}
              {parsedBookmarks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                      Found {parsedBookmarks.length} Bookmarks to Import:
                    </span>
                    <button
                      onClick={() => setParsedBookmarks([])}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B]">
                    {parsedBookmarks.slice(0, 30).map((b, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs py-1 px-2 rounded-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B]"
                      >
                        <Globe className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        <span className="font-medium text-[#17211B] dark:text-[#EAF7EF] truncate flex-1">
                          {b.name}
                        </span>
                        <span className="text-[10px] text-[#8A9890] dark:text-[#6F8A7A] truncate max-w-[120px]">
                          {b.url}
                        </span>
                      </div>
                    ))}
                    {parsedBookmarks.length > 30 && (
                      <p className="text-[11px] text-center text-[#8A9890] dark:text-[#6F8A7A] py-1">
                        + {parsedBookmarks.length - 30} more bookmarks ready
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Export all {websites.length} saved bookmarks to easily backup or import directly into your web browser.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => websiteService.exportBookmarksAsHtml(websites)}
                  className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] text-left transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                        Browser HTML Format
                      </h4>
                      <p className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A]">
                        For Chrome, Firefox, Brave, Safari, Edge
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#5FBF8F] group-hover:underline flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Download HTML (.html)
                  </span>
                </button>

                <button
                  onClick={() => websiteService.exportBookmarksAsJson(websites)}
                  className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] hover:border-[#5FBF8F] text-left transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#17211B] dark:text-[#EAF7EF]">
                        JSON Workspace Backup
                      </h4>
                      <p className="text-[11px] text-[#8A9890] dark:text-[#6F8A7A]">
                        Full metadata, tags & visit analytics
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-purple-400 group-hover:underline flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" /> Download JSON (.json)
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#DCE9E1] dark:border-[#20372B] flex items-center justify-end gap-3 bg-white dark:bg-[#0E1C15]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C]"
          >
            Close
          </button>
          {activeTab === 'IMPORT' && (
            <button
              type="button"
              disabled={parsedBookmarks.length === 0 || importing}
              onClick={handleConfirmImport}
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center gap-2"
            >
              {importing ? (
                <>Importing...</>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Import {parsedBookmarks.length > 0 ? `${parsedBookmarks.length} Bookmarks` : 'Bookmarks'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
