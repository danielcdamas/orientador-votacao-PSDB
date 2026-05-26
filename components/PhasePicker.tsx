"use client";

import type { Fase, OrientacaoDestaque, Posicao } from "@/types";
import { aplicarRegra, FASES_DISPONIVEIS } from "@/lib/regras";

interface PhasePickerProps {
  value: Fase | null;
  posicao: Posicao | null;
  onChange: (f: Fase) => void;
  identificadorDestaque: string;
  onChangeDestaque: (s: string) => void;
  orientacaoDestaque: OrientacaoDestaque | null;
  onChangeOrientacaoDestaque: (o: OrientacaoDestaque) => void;
}

export function PhasePicker({
  value,
  posicao,
  onChange,
  identificadorDestaque,
  onChangeDestaque,
  orientacaoDestaque,
  onChangeOrientacaoDestaque,
}: PhasePickerProps) {
  const mostraCampoDestaque =
    value === "DESTAQUE_TEXTO" || value === "DESTAQUE_EMENDA";

  return (
    <div className="card animate-slide-up">
      <label className="label">3. Fase da votação</label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {FASES_DISPONIVEIS.map((opt) => {
          const ativa = value === opt.value;

          let chip: React.ReactNode = null;
          if (posicao) {
            const r = aplicarRegra(posicao, opt.value);
            if (opt.value === "DESTAQUE_TEXTO" || opt.value === "DESTAQUE_EMENDA") {
              chip = <span className="chip-yellow text-[10px]">definir DTQ</span>;
            } else if (r.orientacao === "SIM") {
              chip = <span className="chip-green text-[10px]">SIM</span>;
            } else if (r.orientacao === "NAO") {
              chip = <span className="chip-red text-[10px]">NÃO</span>;
            } else {
              chip = (
                <span className="chip-yellow text-[10px]">análise técnica</span>
              );
            }
          }

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={ativa}
              className={`rounded-xl border p-3 text-left transition-all flex items-center justify-between gap-2 ${
                ativa
                  ? "border-psdb-blue bg-psdb-lightblue ring-2 ring-psdb-blue/30"
                  : "border-slate-200 bg-white hover:border-psdb-blue/40 hover:bg-slate-50"
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  ativa ? "text-psdb-darkblue" : "text-slate-800"
                }`}
              >
                {opt.label}
              </span>
              {chip}
            </button>
          );
        })}
      </div>

      {mostraCampoDestaque && (
        <div className="mt-4 animate-fade-in space-y-4">
          <div>
            <label className="label" htmlFor="dtq">
              Identificador do destaque{" "}
              <span className="text-slate-500 font-normal">(fallback manual)</span>
            </label>
            <input
              id="dtq"
              type="text"
              value={identificadorDestaque}
              onChange={(e) => onChangeDestaque(e.target.value)}
              placeholder="Ex.: DTQ 3 – NOVO"
              className="input-base"
              maxLength={120}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Use este campo se o destaque não aparecer automaticamente na lista da Câmara.
            </p>
          </div>

          <div>
            <label className="label">Orientação da Federação ao destaque</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onChangeOrientacaoDestaque("SIM")}
                aria-pressed={orientacaoDestaque === "SIM"}
                className={`rounded-xl border-2 p-3 transition-all text-center ${
                  orientacaoDestaque === "SIM"
                    ? "border-green-600 bg-green-50 ring-2 ring-green-600/20"
                    : "border-slate-200 bg-white hover:border-green-400 hover:bg-green-50/50"
                }`}
              >
                <span className="font-bold text-sm text-green-800">SIM</span>
                <span className="block text-[11px] text-slate-500">{value === "DESTAQUE_TEXTO" ? "ao texto" : "à emenda"}</span>
              </button>

              <button
                type="button"
                onClick={() => onChangeOrientacaoDestaque("NAO")}
                aria-pressed={orientacaoDestaque === "NAO"}
                className={`rounded-xl border-2 p-3 transition-all text-center ${
                  orientacaoDestaque === "NAO"
                    ? "border-red-600 bg-red-50 ring-2 ring-red-600/20"
                    : "border-slate-200 bg-white hover:border-red-400 hover:bg-red-50/50"
                }`}
              >
                <span className="font-bold text-sm text-red-800">NÃO</span>
                <span className="block text-[11px] text-slate-500">{value === "DESTAQUE_TEXTO" ? "ao texto" : "à emenda"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
