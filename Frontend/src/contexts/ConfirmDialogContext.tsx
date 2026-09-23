import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions | string) => {
    const parsedOptions: ConfirmOptions =
      typeof opts === 'string'
        ? {
            title: 'Confirm Action',
            message: opts,
            confirmText: 'Confirm',
            variant: 'danger',
          }
        : {
            title: opts.title || 'Confirm Action',
            confirmText: opts.confirmText || 'Confirm',
            cancelText: opts.cancelText || 'Cancel',
            variant: opts.variant || 'danger',
            ...opts,
          };

    setOptions(parsedOptions);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  // Keyboard accessibility: Escape to cancel, Enter to confirm
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const variant = options.variant || 'danger';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#0E1C15] border border-[#DCE9E1] dark:border-[#20372B] rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl flex-shrink-0 ${
                    variant === 'danger'
                      ? 'bg-red-500/10 text-red-500 dark:bg-red-500/20 dark:text-red-400'
                      : variant === 'warning'
                      ? 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-400'
                  }`}
                >
                  {variant === 'danger' ? (
                    <Trash2 className="w-5 h-5" />
                  ) : variant === 'warning' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-[#17211B] dark:text-[#EAF7EF] text-base leading-tight">
                    {options.title || 'Are you sure?'}
                  </h3>
                  <span className="text-xs text-[#66736B] dark:text-[#7A9385] font-medium">
                    This action cannot be undone
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 text-[#66736B] dark:text-[#9BB5A5] hover:text-[#17211B] dark:hover:text-[#EAF7EF] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Body */}
            <div className="space-y-2 text-sm text-[#3D4D43] dark:text-[#C5D9CC] leading-relaxed">
              <p className="font-medium whitespace-pre-line">{options.message}</p>
              {options.description && (
                <div className="p-3 text-xs rounded-xl bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 leading-normal">
                  {options.description}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#DCE9E1] dark:border-[#20372B]">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-[#4D5E53] dark:text-[#9BB5A5] hover:bg-[#E8F7EF] dark:hover:bg-[#13261C] hover:text-[#17211B] dark:hover:text-[#EAF7EF] rounded-xl border border-[#DCE9E1] dark:border-[#20372B] transition-colors"
              >
                {options.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 ${
                  variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                    : variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                }`}
              >
                {options.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmDialogProvider');
  }
  return context.confirm;
};
