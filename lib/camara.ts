// =========================================================
// Cliente da API de Dados Abertos da Câmara dos Deputados
// Documentação oficial: https://dadosabertos.camara.leg.br/swagger/api.html
// =========================================================
import type { Destaque, Parecer, Proposicao } from "@/types";

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
  numero?: number;
  ano?: number;
}): string {
  const numeroAno =
    typeof p.numero === "number" && typeof p.ano === "number"
      ? ` ${p.numero}/${p.ano}`
      : "";
  return `${p.siglaTipo}${numeroAno}`.trim();
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

function normalizarTermoBusca(termo: string): {
  siglaTipo?: string;
  numero?: string;
  ano?: string;
  palavraChave: string;
} {
  const limpo = termo.trim().replace(/\s+/g, " ");
  const match = limpo.match(/^([A-Za-z]{2,8})\s*[- ]?\s*(\d+)\s*[\/ ]\s*(\d{4})$/);

  if (match) {
    return {
      siglaTipo: match[1].toUpperCase(),
      numero: match[2],
      ano: match[3],
      palavraChave: limpo,
    };
  }

  return { palavraChave: limpo };
}

function mapearProposicao(d: {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa?: string;
  descricaoTipo?: string;
  urlInteiroTeor?: string;
  statusProposicao?: Proposicao["statusProposicao"];
}): Proposicao {
  return {
    id: d.id,
    siglaTipo: d.siglaTipo,
    numero: d.numero,
    ano: d.ano,
    ementa: d.ementa || "(Sem ementa cadastrada.)",
    identificador: formatarIdentificador(d),
    descricaoTipo: d.descricaoTipo,
    urlInteiroTeor: d.urlInteiroTeor,
    statusProposicao: d.statusProposicao,
  };
}

/**
 * Busca a pauta do Plenário do dia.
 *
 * Estratégia em duas etapas:
 * 1) Tenta buscar eventos do Plenário hoje via /eventos
 * 2) Para cada evento, pega as proposições pautadas via /eventos/{id}/pauta
 * 3) Se não houver evento hoje, tenta o evento mais recente do Plenário.
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

  type PautaResp = {
    dados: Array<{
      ordem: number;
      proposicao_?: {
        id: number;
        siglaTipo: string;
        codTipo: number;
        numero: number;
        ano: number;
        ementa: string;
      };
    }>;
  };

  const todasProposicoes: Proposicao[] = [];

  for (const evento of eventosLimitados) {
    try {
      const urlPauta = `${BASE_URL}/eventos/${evento.id}/pauta`;
      const pauta = await fetchJson<PautaResp>(urlPauta);

      for (const item of pauta.dados || []) {
        const p = item.proposicao_;
        if (!p) continue;
        // Evitar duplicatas
        if (todasProposicoes.some((x) => x.id === p.id)) continue;

        todasProposicoes.push(mapearProposicao(p));
      }
    } catch {
      // se falhar para um evento, segue para o próximo
      continue;
    }
  }

  return todasProposicoes;
}

/**
 * Busca proposições na base geral da Câmara, não apenas na pauta do dia.
 * Aceita tanto formatos como "PL 1625/2026" quanto palavras-chave.
 */
export async function buscarProposicoes(termo: string): Promise<Proposicao[]> {
  const busca = normalizarTermoBusca(termo);
  if (!busca.palavraChave || busca.palavraChave.length < 2) return [];

  const url = new URL(`${BASE_URL}/proposicoes`);
  url.searchParams.set("ordem", "DESC");
  url.searchParams.set("ordenarPor", "ano");
  url.searchParams.set("itens", "15");

  if (busca.siglaTipo && busca.numero && busca.ano) {
    url.searchParams.set("siglaTipo", busca.siglaTipo);
    url.searchParams.set("numero", busca.numero);
    url.searchParams.set("ano", busca.ano);
  } else {
    url.searchParams.set("keywords", busca.palavraChave);
  }

  type Resp = {
    dados: Array<{
      id: number;
      siglaTipo: string;
      numero: number;
      ano: number;
      ementa?: string;
      descricaoTipo?: string;
      urlInteiroTeor?: string;
    }>;
  };

  const resp = await fetchJson<Resp>(url.toString());
  return (resp.dados || []).map(mapearProposicao);
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
  return mapearProposicao(resp.dados);
}

/**
 * Busca destaques relacionados a uma proposição.
 * Observação: a API da Câmara pode variar a disponibilidade dos DTQs.
 * Quando não houver retorno estruturado, o app mantém campo manual como fallback.
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
      descricaoTipo?: string;
      urlInteiroTeor?: string;
      uriAutores?: string;
    }>;
  };

  try {
    const resp = await fetchJson<Resp>(url);
    const relacionadas = resp.dados || [];
    const destaques = relacionadas.filter((p) =>
      String(p.siglaTipo || "").toUpperCase().startsWith("DTQ")
    );

    return destaques.map((d) => ({
      id: d.id,
      siglaTipo: d.siglaTipo,
      numero: d.numero,
      ano: d.ano,
      identificador: formatarIdentificador(d),
      ementa: d.ementa,
      descricao: d.descricaoTipo,
      urlInteiroTeor: d.urlInteiroTeor,
    }));
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
