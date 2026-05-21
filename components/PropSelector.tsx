"use client";

import type { Proposicao } from "@/types";
import { useCallback, useMemo, useState, useEffect } from "react";

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
  const [resultadosBusca, setResultadosBusca] = useState<Proposicao[]>([]);
  const [carregandoBusca, setCarregandoBusca] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);

  // Busca livre quando está no modo manual
  const fazerBuscaLivre = useCallback(
    async (termo: string) => {
      if (termo.trim().length < 2) {
        setResultadosBusca([]);
        setErroBusca(null);
        return;
      }

      setCarregandoBusca(true);
      setErroBusca(null);
      try {
        const res = await fetch(`/api/proposicoes/pauta?q=${encodeURIComponent(termo)}`);
        const json = await res.json();
        if (json.ok) {
          setResultadosBusca(json.data || []);
          if (json.message) {
            setErroBusca(json.message);
          }
        } else {
          setErroBusca(json.error || "Erro na busca");
          setResultadosBusca([]);
        }
      } catch (err) {
        setErroBusca(
          err instanceof Error ? err.message : "Erro ao buscar proposições"
        );
        setResultadosBusca([]);
      } finally {
        setCarregandoBusca(false);
      }
    },
    []
  );

  // Debounce da busca (espera 500ms após parar de digitar)
  useEffect(() => {
    if (modoBusca === "manual") {
      const timer = setTimeout(() => {
        fazerBuscaLivre(busca);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [busca, modoBusca, fazerBuscaLivre]);

  // Limpa resultados quando muda de modo
  const handleModoChange = (novo: "pauta" | "manual") => {
    setModoBusca(novo);
    if (novo === "pauta") {
      setResultadosBusca([]);
      setErroBusca(null);
      setBusca("");
    }
  };

  const filtradas = useMemo(() => {
    if (modoBusca === "manual") {
      return resultadosBusca;
    }

    if (!busca.trim()) return proposicoes;
    const termo = busca.toLowerCase().trim();
    return proposicoes.filter(
      (p) =>
        p.identificador.toLowerCase().includes(termo) ||
        p.ementa.toLowerCase().includes(termo)
    );
  }, [busca, proposicoes, modoBusca, resultadosBusca]);

  const selecionada = proposicoes.find((p) => p.id === selectedId) || null;

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <label className="label !mb-0">1. Proposição</label>
        {onRefresh && (
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

      {/* Tabs Pauta/Manual */}
      <div className="flex gap-1 mb-3 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => handleModoChange("pauta")}
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
          onClick={() => handleModoChange("manual")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            modoBusca === "manual"
              ? "bg-white text-psdb-darkblue shadow-sm"
              : "text-slate-600"
          }`}
        >
          Buscar
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder={
            modoBusca === "manual"
              ? "Digite PL 1234/2023 ou palavra-chave..."
              : "Filtrar pauta..."
          }
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="input-base w-full"
          inputMode="search"
          aria-label="Buscar proposição"
        />
        {modoBusca === "manual" && carregandoBusca && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-psdb-blue border-t-transparent" />
          </div>
        )}
      </div>

      {/* Mensagem de erro ou aviso */}
      {erroBusca && modoBusca === "manual" && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          {erroBusca}
        </div>
      )}

      {/* Lista */}
      <div className="max-h-72 overflow-y-auto pr-1 -mr-1 space-y-2">
        {filtradas.length === 0 && (
          <div className="text-sm text-slate-500 py-6 text-center">
            {modoBusca === "manual" && busca
              ? "Nenhuma proposição encontrada com este termo."
              : modoBusca === "manual"
                ? "Comece a digitar para buscar..."
                : "Nenhuma proposição na pauta."}
          </div>
        )}

        {filtradas.map((p) => {
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

      {/* Selecionada */}
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
