import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Briefcase
} from 'lucide-react';
import type { DriveLink } from '../../types';
import { getYouTubeVideoId } from '../../services/driveService';
import { BrandIcon } from './BrandIcons';
import { clsx } from 'clsx';

interface ResourcePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource?: DriveLink | null;
}

export const ResourcePreviewModal: React.FC<ResourcePreviewModalProps> = ({
  isOpen,
  onClose,
  resource,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!isOpen || !resource) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(resource.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const youtubeId = getYouTubeVideoId(resource.url);
  const type = resource.resourceType || 'WEB_RESOURCE';

  const getPlatformLabel = () => {
    switch (type) {
      case 'YOUTUBE': return 'YouTube Video Tutorial';
      case 'CHATGPT': return 'ChatGPT Conversation / Prompt';
      case 'LINKEDIN': return 'LinkedIn Post / Article';
      case 'FACEBOOK': return 'Facebook Resource';
      case 'GITHUB': return 'GitHub Repository';
      case 'GOOGLE_DOCS': return 'Google Document';
      case 'GOOGLE_SHEETS': return 'Google Spreadsheet';
      case 'GOOGLE_SLIDES': return 'Google Slide Deck';
      case 'GOOGLE_DRIVE': return 'Google Drive Folder';
      default: return 'Web & Project Resource';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#F3FBF7]/80 dark:bg-[#08120D]/80 backdrop-blur-md animate-in fade-in">
      <div
        className={clsx(
          'w-full bg-white dark:bg-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300',
          isFullScreen
            ? 'fixed inset-2 max-w-none max-h-none h-[calc(100vh-16px)]'
            : 'max-w-4xl max-h-[90vh] h-[650px]'
        )}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#D5F2E2] dark:border-[#193A29] flex items-center justify-between bg-[#ECF9F1] dark:bg-[#10271C]">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="p-2.5 rounded-2xl bg-white dark:bg-[#08170F] shadow-sm flex-shrink-0">
              <BrandIcon type={type} className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  {getPlatformLabel()}
                </span>
                {resource.projectName && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/15 text-teal-700 dark:text-teal-300 flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {resource.projectName}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-[#0F2D1E] dark:text-[#E8FAF0] text-sm sm:text-base truncate mt-0.5">
                {resource.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="p-2 text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] hover:bg-white dark:hover:bg-[#08170F] rounded-xl transition-colors"
              title="Copy Resource Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] hover:bg-white dark:hover:bg-[#08170F] rounded-xl transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] hover:bg-white dark:hover:bg-[#08170F] rounded-xl transition-colors hidden sm:block"
              title={isFullScreen ? 'Exit full screen' : 'Full screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-[#3D7858] dark:text-[#72B38F] hover:text-[#0F2D1E] dark:hover:text-[#E8FAF0] hover:bg-white dark:hover:bg-[#08170F] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 bg-[#F9FDFB] dark:bg-[#08120D] relative flex flex-col overflow-hidden">
          {type === 'YOUTUBE' && youtubeId ? (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title={resource.name}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (type === 'GOOGLE_DOCS' || type === 'GOOGLE_SHEETS' || type === 'GOOGLE_SLIDES') ? (
            <div className="w-full h-full flex flex-col">
              <iframe
                src={
                  resource.url.includes('/preview') || resource.url.includes('/edit')
                    ? resource.url
                    : `https://docs.google.com/viewer?url=${encodeURIComponent(resource.url)}&embedded=true`
                }
                title={resource.name}
                className="w-full h-full border-0 flex-1 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] shadow-lg">
                <BrandIcon type={type} className="w-8 h-8" />
              </div>

              <div className="max-w-md space-y-2">
                <h4 className="text-lg font-bold text-[#0F2D1E] dark:text-[#E8FAF0]">
                  {resource.name}
                </h4>
                {resource.description && (
                  <p className="text-xs text-[#3D7858] dark:text-[#72B38F] leading-relaxed">
                    {resource.description}
                  </p>
                )}
                {resource.tags && (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                    {resource.tags.split(',').map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                      >
                        #{t.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#0D2218] border border-[#D5F2E2] dark:border-[#193A29] max-w-lg w-full font-mono text-xs text-[#3D7858] dark:text-[#72B38F] truncate">
                {resource.url}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-[#0D2218] border border-[#BBEAD0] dark:border-[#1E4933] hover:border-[#48C78E] text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] flex items-center gap-2 shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                </button>

                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#2ECC71] to-[#27AE60] hover:from-[#27AE60] hover:to-[#219653] text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch External Resource</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
