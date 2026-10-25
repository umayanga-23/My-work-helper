import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Mail,
  Phone,
  MessageSquare,
  Clock,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { authService, ClientInquiry } from '../../services/authService';

export const ClientInquiriesTab: React.FC = () => {
  const [inquiries, setInquiries] = useState<ClientInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const data = await authService.getInquiries();
      setInquiries(data || []);
    } catch (err) {
      console.error('Failed to load client inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const updated = await authService.updateInquiryStatus(id, newStatus);
      setInquiries((prev) => prev.map((item) => (item.id === id ? updated : item)));
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const newCount = inquiries.filter((i) => i.status === 'NEW').length;
  const contactedCount = inquiries.filter((i) => i.status === 'CONTACTED').length;
  const completedCount = inquiries.filter((i) => i.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] block">Total Inquiries</span>
            <span className="text-2xl font-extrabold text-[#17211B] dark:text-[#EAF7EF]">{inquiries.length}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] block">New Requests</span>
            <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{newCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] block">Contacted</span>
            <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">{contactedCount}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] block">Completed / Sold</span>
            <span className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Inquiries Table Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#17211B] dark:text-[#EAF7EF] text-base">
              Client Customization & Sales Leads
            </h3>
            <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
              Inquiries submitted directly through the web application by demo visitors
            </p>
          </div>

          <button
            onClick={fetchInquiries}
            disabled={loading}
            className="p-2 rounded-xl bg-[#F3FBF7] dark:bg-[#13261C] hover:bg-[#E8F7EF] border border-[#DCE9E1] dark:border-[#20372B] text-[#237A57] dark:text-[#6DD6A0] transition-colors cursor-pointer"
            title="Refresh Inquiries"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#DCE9E1] dark:border-[#20372B] text-[#8A9890] dark:text-[#6F8A7A] uppercase text-[10px] tracking-wider font-bold">
                <th className="py-3 px-3">Client Name</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3">Requirement</th>
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE9E1]/50 dark:divide-[#20372B]/50">
              {inquiries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#8A9890] dark:text-[#6F8A7A]">
                    {loading ? 'Loading inquiries...' : 'No client inquiries received yet.'}
                  </td>
                </tr>
              ) : (
                inquiries.map((inq) => {
                  const isEmail = inq.emailOrPhone.includes('@');
                  const isPhone = !isEmail && /\d/.test(inq.emailOrPhone);
                  const cleanPhone = inq.emailOrPhone.replace(/[^0-9]/g, '');

                  return (
                    <tr key={inq.id} className="hover:bg-[#F3FBF7]/50 dark:hover:bg-[#13261C]/50 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-[#17211B] dark:text-[#EAF7EF]">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center">
                            {inq.visitorName[0].toUpperCase()}
                          </div>
                          <span>{inq.visitorName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        {isEmail ? (
                          <a
                            href={`mailto:${inq.emailOrPhone}`}
                            className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{inq.emailOrPhone}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : isPhone ? (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-teal-600 dark:text-teal-400 hover:underline"
                            title="Chat on WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{inq.emailOrPhone}</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-[#66736B] dark:text-[#9BB5A5]">{inq.emailOrPhone}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 max-w-xs text-[#17211B] dark:text-[#EAF7EF] leading-relaxed">
                        <p className="line-clamp-2">{inq.requirement}</p>
                      </td>

                      <td className="py-3.5 px-3 text-[#66736B] dark:text-[#9BB5A5] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#8A9890]" />
                          <span>{new Date(inq.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <select
                          value={inq.status}
                          disabled={updatingId === inq.id}
                          onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                          className={`text-[11px] font-bold py-1 px-2.5 rounded-xl border focus:outline-none transition-all cursor-pointer ${
                            inq.status === 'NEW'
                              ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                              : inq.status === 'CONTACTED'
                              ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                              : inq.status === 'IN_PROGRESS'
                              ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                          }`}
                        >
                          <option value="NEW">NEW REQUEST</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="COMPLETED">COMPLETED / SOLD</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
