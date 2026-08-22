'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import Tick from '/public/tick.png';
import Cross from '/public/cross.png';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  isVisible: boolean;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, isVisible: false }]);

    // Trigger fade-in after slight delay
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, isVisible: true } : toast
        )
      );
    }, 10); // small delay to allow transition

    // Trigger fade-out before removal
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((toast) =>
          toast.id === id ? { ...toast, isVisible: false } : toast
        )
      );
    }, 2800); // start hiding before removal

    // Finally remove from state
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const removeToast = (id: number) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, isVisible: false } : toast
      )
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 400); // allow animation time
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${toast.type === 'success' ? styles.success : styles.error} ${
              toast.isVisible ? styles.visible : styles.hidden
            }`}
          >
            <div className={styles.icon}>
              <Image
                src={toast.type === 'success' ? Tick : Cross}
                alt={toast.type}
                width={24}
                height={24}
              />
            </div>
            <div className={styles.content}>
              <strong>{toast.type === 'success' ? 'Success' : 'Error'}</strong>
              <span>{toast.message}</span>
            </div>
            <button className={styles.closeBtn} onClick={() => removeToast(toast.id)}>
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
