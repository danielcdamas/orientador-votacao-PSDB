"use client";

import type { ApiResponse, Proposicao } from "@/types";
import { useMemo, useState } from "react";

interface PropSelectorProps {
  proposicoes: Proposicao[];
  selectedId: number | null;
  onChange: (p: Proposicao | null) => void;
  onRefresh?: () => void;
}

export function PropSelector({
  proposicoes,
  selectedId,
  onChange,
  onRefresh,
}: PropSelectorProps) {
  const [busca, setBusca] = useState("");
  const [modoBusca, setModoBusca] = useState<"pauta" | "manual">("pauta");
  const [resultadosBase, setResultadosBase] = useState<Proposicao[]>([]);
  const [buscandoBase, setBuscandoBase] = useState(false);
  const [erroBuscaBase, setErroBuscaBase] = useState<string | null>(null);
  const [avisoBuscaBase, setAvisoBuscaBase] = useState<string | null>(null);

  const filtradasPauta = useMemo(() => {
    if (!busca.trim()) return proposicoes;
    const termo = busca.toLowerCase().trim();
    return proposicoes.filter(
      (p) =>
        p.identificador.toLowerCase().includes(termo) ||
        p.ementa.toLowerCase().includes(termo)
    );
  }, [busca, proposicoes]);

  const listaExibida = modoBusca === "pauta" ? filtradasPauta : resultadosBase;
  const selecionada =
    proposicoes.find((p) => p.id === selectedId) ||
    resultadosBase.find((p) => p.id === selectedId) ||
    null;

  async function buscarNaBase() {
    const termo = busca.trim();
    if (termo.length < 2) {
      setAvisoBuscaBase("Digite ao menos 2 caracteres. Ex.: PL 1625/2026.");
      return;
    }

    setBuscandoBase(true);
    setErroBuscaBase(null);
    setAvisoBuscaBase(null);

    try {
      const res = await fetch(
        `/api/proposicoes/pauta?q=${encodeURIComponent(termo)}`,
        { cache: "no-store" }
      );
      const json: ApiResponse<Proposicao[]> = await res.json();
      if (!json.ok) {
        setErroBuscaBase(json.error || "Não foi possível buscar na base da Câmara.");
        setResultadosBase([]);
        return;
      }
      setResultadosBase(json.data || []);
      if (json.message) setAvisoBuscaBase(json.message);
    } catch (err: unknown) {
      setErroBuscaBase(
        err instanceof Error ? err.message : "Erro ao consultar a base da Câmara."
      );
      setResultadosBase([]);
    } finally {
      setBuscandoBase(false);
    }
  }

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <label className="label !mb-0">1. Proposição</label>
        {onRefresh && modoBusca === "pauta" && (
          <button
            type="button"
            onClick={onRefresh}
            className="btn-ghost text-xs"
            aria-label="Atualizar pauta"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Atualizar
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-3 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setModoBusca("pauta")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            modoBusca === "pauta"
              ? "bg-white text-psdb-darkblue shadow-sm"
              : "text-slate-600"
          }`}
        >
          Pauta do dia
        </button>
        <button
          type="button"
          onClick={() => setModoBusca("manual")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            modoBusca === "manual"
              ? "bg-white text-psdb-darkblue shadow-sm"
              : "text-slate-600"
          }`}
        >
          Buscar na Câmara
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          placeholder={
            modoBusca === "manual"
              ? "Ex.: PL 1625/2026, REQ 2973/2026..."
              : "Filtrar pauta por tipo, número/ano ou palavra-chave..."
          }
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (modoBusca === "manual" && e.key === "Enter") buscarNaBase();
          }}
          className="input-base"
          inputMode="search"
          aria-label="Buscar proposição"
        />
        {modoBusca === "manual" && (
          <button
            type="button"
            onClick={buscarNaBase}
            disabled={buscandoBase}
            className="btn-primary whitespace-nowrap"
          >
            {buscandoBase ? "Buscando..." : "Buscar"}
          </button>
        )}
      </div>

      {modoBusca === "manual" && (
        <div className="mb-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[12px] text-slate-700">
          Use esta busca quando um projeto entrar de última hora ou não aparecer na pauta carregada.
        </div>
      )}

      {erroBuscaBase && (
        <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-800">
          {erroBuscaBase}
        </div>
      )}

      {avisoBuscaBase && !erroBuscaBase && (
        <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900">
          {avisoBuscaBase}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto pr-1 -mr-1 space-y-2">
        {listaExibida.length === 0 && (
          <div className="text-sm text-slate-500 py-6 text-center">
            {modoBusca === "manual"
              ? "Digite uma proposição e clique em Buscar."
              : busca
                ? "Nenhuma proposição encontrada com este termo na pauta."
                : "Nenhuma proposição na pauta."}
          </div>
        )}

        {listaExibida.map((p) => {
          const ativa = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p)}
              className={`w-full text-left rounded-xl border p-3 transition-all ${
                ativa
                  ? "border-psdb-blue bg-psdb-lightblue ring-2 ring-psdb-blue/30"
                  : "border-slate-200 bg-white hover:border-psdb-blue/40 hover:bg-slate-50"
              }`}
              aria-pressed={ativa}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-psdb-darkblue text-sm">
                  {p.identificador}
                </span>
                {ativa && (
                  <span className="chip-blue text-[10px]">Selecionada</span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-snug line-clamp-3">
                {p.ementa}
              </p>
            </button>
          );
        })}
      </div>

      {selecionada && (
        <div className="mt-3 rounded-xl bg-psdb-lightblue/60 p-3 border border-psdb-blue/20">
          <div className="text-[10px] uppercase tracking-wider text-psdb-darkblue/70 font-semibold mb-1">
            Selecionada
          </div>
          <div className="text-sm font-bold text-psdb-darkblue mb-1">
            {selecionada.identificador}
          </div>
          <div className="text-xs text-slate-700 leading-snug">
            {selecionada.ementa}
          </div>
        </div>
      )}
    </div>
  );
}
