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
const hojeISOStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const [dataSelecionada, setDataSelecionada] = useState<string>(hojeISOStr);
  const [mostrarCalendarioTopo, setMostrarCalendarioTopo] = useState(false);
  const ehHoje = dataSelecionada === hojeISOStr;
  const dataBRLonga = (() => {
    const [a, m, dia] = dataSelecionada.split("-");
    return `${dia}/${m}/${a}`;
  })();
// Matérias da pauta com relatoria ou autoria de parlamentar da Federação.
  const materiasFederacao = pauta.filter(
    (p) =>
      p.marcaFederacao &&
      (p.marcaFederacao.relator ||
        (p.marcaFederacao.autores && p.marcaFederacao.autores.length > 0))
  );
  const [selecionada, setSelecionada] = useState<Proposicao | null>(null);
  const [posicao, setPosicao] = useState<Posicao | null>(null);
  const [fase, setFase] = useState<Fase | null>(null);
  const [identificadorDestaque, setIdentificadorDestaque] = useState("");
  const [orientacaoDestaque, setOrientacaoDestaque] =
    useState<OrientacaoDestaque | null>(null);
  const [justificativa, setJustificativa] = useState("");
  // Efeitos práticos do Voto Sim/Não gerados pela IA (usados só em LIBERAR).
  const [efeitoSim, setEfeitoSim] = useState("");
  const [efeitoNao, setEfeitoNao] = useState("");
  const [gerandoIA, setGerandoIA] = useState(false);
  const [erroIA, setErroIA] = useState<string | null>(null);

  // Resumo da proposição (IA) — gerado a partir do inteiro teor (texto
  // original), independente de posição/fase. Só leitura na tela + copiar.
  const [resumoIA, setResumoIA] = useState("");
  const [gerandoResumo, setGerandoResumo] = useState(false);
  const [erroResumo, setErroResumo] = useState<string | null>(null);
  const [copiouResumo, setCopiouResumo] = useState(false);

  const [destaques, setDestaques] = useState<Destaque[]>([]);
  const [destaqueSelecionado, setDestaqueSelecionado] =
    useState<Destaque | null>(null);
  const [carregandoDestaques, setCarregandoDestaques] = useState(false);
  const [avisoDestaques, setAvisoDestaques] = useState<string | null>(null);
  const [erroDestaques, setErroDestaques] = useState<string | null>(null);

  const [mensagemGerada, setMensagemGerada] = useState<string>("");
  const [editouMensagem, setEditouMensagem] = useState(false);

