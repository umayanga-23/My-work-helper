import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  CheckSquare,
  Globe,
  FileText,
  FolderArchive,
  HardDrive,
  Briefcase,
  GraduationCap,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { GlobalSearchResult } from '../../types';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../../services/searchService';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchService.searchAll(query);
        setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const getIcon = (type: GlobalSearchResult['type']) => {
    switch (type) {
      case 'TASK': return <CheckSquare className="w-4 h-4 text-[#5FBF8F]" />;
      case 'WEBSITE': return <Globe className="w-4 h-4 text-[#5FBF8F]" />;
      case 'NOTE': return <FileText className="w-4 h-4 text-[#5FBF8F]" />;
      case 'DOCUMENT': return <FolderArchive className="w-4 h-4 text-[#5FBF8F]" />;
      case 'DRIVE_LINK': return <HardDrive className="w-4 h-4 text-[#5FBF8F]" />;
      case 'PROJECT': return <Briefcase className="w-4 h-4 text-[#5FBF8F]" />;
      case 'LEARNING': return <GraduationCap className="w-4 h-4 text-[#5FBF8F]" />;
      case 'IDEA': return <Lightbulb className="w-4 h-4 text-[#5FBF8F]" />;
      default: return <Search className="w-4 h-4 text-[#5FBF8F]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#08120D]/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#FFFFFF] dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-[#DCE9E1] dark:border-[#20372B] flex items-center gap-3">
          <Search className="w-5 h-5 text-[#8A9890]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search across AIU Workspace..."
            className="flex-1 bg-transparent text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] dark:placeholder-[#6F8A7A] text-sm outline-none"
          />
          {loading ? (
            <div className="w-4 h-4 rounded-full border-2 border-[#5FBF8F] border-t-transparent animate-spin" />
          ) : query && (
            <button onClick={() => setQuery('')} className="p-1 text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF]">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs px-2 py-1 bg-[#E8F7EF] dark:bg-[#13261C] text-[#237A57] dark:text-[#6DD6A0] rounded-md border border-[#DCE9E1] dark:border-[#20372B] cursor-pointer">
            Esc
          </button>
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {query && results.length === 0 && !loading && (
            <div className="p-8 text-center text-[#8A9890] text-sm">
              No matching workspace resources found for "{query}".
            </div>
          )}

          {!query && (
            <div className="p-6 text-center text-[#8A9890] text-xs">
              Search tasks, notes, websites, documents, projects, ideas, skills, and drive links.
            </div>
          )}

          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.url) navigate(item.url);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#F3FBF7] dark:bg-[#08120D] border border-[#DCE9E1] dark:border-[#20372B]">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#17211B] dark:text-[#EAF7EF] group-hover:text-[#237A57] dark:group-hover:text-[#6DD6A0] transition-colors">
                    {item.title}
                  </h4>
                  {item.description && (
                    <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] truncate max-w-md">{item.description}</p>
                  )}
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-[#237A57] dark:text-[#6DD6A0] uppercase tracking-wider bg-[#E8F7EF] dark:bg-[#13261C] px-2 py-1 rounded-md border border-[#DCE9E1] dark:border-[#20372B]">
                {item.type}
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
