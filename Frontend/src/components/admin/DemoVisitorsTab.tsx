import React, { useState, useEffect } from 'react';
import {
  Users,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { authService, DemoVisitor } from '../../services/authService';

export const DemoVisitorsTab: React.FC = () => {
  const [visitors, setVisitors] = useState<DemoVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchVisitors = async () => {
    setLoading(true);
    try {
      const data = await authService.getDemoVisitors();
      setVisitors(data || []);
    } catch (err) {
      console.error('Failed to load visitors telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const filtered = visitors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.country && v.country.toLowerCase().includes(search.toLowerCase())) ||
      (v.browser && v.browser.toLowerCase().includes(search.toLowerCase())) ||
      (v.os && v.os.toLowerCase().includes(search.toLowerCase()))
  );

  const totalVisitors = visitors.length;
  const mobileCount = visitors.filter((v) => v.deviceType === 'Mobile').length;
  const desktopCount = visitors.filter((v) => v.deviceType === 'Desktop').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] block">
              Total Demo Visitors
            </span>
            <span className="text-2xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">
              {totalVisitors}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Laptop className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] block">
              Desktop Users
            </span>
            <span className="text-2xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">
              {desktopCount}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] block">
              Mobile Users
            </span>
            <span className="text-2xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">
              {mobileCount}
            </span>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-extrabold text-[#17211B] dark:text-[#EAF7EF] text-base">
              Live Demo Lead Telemetry
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              {filtered.length} Recorded
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search visitors, location..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
              />
              <Search className="w-3.5 h-3.5 text-[#8A9890] absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={fetchVisitors}
              disabled={loading}
              className="p-2 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] hover:bg-[#E8F7EF] border border-[#DCE9E1] dark:border-[#20372B] text-[#237A57] dark:text-[#6DD6A0] transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Telemetry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE9E1] dark:border-[#20372B] text-[#8A9890] dark:text-[#6F8A7A] uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-3">Visitor Name</th>
                <th className="py-3 px-3">Device & OS</th>
                <th className="py-3 px-3">Browser</th>
                <th className="py-3 px-3">Location / Country</th>
                <th className="py-3 px-3">IP Address</th>
                <th className="py-3 px-3">Visit Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE9E1]/50 dark:divide-[#20372B]/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#8A9890] dark:text-[#6F8A7A]">
                    {loading ? 'Loading visitor telemetry...' : 'No demo visitors recorded yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-[#F3FBF7]/50 dark:hover:bg-[#13261C]/50 transition-colors">
                    <td className="py-3 px-3 font-bold text-[#17211B] dark:text-[#EAF7EF] flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-bold text-xs flex items-center justify-center">
                        {v.name[0].toUpperCase()}
                      </div>
                      <span>{v.name}</span>
                    </td>
                    <td className="py-3 px-3 text-[#66736B] dark:text-[#9BB5A5]">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        {v.deviceType === 'Mobile' ? (
                          <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                        ) : v.deviceType === 'Tablet' ? (
                          <Tablet className="w-3.5 h-3.5 text-blue-500" />
                        ) : (
                          <Laptop className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                        <span>{v.deviceType || 'Desktop'} ({v.os || 'OS'})</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#66736B] dark:text-[#9BB5A5] font-mono">
                      {v.browser || 'Unknown'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#17211B] dark:text-[#EAF7EF]">
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-teal-500" />
                        <span>{v.country || 'Global'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#8A9890] dark:text-[#6F8A7A]">
                      {v.ipAddress}
                    </td>
                    <td className="py-3 px-3 text-[#66736B] dark:text-[#9BB5A5] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#8A9890]" />
                      <span>{new Date(v.visitedAt).toLocaleString()}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
