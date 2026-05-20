"use client";

export function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="card animate-fade-in" aria-busy="true" aria-live="polite">
      <SkeletonLine className="w-2/3 mb-3" />
      <SkeletonLine className="w-full mb-2" />
      <SkeletonLine className="w-5/6 mb-2" />
      <SkeletonLine className="w-1/2" />
    </div>
  );
}

export function Spinner({ label = "Carregando..." }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-2 text-sm text-slate-600"
      role="status"
      aria-live="polite"
    >
      <svg
        className="animate-spin h-4 w-4 text-psdb-blue"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          className="opacity-20"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-80"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
        />
      </svg>
      <span>{label}</span>
    </div>
  );
}
