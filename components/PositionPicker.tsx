"use client";

import type { Posicao } from "@/types";

interface PositionPickerProps {
  value: Posicao | null;
  onChange: (p: Posicao) => void;
}

export function PositionPicker({ value, onChange }: PositionPickerProps) {
  return (
    <div className="card animate-slide-up">
      <label className="label">2. Posição da Federação</label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("A_FAVOR")}
          aria-pressed={value === "A_FAVOR"}
          className={`rounded-xl border-2 p-4 transition-all flex flex-col items-center gap-2 ${
            value === "A_FAVOR"
              ? "border-green-600 bg-green-50 ring-2 ring-green-600/20"
              : "border-slate-200 bg-white hover:border-green-400 hover:bg-green-50/50"
          }`}
        >
          <svg
            className={`h-7 w-7 ${
              value === "A_FAVOR" ? "text-green-600" : "text-slate-400"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7" />
          </svg>
          <span
            className={`font-bold text-sm ${
              value === "A_FAVOR" ? "text-green-800" : "text-slate-700"
            }`}
          >
            A FAVOR
          </span>
          <span className="text-[11px] text-slate-500 text-center leading-tight">
            Apoiar a matéria
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChange("CONTRA")}
          aria-pressed={value === "CONTRA"}
          className={`rounded-xl border-2 p-4 transition-all flex flex-col items-center gap-2 ${
            value === "CONTRA"
              ? "border-red-600 bg-red-50 ring-2 ring-red-600/20"
              : "border-slate-200 bg-white hover:border-red-400 hover:bg-red-50/50"
          }`}
        >
          <svg
            className={`h-7 w-7 ${
              value === "CONTRA" ? "text-red-600" : "text-slate-400"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H17" />
          </svg>
          <span
            className={`font-bold text-sm ${
              value === "CONTRA" ? "text-red-800" : "text-slate-700"
            }`}
          >
            CONTRA
          </span>
          <span className="text-[11px] text-slate-500 text-center leading-tight">
            Se opor à matéria
          </span>
        </button>
      </div>
    </div>
  );
}
