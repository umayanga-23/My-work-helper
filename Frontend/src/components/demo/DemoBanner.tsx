import React, { useState } from 'react';
import { Sparkles, ShoppingBag, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CustomOrderModal } from './CustomOrderModal';

export const DemoBanner: React.FC = () => {
  const { isDemoMode, demoVisitorName, exitDemoMode } = useAuth();
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  if (!isDemoMode) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white text-xs px-4 py-2 flex items-center justify-between gap-3 shadow-sm select-none z-50">
        <div className="flex items-center gap-2 overflow-hidden truncate">
          <span className="flex items-center gap-1.5 font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse flex-shrink-0" />
            <span>Interactive Demo Mode</span>
          </span>
          <span className="opacity-60 hidden sm:inline">•</span>
          <span className="text-white/90 truncate hidden sm:inline">
            Exploring as <strong className="text-white">{demoVisitorName || 'Guest Visitor'}</strong> (Isolated Sandbox)
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setOrderModalOpen(true)}
            className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-[11px] backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-white/20"
          >
            <ShoppingBag className="w-3 h-3 text-amber-300" />
            <span>Request Custom Build</span>
          </button>

          <button
            onClick={exitDemoMode}
            className="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/40 text-white/90 hover:text-white font-medium text-[11px] transition-all flex items-center gap-1 cursor-pointer"
            title="Exit Demo and go to Sign In"
          >
            <LogOut className="w-3 h-3" />
            <span className="hidden md:inline">Sign In</span>
          </button>
        </div>
      </div>

      <CustomOrderModal isOpen={orderModalOpen} onClose={() => setOrderModalOpen(false)} />
    </>
  );
};
