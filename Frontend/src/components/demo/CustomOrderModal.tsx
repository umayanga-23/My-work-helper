import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  User,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomOrderModal: React.FC<CustomOrderModalProps> = ({ isOpen, onClose }) => {
  const { demoVisitorName } = useAuth();

  const [visitorName, setVisitorName] = useState(demoVisitorName || '');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [requirement, setRequirement] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !emailOrPhone.trim() || !requirement.trim()) {
      setError('Please fill in your name, contact details, and requirements.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await authService.submitInquiry({
        visitorName: visitorName.trim(),
        emailOrPhone: emailOrPhone.trim(),
        requirement: requirement.trim(),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setEmailOrPhone('');
    setRequirement('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08120D]/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-3xl shadow-2xl overflow-hidden transition-all duration-300">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-[#DCE9E1] dark:border-[#20372B] bg-gradient-to-r from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--color-primary)] text-white shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Request a Custom Workspace Build
              </h3>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5]">
                Get a customized personal or team productivity cloud tailored for you
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-xl text-[#8A9890] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-[#17211B] dark:text-[#EAF7EF]">
                Request Sent Successfully!
              </h4>
              <p className="text-xs text-[#66736B] dark:text-[#9BB5A5] max-w-sm mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-[#17211B] dark:text-[#EAF7EF]">{visitorName}</span>! Induwara has received your inquiry directly. He will get in touch with you shortly via {emailOrPhone}.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Return to Live Demo
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1.5">
                  Your Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                    required
                  />
                  <User className="w-4 h-4 text-[#8A9890] absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1.5">
                  Email Address or WhatsApp Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    placeholder="e.g. client@gmail.com or +94 77 123 4567"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                    required
                  />
                  <Mail className="w-4 h-4 text-[#8A9890] absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17211B] dark:text-[#EAF7EF] mb-1.5">
                  What customization or features do you need?
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="Describe what you want customized (e.g., custom modules, branding, university curriculum tracking, team task management)..."
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#F8FAF9] dark:bg-[#13261C] border border-[#DCE9E1] dark:border-[#20372B] text-[#17211B] dark:text-[#EAF7EF] placeholder-[#8A9890] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all resize-none"
                    required
                  />
                  <MessageSquare className="w-4 h-4 text-[#8A9890] absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-xs font-semibold text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit Inquiry to Induwara</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
