import { createContext, useCallback, useContext, useRef, useState } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

interface UIFeedbackContextValue {
  notify: (message: string, variant?: ToastVariant) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const UIFeedbackContext = createContext<UIFeedbackContextValue | null>(null);

const toastStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400',
  error: 'border-red-500 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400',
  warning: 'border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400',
  info: 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/15 dark:text-brand-400',
};

export function UIFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const idRef = useRef(0);

  const notify = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const handleConfirmResult = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <UIFeedbackContext.Provider value={{ notify, confirm }}>
      {children}

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-[100000] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`rounded-xl border p-4 text-sm font-medium shadow-lg animate-in ${toastStyles[t.variant]}`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-400/50 backdrop-blur-sm p-4"
          onClick={() => handleConfirmResult(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {confirmState.title ?? 'Confirmar acción'}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{confirmState.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => handleConfirmResult(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {confirmState.cancelText ?? 'Cancelar'}
              </button>
              <button
                onClick={() => handleConfirmResult(true)}
                className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all ${
                  confirmState.variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand-500 hover:bg-brand-600'
                }`}
              >
                {confirmState.confirmText ?? 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UIFeedbackContext.Provider>
  );
}

export function useUIFeedback() {
  const ctx = useContext(UIFeedbackContext);
  if (!ctx) throw new Error('useUIFeedback must be used within UIFeedbackProvider');
  return ctx;
}
