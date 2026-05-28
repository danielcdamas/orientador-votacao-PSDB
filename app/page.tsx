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
import type {
  ApiResponse,
  Destaque,
  Fase,
  OrientacaoDestaque,
  Posicao,
  Proposicao,
} from "@/types";

function textoDestaque(d: Destaque): string {
  return d.ementaDetalhada || d.ementa || d.descricao || "Sem descrição cadastrada.";
}

function apresentanteDestaque(d: Destaque): string {
  return d.apresentante || d.partidoAutor || "";
}

export default function HomePage() {
  const [pauta, setPauta] = useState<Proposicao[]>([]);
  const [carregandoPauta, setCarregandoPauta] = useState(true);
  const [erroPauta, setErroPauta] = useState<string | null>(null);
  const [avisoPauta, setAvisoPauta] = useState<string | null>(null);

  const [selecionada, setSelecionada] = useState<Proposicao | null>(null);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [fase, setFase] = useState<Fase | null>(null);
  const [identificadorDestaque, setIdentificadorDestaque] = useState("");
  const [orientacaoDestaque, setOrientacaoDestaque] =
    useState<OrientacaoDestaque | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const [destaques, setDestaques] = useState<Destaque[]>([]);
  const [destaqueSelecionado, setDestaqueSelecionado] =
    useState<Destaque | null>(null);
  const [carregandoDestaques, setCarregandoDestaques] = useState(false);
  const [avisoDestaques, setAvisoDestaques] = useState<string | null>(null);
  const [erroDestaques, setErroDestaques] = useState<string | null>(null);

  const [mensagemGerada, setMensagemGerada] = useState<string>("");
  const [editouMensagem, setEditouMensagem] = useState(false);

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

  const carregarDestaques = useCallback(async (idProposicao: number) => {
    setCarregandoDestaques(true);
    setAvisoDestaques(null);
    setErroDestaques(null);
    setDestaques([]);
    setDestaqueSelecionado(null);

    try {
      const res = await fetch(
        `/api/proposicoes/pauta?destaquesDe=${idProposicao}`,
        { cache: "no-store" }
      );
      const json: ApiResponse<Destaque[]> = await res.json();
      if (!json.ok) {
        setErroDestaques(
          json.error || "Não foi possível carregar os destaques."
        );
        return;
      }
      setDestaques(json.data || []);
      if (json.message) setAvisoDestaques(json.message);
    } catch (err: unknown) {
      setErroDestaques(
        err instanceof Error
          ? err.message
          : "Erro ao consultar os destaques na Câmara."
      );
    } finally {
      setCarregandoDestaques(false);
    }
  }, []);

  useEffect(() => {
    carregarPauta();
  }, [carregarPauta]);

  const ehDestaque = fase === "DESTAQUE_TEXTO" || fase === "DESTAQUE_EMENDA";

  useEffect(() => {
    if (selecionada && ehDestaque) {
      carregarDestaques(selecionada.id);
    } else {
      setDestaques([]);
      setDestaqueSelecionado(null);
      setAvisoDestaques(null);
      setErroDestaques(null);
    }
  }, [selecionada, ehDestaque, carregarDestaques]);

  const podeGerar = useMemo(() => {
    if (!selecionada || !posicao || !fase) return false;
    if (ehDestaque && posicao !== "LIBERAR" && !orientacaoDestaque) return false;
    return true;
  }, [selecionada, posicao, fase, ehDestaque, orientacaoDestaque]);

  useEffect(() => {
    if (!podeGerar || editouMensagem) return;
    try {
      const texto = gerarMensagem({
        proposicao: selecionada,
        posicao,
        fase,
        justificativa,
        identificadorDestaque,
        destaqueSelecionado,
        orientacaoDestaque,
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
    destaqueSelecionado,
    orientacaoDestaque,
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
      destaqueSelecionado,
      orientacaoDestaque,
    });
    setMensagemGerada(texto);
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
    setOrientacaoDestaque(null);
    setJustificativa("");
    setDestaques([]);
    setDestaqueSelecionado(null);
    setMensagemGerada("");
    setEditouMensagem(false);
  }

  function handleSelecionarProposicao(p: Proposicao | null) {
    setSelecionada(p);
    setFase(null);
    setIdentificadorDestaque("");
    setOrientacaoDestaque(null);
    setDestaques([]);
    setDestaqueSelecionado(null);
    setEditouMensagem(false);
  }

  return (
    <>
      <Header />

      <main className="mx-auto max-w-2xl px-4 pb-12 pt-4">
        <section className="mb-4 px-1">
          <p className="text-sm text-slate-700 leading-relaxed">
            Gere mensagens prontas para WhatsApp sobre as votações do Plenário
            da Câmara. Escolha a proposição, a posição da Federação e a fase da
            votação.
          </p>
        </section>

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
                onChange={handleSelecionarProposicao}
                onRefresh={carregarPauta}
              />
            </>
          )}
        </section>

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

        {selecionada && posicao && (
          <section className="mb-4">
            <PhasePicker
              value={fase}
              posicao={posicao}
              onChange={(f) => {
                setFase(f);
                setIdentificadorDestaque("");
                setOrientacaoDestaque(null);
                setDestaqueSelecionado(null);
                setEditouMensagem(false);
              }}
              identificadorDestaque={identificadorDestaque}
              onChangeDestaque={(s) => {
                setIdentificadorDestaque(s);
                setDestaqueSelecionado(null);
                setEditouMensagem(false);
              }}
              orientacaoDestaque={orientacaoDestaque}
              onChangeOrientacaoDestaque={(o) => {
                setOrientacaoDestaque(o);
                setEditouMensagem(false);
              }}
            />
          </section>
        )}

        {selecionada && posicao && ehDestaque && (
          <section className="mb-4">
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between gap-2 mb-3">
                <label className="label !mb-0">4. Destaque apresentado</label>
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => carregarDestaques(selecionada.id)}
                  disabled={carregandoDestaques}
                >
                  Atualizar DTQs
                </button>
              </div>

              {carregandoDestaques && (
                <Spinner label="Buscando destaques na Câmara..." />
              )}

              {!carregandoDestaques && erroDestaques && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-800">
                  {erroDestaques}
                </div>
              )}

              {!carregandoDestaques && avisoDestaques && !erroDestaques && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900">
                  {avisoDestaques}
                </div>
              )}

              {!carregandoDestaques && destaques.length > 0 && (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1 -mr-1">
                  {destaques.map((d) => {
                    const ativo = destaqueSelecionado?.id === d.id;
                    const apresentante = apresentanteDestaque(d);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setDestaqueSelecionado(d);
                          setIdentificadorDestaque(d.identificador);
                          setEditouMensagem(false);
                        }}
                        className={`w-full text-left rounded-xl border p-3 transition-all ${
                          ativo
                            ? "border-psdb-blue bg-psdb-lightblue ring-2 ring-psdb-blue/30"
                            : "border-slate-200 bg-white hover:border-psdb-blue/40 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <span className="font-bold text-psdb-darkblue text-sm">
                              {d.identificador}
                            </span>
                            {apresentante && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Apresentante: {apresentante}
                              </div>
                            )}
                          </div>
                          {ativo && (
                            <span className="chip-blue text-[10px]">Selecionado</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 leading-snug line-clamp-5">
                          {textoDestaque(d)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {!carregandoDestaques && !erroDestaques && destaques.length === 0 && (
                <p className="text-[12px] text-slate-600 mt-2">
                  Selecione a fase e preencha o identificador manual acima caso o DTQ não tenha sido retornado pela API.
                </p>
              )}
            </div>
          </section>
        )}

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
                placeholder="Cole aqui a explicação da Assessoria Técnica do partido."
                rows={4}
                className="input-base"
                maxLength={1500}
              />
              <div className="flex justify-between mt-1">
                <span className="text-[11px] text-slate-500">
                  Esse texto aparecerá ao final da mensagem.
                </span>
                <span className="text-[11px] text-slate-400">
                  {justificativa.length}/1500
                </span>
              </div>
            </div>
          </section>
        )}

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
              {ehDestaque && posicao !== "LIBERAR" && !orientacaoDestaque
                ? "Escolha SIM ou NÃO ao destaque"
                : "Gerar mensagem"}
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

        {mensagemGerada && (
          <section id="preview-mensagem" className="mb-4 scroll-mt-20">
            <MessagePreview
              mensagem={mensagemGerada}
              onChange={handleEditarMensagem}
            />
          </section>
        )}

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
