import { createContext, useCallback, useContext, useRef, useState } from 'react';
import Alert from '../components/ui/alert/Alert';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  message: string;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

interface AlertModalOptions {
  variant?: ToastVariant;
  title: string;
  message: string;
  confirmText?: string;
}

interface UIFeedbackContextValue {
  notify: (message: string, variant?: ToastVariant, title?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alertModal: (options: AlertModalOptions) => Promise<void>;
}

const UIFeedbackContext = createContext<UIFeedbackContextValue | null>(null);

const defaultTitles: Record<ToastVariant, string> = {
  success: 'Éxito',
  error: 'Error',
  warning: 'Advertencia',
  info: 'Información',
};

const alertIconStyles: Record<ToastVariant, { ring: string; icon: string; button: string }> = {
  success: { ring: 'bg-emerald-50 dark:bg-emerald-500/15', icon: 'text-emerald-500', button: 'bg-emerald-500 hover:bg-emerald-600' },
  error: { ring: 'bg-red-50 dark:bg-red-500/15', icon: 'text-red-500', button: 'bg-red-500 hover:bg-red-600' },
  warning: { ring: 'bg-amber-50 dark:bg-amber-500/15', icon: 'text-amber-500', button: 'bg-amber-500 hover:bg-amber-600' },
  info: { ring: 'bg-brand-50 dark:bg-brand-500/15', icon: 'text-brand-500', button: 'bg-brand-500 hover:bg-brand-600' },
};

function AlertModalIcon({ variant, className }: { variant: ToastVariant; className?: string }) {
  if (variant === 'error') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  }
  if (variant === 'warning') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    );
  }
  if (variant === 'info') {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export function UIFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);
  const [alertModalState, setAlertModalState] = useState<(AlertModalOptions & { resolve: () => void }) | null>(null);
  const idRef = useRef(0);

  const notify = useCallback((message: string, variant: ToastVariant = 'info', title?: string) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, variant, title: title ?? defaultTitles[variant], message }]);
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

  const alertModal = useCallback((options: AlertModalOptions) => {
    return new Promise<void>((resolve) => {
      setAlertModalState({ ...options, resolve });
    });
  }, []);

  const closeAlertModal = () => {
    alertModalState?.resolve();
    setAlertModalState(null);
  };

  return (
    <UIFeedbackContext.Provider value={{ notify, confirm, alertModal }}>
      {children}

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-[100000] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
        {toasts.map((t) => (
          <div key={t.id} role="alert" className="animate-fade-in shadow-lg rounded-xl">
            <Alert variant={t.variant} title={t.title} message={t.message} />
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

      {/* Alert modal */}
      {alertModalState && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-400/50 backdrop-blur-sm p-4"
          onClick={closeAlertModal}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeAlertModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${alertIconStyles[alertModalState.variant ?? 'success'].ring}`}>
              <AlertModalIcon variant={alertModalState.variant ?? 'success'} className={`h-8 w-8 ${alertIconStyles[alertModalState.variant ?? 'success'].icon}`} />
            </div>

            <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{alertModalState.title}</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{alertModalState.message}</p>

            <button
              onClick={closeAlertModal}
              className={`mt-6 w-full rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-all ${alertIconStyles[alertModalState.variant ?? 'success'].button}`}
            >
              {alertModalState.confirmText ?? 'Entendido'}
            </button>
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
