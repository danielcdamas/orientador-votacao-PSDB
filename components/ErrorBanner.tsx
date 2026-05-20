"use client";

interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ title, message, onRetry }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="rounded-2xl bg-red-50 border border-red-200 p-4 animate-fade-in"
    >
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-red-600 mt-0.5 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900">
            {title || "Algo deu errado"}
          </h3>
          <p className="text-sm text-red-800 mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Tentar de novo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card text-center animate-fade-in">
      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <svg
          className="h-6 w-6 text-slate-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M9 12h6M12 9v6" strokeLinecap="round" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-600 mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 btn-secondary"
        >
          Atualizar
        </button>
      )}
    </div>
  );
}
