"use client";

import type { Destaque } from "@/types";

interface DestaqueSelectorProps {
  destaques: Destaque[];
  selectedId: number | null;
  onChange: (id: number | null) => void;
  carregando?: boolean;
}

export function DestaqueSelector({
  destaques,
  selectedId,
  onChange,
  carregando = false,
}: DestaqueSelectorProps) {
  if (carregando) {
    return (
      <div className="card animate-slide-up">
        <label className="label">Destaques disponíveis</label>
        <div className="text-sm text-slate-500 py-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-psdb-blue border-t-transparent" />
          </div>
          Buscando destaques...
        </div>
      </div>
    );
  }

  if (destaques.length === 0) {
    return null;
  }

  return (
    <div className="card animate-slide-up">
      <label className="label">Destaques disponíveis</label>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {destaques.map((destaque) => {
          const selecionado = selectedId === destaque.id;
          return (
            <button
              key={destaque.id}
              type="button"
              onClick={() => {
                if (selecionado) {
                  onChange(null);
                } else {
                  onChange(destaque.id);
                }
              }}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                selecionado
                  ? "border-psdb-blue bg-psdb-lightblue ring-2 ring-psdb-blue/30"
                  : "border-slate-200 bg-white hover:border-psdb-blue/40 hover:bg-slate-50"
              }`}
              aria-pressed={selecionado}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-psdb-darkblue text-sm">
                  {destaque.identificador}
                </span>
                {selecionado && (
                  <span className="chip-blue text-[10px]">Selecionado</span>
                )}
              </div>
              {destaque.ementa && (
                <p className="text-xs text-slate-700 leading-snug line-clamp-2">
                  {destaque.ementa}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
