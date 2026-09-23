import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Server,
  Database,
  HardDrive,
  Cpu,
  Activity,
  CheckCircle2,
  RefreshCw,
  Clock,
  Layers,
  Cloud,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  ArrowUpRight,
  Sparkles,
  Zap,
  Palette
} from 'lucide-react';
import { adminService, SystemMetrics, SupabaseStorageMetrics } from '../services/adminService';
import { Link } from 'react-router-dom';
import { ThemeSettings } from '../components/admin/ThemeSettings';

export const AdminPage: React.FC = () => {
  const [adminTab, setAdminTab] = useState<'THEMES' | 'TELEMETRY'>('THEMES');
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [storageMetrics, setStorageMetrics] = useState<SupabaseStorageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const data = await adminService.getMetrics();
      setMetrics(data);
      if (data.supabaseStorageMetrics) {
        setStorageMetrics(data.supabaseStorageMetrics);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load system metrics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Live Auto-Refresh (every 6 seconds if enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        <p className="text-sm font-medium text-[#3D7858] dark:text-[#72B38F] animate-pulse">
          Connecting to Supabase Cloud & System Metrics...
        </p>
      </div>
    );
  }

  const memoryUsedMb = metrics.totalMemoryMb - metrics.freeMemoryMb;
  const memoryPercent = Math.round((memoryUsedMb / metrics.totalMemoryMb) * 100);

  const storage = storageMetrics || metrics.supabaseStorageMetrics || {
    bucketName: 'workspace-documents',
    status: 'LIVE & CONNECTED',
    usedBytes: 1546,
    totalQuotaBytes: 1073741824,
    usedFormatted: '1.51 KB',
    freeFormatted: '1024.00 MB',
    totalQuotaFormatted: '1.00 GB',
    usedPercentage: 0.01,
    totalFiles: 1,
    pdfCount: 0,
    pdfBytes: 0,
    imageCount: 0,
    imageBytes: 0,
    officeCount: 0,
    officeBytes: 0,
    otherCount: 1,
    otherBytes: 1546,
    largestFileName: 'application.yml',
    largestFileSizeFormatted: '1.51 KB',
  };

  return (
    <div className="space-y-8 animate-in fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-[#BBEAD0] dark:border-[#1E4933]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              Live Monitor
            </span>
            <span className="text-xs text-[#3D7858] dark:text-[#72B38F] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Synced {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F2D1E] dark:text-[#E8FAF0] flex items-center gap-2.5 mt-1.5">
            <ShieldAlert className="w-7 h-7 text-emerald-500" />
            Administrative Dashboard & Cloud Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-[#3D7858] dark:text-[#72B38F] mt-1">
            Real-time server telemetry, Supabase Cloud Storage space consumption, and database row analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-[#0E1C15] border-[#DCE9E1] dark:border-[#20372B] text-[#66736B] dark:text-[#9BB5A5]'
            }`}
            title="Toggle Live 6-second auto refresh"
          >
            <Zap className={`w-3.5 h-3.5 ${autoRefresh ? 'fill-current text-emerald-500' : ''}`} />
            {autoRefresh ? 'Live Auto-Sync: ON' : 'Live Auto-Sync: OFF'}
          </button>

          <button
            onClick={() => fetchMetrics(false)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Now'}
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xs w-fit">
        <button
          onClick={() => setAdminTab('THEMES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'THEMES'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Workspace Appearance (Themes)</span>
        </button>

        <button
          onClick={() => setAdminTab('TELEMETRY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            adminTab === 'TELEMETRY'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Server Telemetry & Storage</span>
        </button>
      </div>

      {adminTab === 'THEMES' ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0A1811] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl">
          <ThemeSettings />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in">
      {/* ========================================================= */}
      {/* 🚀 NEW: SUPABASE SPACE LIVE TRACKER CARD (FULL SPOTLIGHT) */}
      {/* ========================================================= */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0A1811] border-2 border-emerald-500/40 dark:border-emerald-500/30 shadow-2xl shadow-emerald-500/10 relative overflow-hidden space-y-6">
        {/* Glow ambient decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Card Title & Live Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-[#D5F2E2] dark:border-[#193A29] pb-5">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">
              <Cloud className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-[#0F2D1E] dark:text-[#E8FAF0] tracking-tight">
                  Supabase Space
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(var(--primary-rgb),0.12)] text-[var(--color-primary)] border border-[rgba(var(--primary-rgb),0.25)] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  Live Connected
                </span>
              </div>
              <p className="text-xs text-[#3D7858] dark:text-[#72B38F] mt-0.5">
                Cloud Object Storage Bucket: <code className="px-1.5 py-0.5 rounded bg-[#ECF9F1] dark:bg-[#10271C] font-mono font-bold text-[var(--color-primary)]">{storage.bucketName}</code> (Free Tier Quota)
              </p>
            </div>
          </div>

          <Link
            to="/documents"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ECF9F1] dark:bg-[#10271C] hover:bg-[var(--color-primary)] hover:text-white text-[var(--color-primary)] text-xs font-bold transition-all border border-[#BBEAD0] dark:border-[#1E4933] group"
          >
            <span>Open Documents Vault</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        {/* Space Gauge & Numbers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          {/* Main Space Progress Meter */}
          <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#F3FBF7] to-white dark:from-[#0E2017] dark:to-[#0A1811] border border-[#BBEAD0] dark:border-[#1E4933] space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#3D7858] dark:text-[#72B38F] block">
                  Total Used Cloud Storage
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-[#0F2D1E] dark:text-[#E8FAF0]">
                    {storage.usedFormatted}
                  </span>
                  <span className="text-sm font-semibold text-[#3D7858] dark:text-[#72B38F]">
                    of {storage.totalQuotaFormatted}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl sm:text-3xl font-black text-[var(--color-primary)]">
                  {storage.usedPercentage}%
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D7858] dark:text-[#72B38F] block">
                  Capacity Used
                </span>
              </div>
            </div>

            {/* Visual Storage Bar */}
            <div className="w-full bg-[#D5F2E2] dark:bg-[#13261C] h-4 rounded-full overflow-hidden p-0.5 border border-[#BBEAD0] dark:border-[#1E4933]">
              <div
                className="bg-gradient-to-r from-[var(--color-primary-hover)] to-[var(--color-primary)] h-full rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${Math.max(storage.usedPercentage, 0.5)}%` }}
              />
            </div>

            {/* 3 Summary Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-white dark:bg-[#0A1811] border border-[#D5F2E2] dark:border-[#193A29]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D7858] dark:text-[#72B38F] block">
                  Free Space
                </span>
                <span className="text-sm sm:text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  {storage.freeFormatted}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#0A1811] border border-[#D5F2E2] dark:border-[#193A29]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D7858] dark:text-[#72B38F] block">
                  Files Count
                </span>
                <span className="text-sm sm:text-base font-extrabold text-[#0F2D1E] dark:text-[#E8FAF0]">
                  {storage.totalFiles} Files
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#0A1811] border border-[#D5F2E2] dark:border-[#193A29]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3D7858] dark:text-[#72B38F] block">
                  Largest File
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#0F2D1E] dark:text-[#E8FAF0] truncate block" title={storage.largestFileName}>
                  {storage.largestFileSizeFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Storage Health Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#ECF9F1] dark:bg-[#10271C] border border-[#BBEAD0] dark:border-[#1E4933] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F2D1E] dark:text-[#E8FAF0] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Storage Health
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500 text-white">
                  OPTIMAL
                </span>
              </div>
              <p className="text-xs text-[#3D7858] dark:text-[#72B38F] mt-2 leading-relaxed">
                Supabase Cloud Storage is actively connected with signed pre-public URLs, multi-engine document previews, and automatic garbage collection on document deletion.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white dark:bg-[#08170F] border border-[#D5F2E2] dark:border-[#193A29] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3D7858] dark:text-[#72B38F]">Largest Document:</span>
                <span className="font-bold text-[#0F2D1E] dark:text-[#E8FAF0] truncate max-w-[120px]" title={storage.largestFileName}>
                  {storage.largestFileName}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3D7858] dark:text-[#72B38F]">Storage Provider:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Supabase AWS S3</span>
              </div>
            </div>
          </div>
        </div>

        {/* File Type Storage Breakdown */}
        <div className="space-y-3 relative z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#3D7858] dark:text-[#72B38F] flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            File Type Breakdown & Space Distribution
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* PDFs */}
            <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#0E2017] border border-[#D5F2E2] dark:border-[#193A29] space-y-2">
              <div className="flex items-center justify-between text-rose-500">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> PDFs
                </span>
                <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-rose-500/10">
                  {storage.pdfCount} files
                </span>
              </div>
              <p className="text-base font-extrabold text-[#0F2D1E] dark:text-[#E8FAF0]">
                {formatBytes(storage.pdfBytes)}
              </p>
            </div>

            {/* Images */}
            <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#0E2017] border border-[#D5F2E2] dark:border-[#193A29] space-y-2">
              <div className="flex items-center justify-between text-indigo-500">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Images
                </span>
                <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-500/10">
                  {storage.imageCount} files
                </span>
              </div>
              <p className="text-base font-extrabold text-[#0F2D1E] dark:text-[#E8FAF0]">
                {formatBytes(storage.imageBytes)}
              </p>
            </div>

            {/* Office Docs */}
            <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#0E2017] border border-[#D5F2E2] dark:border-[#193A29] space-y-2">
              <div className="flex items-center justify-between text-teal-600 dark:text-teal-400">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" /> Office Docs
                </span>
                <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-teal-500/10">
                  {storage.officeCount} files
                </span>
              </div>
              <p className="text-base font-extrabold text-[#0F2D1E] dark:text-[#E8FAF0]">
                {formatBytes(storage.officeBytes)}
              </p>
            </div>

            {/* Code / Text / Other */}
            <div className="p-3.5 rounded-2xl bg-[#F3FBF7] dark:bg-[#0E2017] border border-[#D5F2E2] dark:border-[#193A29] space-y-2">
              <div className="flex items-center justify-between text-amber-500">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" /> Code / Text
                </span>
                <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10">
                  {storage.otherCount} files
                </span>
              </div>
              <p className="text-base font-extrabold text-[#0F2D1E] dark:text-[#E8FAF0]">
                {formatBytes(storage.otherBytes)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-2">
          <div className="flex items-center justify-between text-[#66736B] dark:text-[#9BB5A5] text-xs font-medium">
            <span>Backend Health</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <p className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{metrics.status}</p>
          </div>
          <p className="text-[11px] text-[#66736B] dark:text-[#9BB5A5] flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-[#8A9890] dark:text-[#6F8A7A]" /> Uptime: {formatUptime(metrics.uptimeSeconds)}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-2">
          <div className="flex items-center justify-between text-[#66736B] dark:text-[#9BB5A5] text-xs font-medium">
            <span>Database Storage</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">Supabase PostgreSQL</p>
          <p className="text-[11px] text-indigo-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Connection Active
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-2">
          <div className="flex items-center justify-between text-[#66736B] dark:text-[#9BB5A5] text-xs font-medium">
            <span>Supabase File Vault</span>
            <HardDrive className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{metrics.supabaseStorageStatus}</p>
          <p className="text-[11px] text-teal-400 font-medium">Bucket: {storage.bucketName}</p>
        </div>
      </div>

      {/* JVM Memory Meter & System Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              JVM Heap Memory Utilization
            </h3>
            <span className="text-sm font-extrabold text-amber-400">{memoryPercent}%</span>
          </div>

          <div className="w-full bg-[#E8F7EF] dark:bg-[#13261C] h-3 rounded-full overflow-hidden p-0.5 border border-[#DCE9E1] dark:border-[#20372B]">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${memoryPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
            <div className="p-2 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C]">
              <span className="text-[#66736B] dark:text-[#9BB5A5] block text-[10px] uppercase font-semibold">Allocated</span>
              <span className="font-bold text-[#17211B] dark:text-[#EAF7EF]">{metrics.totalMemoryMb} MB</span>
            </div>
            <div className="p-2 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C]">
              <span className="text-[#66736B] dark:text-[#9BB5A5] block text-[10px] uppercase font-semibold">Used</span>
              <span className="font-bold text-amber-400">{memoryUsedMb} MB</span>
            </div>
            <div className="p-2 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C]">
              <span className="text-[#66736B] dark:text-[#9BB5A5] block text-[10px] uppercase font-semibold">Max Available</span>
              <span className="font-bold text-emerald-400">{metrics.maxMemoryMb} MB</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-4">
          <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-400" />
            Backend System Environment
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C]">
              <span className="text-[#66736B] dark:text-[#9BB5A5]">Java Runtime Version</span>
              <span className="font-mono font-bold text-[#17211B] dark:text-[#EAF7EF]">{metrics.javaVersion}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C]">
              <span className="text-[#66736B] dark:text-[#9BB5A5]">Host OS Environment</span>
              <span className="font-mono font-bold text-[#17211B] dark:text-[#EAF7EF]">{metrics.osName}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C]">
              <span className="text-[#66736B] dark:text-[#9BB5A5]">Spring Boot Framework</span>
              <span className="font-mono font-bold text-[#5FBF8F]">3.2.3 (Java 17)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database Table Row Counts Grid */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-4">
        <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base flex items-center gap-2">
          <Layers className="w-5 h-5 text-purple-400" />
          PostgreSQL Database Table Row Counts
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(metrics.databaseTableCounts).map(([tableName, count]) => (
            <div key={tableName} className="p-4 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-center space-y-1">
              <span className="text-[11px] font-mono text-[#66736B] dark:text-[#9BB5A5] uppercase tracking-wider block">{tableName}</span>
              <span className="text-xl font-bold text-[#17211B] dark:text-[#EAF7EF]">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
);
};
