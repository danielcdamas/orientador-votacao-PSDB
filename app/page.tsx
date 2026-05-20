"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { PropSelector } from "@/components/PropSelector";
import { PositionPicker } from "@/components/PositionPicker";
import { PhasePicker } from "@/components/PhasePicker";
import { MessagePreview } from "@/components/MessagePreview";
import { SkeletonCard, Spinner } from "@/components/Loading";
import { ErrorBanner, EmptyState } from "@/components/ErrorBanner";
import { gerarMensagem } from "@/lib/mensagem";
import type { ApiResponse, Fase, Posicao, Proposicao } from "@/types";

export default function HomePage() {
  // Estado principal
  const [pauta, setPauta] = useState<Proposicao[]>([]);
  const [carregandoPauta, setCarregandoPauta] = useState(true);
  const [erroPauta, setErroPauta] = useState<string | null>(null);
  const [avisoPauta, setAvisoPauta] = useState<string | null>(null);

  const [selecionada, setSelecionada] = useState<Proposicao | null>(null);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [fase, setFase] = useState<Fase | null>(null);
  const [identificadorDestaque, setIdentificadorDestaque] = useState("");
  const [justificativa, setJustificativa] = useState("");

  const [mensagemGerada, setMensagemGerada] = useState<string>("");
  const [editouMensagem, setEditouMensagem] = useState(false);

  // Carrega pauta do dia
  const carregarPauta = useCallback(async () => {
    setCarregandoPauta(true);
    setErroPauta(null);
    setAvisoPauta(null);
    try {
      const res = await fetch("/api/proposicoes/pauta", { cache: "no-store" });
      const json: ApiResponse<Proposicao[]> = await res.json();
      if (!json.ok) {
        setErroPauta(
          json.error ||
            "Não foi possível carregar a pauta. Verifique sua conexão."
        );
        setPauta([]);
      } else {
        setPauta(json.data || []);
        if (json.message) setAvisoPauta(json.message);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erro ao conectar com o servidor.";
      setErroPauta(msg);
      setPauta([]);
    } finally {
      setCarregandoPauta(false);
    }
  }, []);

  useEffect(() => {
    carregarPauta();
  }, [carregarPauta]);

  // Detecta se pode gerar mensagem
  const podeGerar = useMemo(
    () => Boolean(selecionada && posicao && fase),
    [selecionada, posicao, fase]
  );

  // Gera mensagem (sem clicar — sempre que dados mudam, atualiza a preview)
  useEffect(() => {
    if (!podeGerar || editouMensagem) return;
    try {
      const texto = gerarMensagem({
        proposicao: selecionada,
        posicao,
        fase,
        justificativa,
        identificadorDestaque,
      });
      setMensagemGerada(texto);
    } catch {
      // ignora — usuário ainda não preencheu tudo
    }
  }, [
    podeGerar,
    selecionada,
    posicao,
    fase,
    justificativa,
    identificadorDestaque,
    editouMensagem,
  ]);

  function handleGerarManual() {
    if (!podeGerar) return;
    setEditouMensagem(false);
    const texto = gerarMensagem({
      proposicao: selecionada,
      posicao,
      fase,
      justificativa,
      identificadorDestaque,
    });
    setMensagemGerada(texto);
    // rola até o preview (UX mobile)
    setTimeout(() => {
      document
        .getElementById("preview-mensagem")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleEditarMensagem(novo: string) {
    setMensagemGerada(novo);
    setEditouMensagem(true);
  }

  function handleReset() {
    setSelecionada(null);
    setPosicao(null);
    setFase(null);
    setIdentificadorDestaque("");
    setJustificativa("");
    setMensagemGerada("");
    setEditouMensagem(false);
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-2xl px-4 pb-12 pt-4">
        {/* Subtítulo / introdução */}
        <section className="mb-4 px-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            Gere mensagens prontas para WhatsApp sobre as votações do Plenário
            da Câmara. Escolha a proposição, a posição da Federação e a fase da
            votação.
          </p>
        </section>

        {/* 1) Proposições */}
        <section className="mb-4">
          {carregandoPauta && (
            <div className="space-y-3">
              <SkeletonCard />
              <Spinner label="Buscando pauta do dia na Câmara..." />
            </div>
          )}

          {!carregandoPauta && erroPauta && (
            <ErrorBanner
              title="Falha ao carregar a pauta"
              message={erroPauta}
              onRetry={carregarPauta}
            />
          )}

          {!carregandoPauta && !erroPauta && pauta.length === 0 && (
            <EmptyState
              title="Sem pauta disponível"
              message={
                avisoPauta ||
                "Não encontramos sessão do Plenário com proposições pautadas hoje. Tente novamente mais tarde ou use a busca manual."
              }
              onRetry={carregarPauta}
            />
          )}

          {!carregandoPauta && !erroPauta && pauta.length > 0 && (
            <>
              {avisoPauta && (
                <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900">
                  {avisoPauta}
                </div>
              )}
              <PropSelector
                proposicoes={pauta}
                selectedId={selecionada?.id || null}
                onChange={(p) => {
                  setSelecionada(p);
                  setEditouMensagem(false);
                }}
                onRefresh={carregarPauta}
              />
            </>
          )}
        </section>

        {/* 2) Posição */}
        {selecionada && (
          <section className="mb-4">
            <PositionPicker
              value={posicao}
              onChange={(p) => {
                setPosicao(p);
                setEditouMensagem(false);
              }}
            />
          </section>
        )}

        {/* 3) Fase */}
        {selecionada && posicao && (
          <section className="mb-4">
            <PhasePicker
              value={fase}
              posicao={posicao}
              onChange={(f) => {
                setFase(f);
                setEditouMensagem(false);
              }}
              identificadorDestaque={identificadorDestaque}
              onChangeDestaque={(s) => {
                setIdentificadorDestaque(s);
                setEditouMensagem(false);
              }}
            />
          </section>
        )}

        {/* 4) Justificativa opcional */}
        {selecionada && posicao && fase && (
          <section className="mb-4">
            <div className="card animate-slide-up">
              <label className="label" htmlFor="just">
                Análise técnica / justificativa{" "}
                <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <textarea
                id="just"
                value={justificativa}
                onChange={(e) => {
                  setJustificativa(e.target.value);
                  setEditouMensagem(false);
                }}
                placeholder="Ex.: Descrição do destaque, motivação técnica, jurisprudência, etc."
                rows={4}
                className="input-base"
                maxLength={1000}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[11px] text-slate-500">
                  Esse texto aparecerá ao final da mensagem.
                </span>
                <span className="text-[11px] text-slate-400">
                  {justificativa.length}/1000
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 5) Botão Gerar */}
        {selecionada && posicao && fase && (
          <section className="mb-4 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleGerarManual}
              className="btn-primary flex-1"
              disabled={!podeGerar}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Gerar mensagem
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
            >
              Limpar tudo
            </button>
          </section>
        )}

        {/* 6) Preview */}
        {mensagemGerada && (
          <section id="preview-mensagem" className="mb-4 scroll-mt-20">
            <MessagePreview
              mensagem={mensagemGerada}
              onChange={handleEditarMensagem}
            />
          </section>
        )}

        {/* Rodapé */}
        <footer className="text-center text-[11px] text-slate-500 mt-8">
          <p>
            Federação PSDB/CID · Orientador de Votação ·{" "}
            <span className="font-mono">
              v{process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0"}
            </span>
          </p>
          <p className="mt-1">
            Dados públicos da Câmara dos Deputados via{" "}
            <a
              href="https://dadosabertos.camara.leg.br/swagger/api.html"
              className="underline hover:text-psdb-blue"
              target="_blank"
              rel="noopener noreferrer"
            >
              Dados Abertos
            </a>
            .
          </p>
        </footer>
      </main>
    </>
  );
}
