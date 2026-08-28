import React, {createContext, useContext, useState, useCallback, useCallback as useReactCallback} from 'react';
import styles from './styles.module.css';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'achievement' | 'xp';
  message: string;
  icon?: string;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

/**
 * Toast notification system for gamification feedback.
 * Shows achievement unlocks, XP gains, streak updates, etc.
 */
export function ToastProvider({children, maxToasts = 3}: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useReactCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast = {...toast, id};

    setToasts((prev) => {
      const updated = [newToast, ...prev];
      // Keep only maxToasts
      return updated.slice(0, maxToasts);
    });

    // Auto-remove after duration
    const duration = toast.duration || 4000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [maxToasts]);

  const removeToast = useReactCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{addToast, removeToast}}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({toast, onRemove}: ToastItemProps): React.JSX.Element {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
    achievement: '🏆',
    xp: '⭐',
  };

  return (
    <div
      className={`${styles.toast} ${styles[`toast-${toast.type}`]} ${styles.toastEnter}`}
      onClick={() => onRemove(toast.id)}>
      <span className={styles.toastIcon}>
        {toast.icon || icons[toast.type]}
      </span>
      <span className={styles.toastMessage}>{toast.message}</span>
      <button
        type="button"
        className={styles.toastClose}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(toast.id);
        }}>
        ×
      </button>
    </div>
  );
}
