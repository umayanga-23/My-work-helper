import React, { useState } from 'react';
import { Settings, User, Bot, Sparkles, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { aiService } from '../services/aiService';

import { ThemeSettings } from '../components/admin/ThemeSettings';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [capacityMinutes, setCapacityMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('aiu_daily_capacity_minutes');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 360;
  });

  const handleCapacityChange = (mins: number) => {
    setCapacityMinutes(mins);
    localStorage.setItem('aiu_daily_capacity_minutes', String(mins));
  };

  return (
    <div className="space-y-6 max-w-5xl animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
          <Settings className="w-6 h-6 text-[var(--color-primary)]" />
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-[#66736B] dark:text-[#9BB5A5]">Configure visual themes, appearance mode, and AI engine defaults.</p>
      </div>

      <div className="space-y-8">
        {/* Workspace Appearance (5 Themes + Mode Switcher) */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm">
          <ThemeSettings />
        </div>

        {/* AI Engine & Copilot Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-semibold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#5FBF8F]" />
                AI Assistant Engine (Google Gemini)
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Powering your Executive Morning Briefings, Strategic Task Breakdown, and Global Copilot.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-[rgba(var(--primary-rgb),0.12)] text-[var(--color-primary)] border border-[rgba(var(--primary-rgb),0.25)] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                Active • Gemini 3.5 Flash Lite
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF]">Model & Key Status</p>
                <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5]">
                  Connected to Google Gemini REST API with automated fallback brain.
                </p>
              </div>
              <button
                onClick={async () => {
                  setAiTesting(true);
                  setAiTestResult(null);
                  try {
                    const res = await aiService.testConnection();
                    setAiTestResult({ success: res.success, message: res.message });
                  } catch (err: any) {
                    setAiTestResult({ success: false, message: err.message || 'Connection failed' });
                  } finally {
                    setAiTesting(false);
                  }
                }}
                disabled={aiTesting}
                className="px-4 py-2 bg-gradient-to-r from-[var(--color-primary-hover)] to-[var(--color-primary)] hover:brightness-105 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {aiTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Test AI Connection
                  </>
                )}
              </button>
            </div>

            {aiTestResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  aiTestResult.success
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                }`}
              >
                {aiTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{aiTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Workload & Capacity Configuration */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-semibold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5FBF8F]" />
                Daily Workload & Focus Capacity
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Configure your target daily focus capacity for Today's Workload and execution indicators.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {Math.round(capacityMinutes / 60)} Hours / Day
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#17211B] dark:text-[#EAF7EF]">Planned Daily Workload Capacity</p>
              <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5]">
                Used by Today's Execution Engine to calculate Manageable (≤80%), Heavy (81–100%), and Overloaded (&gt;100%) states.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {[
                { label: '4h (Part-time)', mins: 240 },
                { label: '6h (Focus Day)', mins: 360 },
                { label: '8h (Full Day)', mins: 480 },
                { label: '10h (Extended)', mins: 600 },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  onClick={() => handleCapacityChange(opt.mins)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    capacityMinutes === opt.mins
                      ? 'bg-[#5FBF8F] text-[#0E1C15] font-bold shadow-sm'
                      : 'bg-white dark:bg-[#0E1C15] text-[#66736B] dark:text-[#9BB5A5] border border-[#DCE9E1] dark:border-[#20372B] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
                  }`}
                >
                  {opt.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Account Profile */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] space-y-4">
          <h3 className="text-base font-semibold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--color-primary)]" />
            Developer Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#17211B] dark:text-[#EAF7EF]">
            <div>
              <span className="text-xs text-[#66736B] dark:text-[#9BB5A5] block mb-1">Full Name</span>
              <p className="font-semibold text-[#17211B] dark:text-[#EAF7EF] bg-[#F3FBF7] dark:bg-[#13261C] p-2.5 rounded-xl border border-[#DCE9E1] dark:border-[#20372B]">{user?.fullName}</p>
            </div>
            <div>
              <span className="text-xs text-[#66736B] dark:text-[#9BB5A5] block mb-1">Email Address</span>
              <p className="font-semibold text-[#17211B] dark:text-[#EAF7EF] bg-[#F3FBF7] dark:bg-[#13261C] p-2.5 rounded-xl border border-[#DCE9E1] dark:border-[#20372B]">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