const carregarPauta = useCallback(
    async (data?: string) => {
      const dataUsada = data ?? dataSelecionada;
      const [ano, mes, dia] = dataUsada.split("-");
      const dataBR = `${dia}/${mes}/${ano}`;

      setCarregandoPauta(true);
      setErroPauta(null);
      setAvisoPauta(null);
      try {
        const res = await fetch(
          `/api/proposicoes/pauta?data=${dataUsada}`,
          { cache: "no-store" }
        );
        const json: ApiResponse<Proposicao[]> = await res.json();
        if (!json.ok) {
          setErroPauta(
            json.error ||
              "Não foi possível carregar a pauta. Verifique sua conexão."
          );
          setPauta([]);
        } else {
          setPauta(json.data || []);
          if ((json.data || []).length === 0) {
            setAvisoPauta(`Nenhuma sessão deliberativa em ${dataBR}.`);
          } else if (json.message) {
            setAvisoPauta(json.message);
          }
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
    },
    [dataSelecionada]
  );
const aoTrocarData = useCallback(
    (novaData: string) => {
      setDataSelecionada(novaData);
      carregarPauta(novaData);
    },
    [carregarPauta]
  );
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
  // Emendas com parecer pela rejeição: como nos destaques, o SIM/NÃO é escolha
  // explícita do usuário (não há DTQ nem lista da Câmara nessa fase).
  const ehEmendasRejeicao = fase === "EMENDAS_REJEICAO";
  const pedeOrientacaoManual = ehDestaque || ehEmendasRejeicao;

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
    if (pedeOrientacaoManual && posicao !== "LIBERAR" && !orientacaoDestaque)
      return false;
    return true;
  }, [selecionada, posicao, fase, pedeOrientacaoManual, orientacaoDestaque]);

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
        efeitoSim,
        efeitoNao,
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
    efeitoSim,
    efeitoNao,
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
      efeitoSim,
      efeitoNao,
    });
    setMensagemGerada(texto);
    setTimeout(() => {
      document
        .getElementById("preview-mensagem")
?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  async function explicarComIA() {
    if (!selecionada || !destaqueSelecionado) return;
    if (
      justificativa.trim() &&
      !window.confirm("Já existe um texto. Substituir pela explicação da IA?")
    ) {
      return;
    }

    setGerandoIA(true);
    setErroIA(null);
    try {
      const idDtq = destaqueSelecionado.identificador || identificadorDestaque || "";
      const descricao =
        destaqueSelecionado.descricao ||
        destaqueSelecionado.ementaDetalhada ||
        destaqueSelecionado.ementa ||
        "";

      const res = await fetch("/api/explicar-destaque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
body: JSON.stringify({
          fase,
          posicao,
          proposicao: {
            id: selecionada.id,
            identificador: selecionada.identificador,
            ementa: selecionada.ementa,
          },
          destaque: { identificador: idDtq, descricao },
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.ok || !json.texto) {
        setErroIA(json.error || "Não foi possível gerar a explicação.");
        return;
      }

      setJustificativa(json.texto);
      // Efeitos do Voto Sim/Não (só vêm quando a posição é LIBERAR).
      setEfeitoSim(json.efeitoSim || "");
      setEfeitoNao(json.efeitoNao || "");
      setEditouMensagem(false);
    } catch {
      setErroIA("Erro ao chamar a IA. Verifique a conexão e tente de novo.");
    } finally {
      setGerandoIA(false);
    }
  }

  function handleEditarMensagem(novo: string) {
    setMensagemGerada(novo);
    setEditouMensagem(true);
  }

  // Gera o resumo da proposição a partir do INTEIRO TEOR (texto original).
  // Se o item selecionado for um REQ de urgência (ou parecer) com proposição-
  // alvo, o resumo útil é o da MATÉRIA (alvo), não o do requerimento.
  async function gerarResumoIA() {
    if (!selecionada) return;
    const alvo = selecionada.proposicaoAlvo ?? selecionada;

    setGerandoResumo(true);
    setErroResumo(null);
    setCopiouResumo(false);
    try {
      const res = await fetch("/api/resumir-proposicao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposicao: {
            id: alvo.id,
            identificador: alvo.identificador,
            ementa: alvo.ementa,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok || !json.texto) {
        setErroResumo(json.error || "Não foi possível gerar o resumo.");
        return;
      }
      setResumoIA(json.texto);
    } catch {
      setErroResumo("Erro ao chamar a IA. Verifique a conexão e tente de novo.");
    } finally {
      setGerandoResumo(false);
    }
  }

  async function copiarResumo() {
    if (!resumoIA) return;
    try {
      await navigator.clipboard.writeText(resumoIA);
      setCopiouResumo(true);
      setTimeout(() => setCopiouResumo(false), 2000);
    } catch {
      // Sem clipboard disponível: o usuário ainda pode selecionar e copiar.
    }
  }

  function handleReset() {
    setSelecionada(null);
    setResumoIA("");
    setErroResumo(null);
    setCopiouResumo(false);
    setPosicao(null);
    setFase(null);
    setIdentificadorDestaque("");
    setOrientacaoDestaque(null);
    setJustificativa("");
    setEfeitoSim("");
    setEfeitoNao("");
    setDestaques([]);
    setDestaqueSelecionado(null);
    setMensagemGerada("");
    setEditouMensagem(false);
  }

  function handleSelecionarProposicao(p: Proposicao | null) {
    setSelecionada(p);
    setResumoIA("");
    setErroResumo(null);
    setCopiouResumo(false);
    setFase(null);
    setIdentificadorDestaque("");
    setOrientacaoDestaque(null);
    setDestaques([]);
    setDestaqueSelecionado(null);
    setEfeitoSim("");
    setEfeitoNao("");
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

        <section className="mb-3">
          <div className="flex flex-col gap-2 px-1 mb-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-bold text-psdb-darkblue flex items-center gap-1.5">
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {ehHoje ? `Pauta de hoje · ${dataBRLonga}` : `Pauta · ${dataBRLonga}`}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {!ehHoje && (
                <button
                  type="button"
                  onClick={() => aoTrocarData(hojeISOStr)}
                  className="btn-ghost text-xs"
                  aria-label="Voltar para a pauta de hoje"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M9 14l-4-4 4-4" />
                    <path d="M5 10h11a4 4 0 0 1 0 8h-1" />
                  </svg>
                  Hoje
                </button>
              )}
              <button
                type="button"
                onClick={() => setMostrarCalendarioTopo((v) => !v)}
                className="btn-ghost text-xs"
                aria-label="Buscar pauta de outra data"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Outra data
              </button>
              <button
                type="button"
                onClick={() => carregarPauta()}
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
            </div>
          </div>

          {mostrarCalendarioTopo && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5">
              <label
                htmlFor="data-sessao-topo"
                className="block text-[12px] font-semibold text-slate-700 mb-1.5"
              >
                Escolher data da sessão
              </label>
              <input
                id="data-sessao-topo"
                type="date"
                value={dataSelecionada}
                onChange={(e) => {
                  if (e.target.value) aoTrocarData(e.target.value);
                }}
                className="input-base"
                aria-label="Data da sessão deliberativa"
              />
            </div>
          )}
        </section>

        {materiasFederacao.length > 0 && (
          <section className="mb-4">
            <div className="rounded-xl border-2 border-psdb-yellow bg-amber-50 p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-psdb-yellow">
                  <svg
                    className="h-4 w-4 text-psdb-darkblue"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-psdb-darkblue mb-1.5">
                    {materiasFederacao.length === 1
                      ? "1 matéria da Federação nesta pauta"
                      : `${materiasFederacao.length} matérias da Federação nesta pauta`}
                  </div>
                  <ul className="space-y-1">
                    {materiasFederacao.map((p) => (
                      <li
                        key={p.id}
                        className="text-[12px] text-slate-700 leading-snug"
                      >
                        <span className="font-bold text-slate-900">
                          {p.identificador}
                        </span>
                        {p.marcaFederacao?.relator && (
                          <>
                            {" "}
                            <span className="chip-blue text-[10px]">
                              relatoria
                            </span>{" "}
                            {p.marcaFederacao.relator.nome}
                          </>
                        )}
                        {p.marcaFederacao?.autores &&
                          p.marcaFederacao.autores.length > 0 && (
                            <>
                              {" "}
                              <span className="chip-blue text-[10px]">
                                autoria
                              </span>{" "}
                              {p.marcaFederacao.autores
                                .map((a) => a.nome)
                                .join(", ")}
                            </>
                          )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

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

          {!carregandoPauta && !erroPauta && (
            <>
              {pauta.length === 0 && (
                <div className="mb-3">
                  <EmptyState
                    title="Sem pauta disponível"
                    message={
                      avisoPauta ||
                      "Não encontramos sessão do Plenário com proposições pautadas hoje."
                    }
                    onRetry={carregarPauta}
                  />
                  <p className="mt-2 text-[12px] text-slate-600">
                    Você ainda pode pesquisar qualquer proposição em tramitação
                    na aba <strong>Buscar na Câmara</strong> abaixo.
                  </p>
                </div>
              )}
              {avisoPauta && pauta.length > 0 && (
                <div className="mb-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[12px] text-amber-900">
                  {avisoPauta}
                </div>
              )}
              <PropSelector
                key={pauta.length === 0 ? "sem-pauta" : "com-pauta"}
                modoInicial={pauta.length === 0 ? "manual" : "pauta"}
                proposicoes={pauta}
                selectedId={selecionada?.id || null}
                onChange={handleSelecionarProposicao}
              />
            </>
          )}
        </section>

        {selecionada && (
          <section className="mb-4">
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Resumo da proposição (IA)
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Explicação breve a partir do inteiro teor (texto original
                    {selecionada.proposicaoAlvo
                      ? ` — resume a matéria ${selecionada.proposicaoAlvo.identificador}`
                      : ""}
                    ).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={gerarResumoIA}
                  disabled={gerandoResumo}
                  className="btn-secondary text-sm shrink-0"
                >
                  {gerandoResumo ? "Resumindo..." : "Gerar resumo"}
                </button>
              </div>

              {gerandoResumo && (
                <div className="mt-3">
                  <Spinner label="Lendo o inteiro teor e resumindo..." />
                </div>
              )}

              {erroResumo && !gerandoResumo && (
                <p className="mt-3 text-[12px] text-red-600">{erroResumo}</p>
              )}

              {resumoIA && !gerandoResumo && (
                <div className="mt-3">
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    {resumoIA}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={copiarResumo}
                      className="btn-ghost text-xs"
                    >
                      {copiouResumo ? "Copiado ✓" : "Copiar"}
                    </button>
                    <span className="text-[11px] text-slate-500">
                      Gerado pela IA sobre o texto original — pode não refletir
                      substitutivos. Revise antes de repassar.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

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
                setEfeitoSim("");
                setEfeitoNao("");
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
                          setEfeitoSim("");
                          setEfeitoNao("");
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

              {(fase === "DESTAQUE_TEXTO" || fase === "DESTAQUE_EMENDA") && destaqueSelecionado && (
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={explicarComIA}
                    disabled={gerandoIA}
                    className="btn-secondary text-sm"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z" />
                    </svg>
                    {gerandoIA ? "Gerando explicação..." : "Explicar com IA"}
                  </button>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gera um rascunho pela IA — revise antes de usar.
                  </p>
                  {erroIA && (
                    <p className="text-[11px] text-red-600 mt-1">{erroIA}</p>
                  )}
                </div>
              )}
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
              {pedeOrientacaoManual && posicao !== "LIBERAR" && !orientacaoDestaque
                ? ehEmendasRejeicao
                  ? "Escolha SIM ou NÃO às emendas"
                  : "Escolha SIM ou NÃO ao destaque"
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
              v{process.env.NEXT_PUBLIC_APP_VERSION || "1.6.1"}
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
