// =========================================================
// Cliente da API de Dados Abertos da Câmara dos Deputados
// Documentação oficial: https://dadosabertos.camara.leg.br/swagger/api.html
// =========================================================
import type { Proposicao, Parecer, Destaque } from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_CAMARA_API_BASE ||
  "https://dadosabertos.camara.leg.br/api/v2";

const TIMEOUT_MS = Number(process.env.CAMARA_API_TIMEOUT_MS || 15000);

/**
 * Faz fetch com timeout e tratamento de erro padronizado.
 * Lança Error com mensagem amigável quando falha.
 */
async function fetchJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...options.headers,
      },
      // Cache de 5 minutos no edge (Vercel)
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(
        `API da Câmara respondeu com status ${res.status} (${res.statusText}).`
      );
    }

    const json = (await res.json()) as T;
    return json;
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error(
          "A API da Câmara demorou demais para responder. Tente novamente em alguns segundos."
        );
      }
      throw err;
    }
    throw new Error("Erro desconhecido ao consultar a API da Câmara.");
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Formata identificador da proposição.
 * Ex.: { siglaTipo: "PL", numero: 4822, ano: 2025 } -> "PL 4822/2025"
 */
export function formatarIdentificador(p: {
  siglaTipo: string;
  numero: number;
  ano: number;
}): string {
  return `${p.siglaTipo} ${p.numero}/${p.ano}`;
}

/**
 * Retorna a data de hoje no formato YYYY-MM-DD.
 */
function hojeISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Siglas que indicam que o item da pauta é um PARECER sendo votado.
// Nesses casos, a proposição "real" está em proposicaoRelacionada_, não em proposicao_.
const SIGLAS_PARECER = new Set([
  "PAR",   // Parecer de Comissão Mista
  "PPP",   // Parecer Proferido em Plenário
  "PEP",   // Parecer às Emendas de Plenário
  "PRLP",  // Parecer Preliminar de Plenário
  "PRLE",  // Parecer Preliminar às Emendas de Plenário
  "PRL",   // Parecer de Relator
]);

/**
 * Busca a pauta do Plenário do dia.
 *
 * Estratégia em duas etapas:
 * 1) Tenta buscar eventos do Plenário hoje via /eventos
 * 2) Para cada evento, pega as proposições pautadas via /eventos/{id}/pauta
 * 3) Se não houver evento hoje, tenta o evento mais recente do Plenário.
 *
 * Nota especial: itens de parecer (PAR, PPP, etc) trazem a proposição real
 * em proposicaoRelacionada_, não em proposicao_.
 */
