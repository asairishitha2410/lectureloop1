"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: string;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  push: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, kind: ToastKind = "success") => {
      toastCounter += 1;
      const id = `toast-${Date.now()}-${toastCounter}`;
      setToasts((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const icons = {
    success: <CheckCircle2 className="w-4.5 h-4.5 text-success shrink-0" aria-hidden />,
    error: <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" aria-hidden />,
    info: <Info className="w-4.5 h-4.5 text-blue shrink-0" aria-hidden />,
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[80] flex flex-col gap-2.5 w-[min(92vw,380px)]"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5 shadow-lg shadow-navy/10 bg-white animate-fade-in-up",
              toast.kind === "success" && "border-emerald-200",
              toast.kind === "error" && "border-rose-200",
              toast.kind === "info" && "border-blue-200"
            )}
          >
            {icons[toast.kind]}
            <p className="text-sm text-slate-700 flex-1 leading-snug pt-0.5">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="p-1 -m-1 rounded-md text-slate-400 hover:text-navy hover:bg-slate-100 cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}