export async function buscarPautaDoDia(): Promise<Proposicao[]> {
  const hoje = hojeISO();

  // Id do órgão "Plenário" na API da Câmara = 180
  const PLENARIO_ID = 180;

  // 1) Buscar eventos do plenário hoje
  const urlEventos = new URL(`${BASE_URL}/eventos`);
  urlEventos.searchParams.set("idOrgao", String(PLENARIO_ID));
  urlEventos.searchParams.set("dataInicio", hoje);
  urlEventos.searchParams.set("dataFim", hoje);
  urlEventos.searchParams.set("ordem", "ASC");
  urlEventos.searchParams.set("ordenarPor", "dataHoraInicio");

  type EventosResp = { dados: Array<{ id: number; descricao: string }> };
  let eventos = await fetchJson<EventosResp>(urlEventos.toString());

  // Se não há eventos hoje, buscar últimos 7 dias e pegar o mais recente
  if (!eventos.dados || eventos.dados.length === 0) {
    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() - 7);
    const dataInicio = `${seteDias.getFullYear()}-${String(
      seteDias.getMonth() + 1
    ).padStart(2, "0")}-${String(seteDias.getDate()).padStart(2, "0")}`;

    const urlFallback = new URL(`${BASE_URL}/eventos`);
    urlFallback.searchParams.set("idOrgao", String(PLENARIO_ID));
    urlFallback.searchParams.set("dataInicio", dataInicio);
    urlFallback.searchParams.set("dataFim", hoje);
    urlFallback.searchParams.set("ordem", "DESC");
    urlFallback.searchParams.set("ordenarPor", "dataHoraInicio");

    eventos = await fetchJson<EventosResp>(urlFallback.toString());
  }

  if (!eventos.dados || eventos.dados.length === 0) {
    return [];
  }

  // 2) Para cada evento, buscar pauta. Pegamos só os 2 mais recentes para não estourar.
  const eventosLimitados = eventos.dados.slice(0, 2);

  type ProposicaoPauta = {
    id: number;
    siglaTipo: string;
    codTipo?: number;
    numero: number;
    ano: number;
    ementa?: string;
  };

  type PautaResp = {
    dados: Array<{
      ordem: number;
      proposicao_?: ProposicaoPauta;
      proposicaoRelacionada_?: ProposicaoPauta;
    }>;
  };

  const todasProposicoes: Proposicao[] = [];

  for (const evento of eventosLimitados) {
    try {
      const urlPauta = `${BASE_URL}/eventos/${evento.id}/pauta`;
      const pauta = await fetchJson<PautaResp>(urlPauta);

      for (const item of pauta.dados || []) {
        const proposicaoDireta = item.proposicao_;
        if (!proposicaoDireta) continue;

        // Se o item é um parecer, a proposição real está em proposicaoRelacionada_
        const siglaDireta = String(proposicaoDireta.siglaTipo || "").toUpperCase();
        const ehParecer = SIGLAS_PARECER.has(siglaDireta);
        const relacionada = item.proposicaoRelacionada_;

        let proposicaoReal = proposicaoDireta;

        if (ehParecer && relacionada && relacionada.id) {
          proposicaoReal = relacionada;

          // Se a proposição relacionada não tem ementa, busca detalhes
          if (!relacionada.ementa) {
            try {
              const detalhes = await buscarProposicao(relacionada.id);
              proposicaoReal = {
                id: detalhes.id,
                siglaTipo: detalhes.siglaTipo,
                numero: detalhes.numero,
                ano: detalhes.ano,
                ementa: detalhes.ementa,
              };
            } catch {
              // Se falhar, mantém o que temos de proposicaoRelacionada_
            }
          }
        }

        // Evitar duplicatas
        if (todasProposicoes.some((x) => x.id === proposicaoReal.id)) continue;

        todasProposicoes.push({
          id: proposicaoReal.id,
          siglaTipo: proposicaoReal.siglaTipo,
          numero: proposicaoReal.numero,
          ano: proposicaoReal.ano,
          ementa: proposicaoReal.ementa || "(Sem ementa cadastrada.)",
          identificador: formatarIdentificador(proposicaoReal),
        });
      }
    } catch {
      // se falhar para um evento, segue para o próximo
      continue;
    }
  }

  return todasProposicoes;
}

/**
 * Busca proposições por termo (busca livre).
 * Pode ser por sigla/número/ano (PL 1234/2023) ou keywords.
 */
export async function buscarProposicoes(termo: string): Promise<Proposicao[]> {
  if (!termo || termo.trim().length < 2) {
    return [];
  }

  const url = new URL(`${BASE_URL}/proposicoes`);
  url.searchParams.set("ordem", "DESC");
  url.searchParams.set("ordenarPor", "ano");
  url.searchParams.set("itens", "15");

  // Tenta parsear como identificador (PL 699/2023)
  const match = termo.trim().match(/^([A-Za-z]{2,8})\s*[- ]?\s*(\d+)\s*[\/ ]?\s*(\d{4})?$/);

  if (match) {
    url.searchParams.set("siglaTipo", match[1].toUpperCase());
    url.searchParams.set("numero", match[2]);
    if (match[3]) {
      url.searchParams.set("ano", match[3]);
    }
  } else {
    // Busca por keywords
    url.searchParams.set("keywords", termo.trim());
  }

  try {
    type RespBusca = {
      dados: Array<{
        id: number;
        siglaTipo: string;
        numero: number;
        ano: number;
        ementa?: string;
        descricaoTipo?: string;
        urlInteiroTeor?: string;
        statusProposicao?: Proposicao["statusProposicao"];
      }>;
    };

    const resp = await fetchJson<RespBusca>(url.toString());
    return (resp.dados || []).map((d) => ({
      id: d.id,
      siglaTipo: d.siglaTipo,
      numero: d.numero,
      ano: d.ano,
      ementa: d.ementa || "(Sem ementa cadastrada.)",
      identificador: formatarIdentificador(d),
      descricaoTipo: d.descricaoTipo,
      urlInteiroTeor: d.urlInteiroTeor,
      statusProposicao: d.statusProposicao,
    }));
  } catch {
    return [];
  }
}

/**
 * Busca detalhes completos de uma proposição.
 */
export async function buscarProposicao(id: number): Promise<Proposicao> {
  const url = `${BASE_URL}/proposicoes/${id}`;
  type Resp = {
    dados: {
      id: number;
      siglaTipo: string;
      numero: number;
      ano: number;
      ementa: string;
      descricaoTipo?: string;
      urlInteiroTeor?: string;
      statusProposicao?: Proposicao["statusProposicao"];
    };
  };

  const resp = await fetchJson<Resp>(url);
  const d = resp.dados;

  return {
    id: d.id,
    siglaTipo: d.siglaTipo,
    numero: d.numero,
    ano: d.ano,
    ementa: d.ementa,
    identificador: formatarIdentificador(d),
    descricaoTipo: d.descricaoTipo,
    urlInteiroTeor: d.urlInteiroTeor,
    statusProposicao: d.statusProposicao,
  };
}

function extrairNumeroDtq(...textos: Array<string | undefined>): number | undefined {
  const texto = textos.filter(Boolean).join(" ");
  const padroes = [
    /DTQ\s*(?:n\.?\s*)?(\d+)\s*=>/i,
    /DTQ\s*n[ºo.]?\s*(\d+)\b/i,
    /DTQ\s*(\d+)\b/i,
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match?.[1]) return Number(match[1]);
  }

  return undefined;
}

function extrairTipoDestaque(ementa?: string): string | undefined {
  if (!ementa) return undefined;

  const tipos = [
    { regex: /novo/i, tipo: "NOVO" },
    { regex: /supressivo/i, tipo: "SUPRESSIVO" },
    { regex: /substitutivo/i, tipo: "SUBSTITUTIVO" },
    { regex: /aditivo/i, tipo: "ADITIVO" },
  ];

  for (const { regex, tipo } of tipos) {
    if (regex.test(ementa)) {
      return tipo;
    }
  }

  return undefined;
}

/**
 * Busca destaques textuais (DTQ) de uma proposição.
 * Retorna uma lista vazia se não houver destaques.
 */
export async function buscarDestaques(id: number): Promise<Destaque[]> {
  const url = `${BASE_URL}/proposicoes/${id}/relacionadas`;

  type Resp = {
    dados: Array<{
      id: number;
      siglaTipo: string;
      numero?: number;
      ano?: number;
      ementa?: string;
    }>;
  };

  try {
    const resp = await fetchJson<Resp>(url);
    // Filtra apenas DTQs (Destaques Textuais)
    const destaques = (resp.dados || []).filter((p) =>
      String(p.siglaTipo || "").toUpperCase().startsWith("DTQ")
    );

    return destaques.map((d) => {
      // Extrai o número correto do destaque da ementa
      const numeroDtq = extrairNumeroDtq(d.ementa) || d.numero;
      // Extrai o tipo (NOVO, SUPRESSIVO, etc)
      const tipo = extrairTipoDestaque(d.ementa);

      // Constrói o identificador: "DTQ 1 (NOVO)" ou apenas "DTQ 1"
      const tipoSufixo = tipo ? ` (${tipo})` : "";
      const identificador = `DTQ ${numeroDtq}${tipoSufixo}`;

      return {
        id: d.id,
        siglaTipo: d.siglaTipo,
        numero: numeroDtq,
        ano: d.ano,
        identificador,
        ementa: d.ementa || "(Sem descrição)",
      };
    });
  } catch {
    return [];
  }
}

/**
 * Busca o último parecer do relator de uma proposição.
 * Retorna null se não houver parecer cadastrado.
 */
export async function buscarUltimoParecer(
  id: number
): Promise<Parecer | null> {
  const url = `${BASE_URL}/proposicoes/${id}/relatorias`;
  type Resp = {
    dados: Array<{
      idProposicaoRelatada: number;
      relator?: string;
      siglaPartidoRelator?: string;
      ufRelator?: string;
      urlInteiroTeorParecer?: string;
      dataPublicacaoParecer?: string;
      ementaParecer?: string;
    }>;
  };

  try {
    const resp = await fetchJson<Resp>(url);
    if (!resp.dados || resp.dados.length === 0) return null;
    // O mais recente costuma vir por último; vamos pegar o último.
    const ultimo = resp.dados[resp.dados.length - 1];
    return {
      idProposicaoRelatada: ultimo.idProposicaoRelatada,
      relator: ultimo.relator,
      partidoRelator: ultimo.siglaPartidoRelator,
      ufRelator: ultimo.ufRelator,
      urlInteiroTeorParecer: ultimo.urlInteiroTeorParecer,
      dataApresentacao: ultimo.dataPublicacaoParecer,
      ementa: ultimo.ementaParecer,
    };
  } catch {
    return null;
  }
}
