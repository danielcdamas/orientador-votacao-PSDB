// =========================================================
// Cliente da API de Dados Abertos da Câmara dos Deputados
// Documentação oficial: https://dadosabertos.camara.leg.br/swagger/api.html
// =========================================================
import type { Destaque, Parecer, Proposicao } from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_CAMARA_API_BASE ||
  "https://dadosabertos.camara.leg.br/api/v2";

const PORTAL_URL = "https://www.camara.leg.br/proposicoesWeb";
const TIMEOUT_MS = Number(process.env.CAMARA_API_TIMEOUT_MS || 15000);

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
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(
        `API da Câmara respondeu com status ${res.status} (${res.statusText}).`
      );
    }

    return (await res.json()) as T;
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

async function fetchText(url: string): Promise<string | undefined> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "text/html,text/plain,application/pdf,*/*" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return undefined;
    return await res.text();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeoutId);
  }
}

function numeroOpcional(valor: unknown): number | undefined {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor === "string" && valor.trim()) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

export function formatarIdentificador(p: {
  siglaTipo: string;
  numero?: number | string;
  ano?: number | string;
}): string {
  const numero = numeroOpcional(p.numero);
  const ano = numeroOpcional(p.ano);
  const numeroAno = numero && ano ? ` ${numero}/${ano}` : numero ? ` ${numero}` : "";
  return `${p.siglaTipo}${numeroAno}`.trim();
}

function hojeISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function limparTexto(texto?: string): string | undefined {
  const limpo = texto
    ?.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
  return limpo || undefined;
}

function extrairNumeroDtq(...textos: Array<string | undefined>): number | undefined {
  const texto = textos.filter(Boolean).join(" ");
  const padroes = [
    /DTQ\s*(?:n\.?\s*)?(\d+)\s*=>/i,
    /DTQ\s*n[ºo.]?\s*(\d+)\b/i,
    /DTQ\s*(\d+)\b/i,
    /Destaque\s*n[ºo.]?\s*(\d+)\b/i,
    /Apresentaç[aã]o\s+do\s+DTQ\s*n\.?\s*(\d+)\b/i,
    /filename=DTQ\+?(\d+)/i,
    /filename=[^\s]*DTQ[^\d]*(\d+)/i,
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match?.[1]) return Number(match[1]);
  }

  return undefined;
}

function extrairUrlInteiroTeorDaFicha(html?: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/href=["']([^"']*prop_mostrarintegra\?[^"']+)["']/i);
  if (!match?.[1]) return undefined;

  try {
    const href = match[1].replace(/&amp;/g, "&");
    return new URL(href, "https://www.camara.leg.br").toString();
  } catch {
    return undefined;
  }
}

function extrairDescricaoDestaque(textoBruto?: string): string | undefined {
  const texto = limparTexto(textoBruto);
  if (!texto) return undefined;

  const padroes = [
    /(destaque\s+para\s+.{20,500}?)(?:Sala\s+das\s+Sessões|SALA\s+DAS\s+SESSÕES|Assinado eletronicamente|Para encaminhar|\*CD|$)/i,
    /(destaque\s+de\s+.{20,500}?)(?:Sala\s+das\s+Sessões|SALA\s+DAS\s+SESSÕES|Assinado eletronicamente|Para encaminhar|\*CD|$)/i,
    /(destaque\s+em\s+separado\s+.{20,500}?)(?:Sala\s+das\s+Sessões|SALA\s+DAS\s+SESSÕES|Assinado eletronicamente|Para encaminhar|\*CD|$)/i,
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match?.[1]) return limparTexto(match[1])?.replace(/\s+\.$/, ".");
  }

  return undefined;
}

function extrairApresentantePolitico(...textos: Array<string | undefined>): string | undefined {
  const texto = limparTexto(textos.filter(Boolean).join(" "));
  if (!texto) return undefined;

  const padroes = [
    /(?:L[ií]der|Vice-L[ií]der)\s+do\s+Bloco\s+Parlamentar\s+([^.;\n]+?)(?:\s+apresenta|\s+requer|\.|;|$)/i,
    /(?:L[ií]der|Vice-L[ií]der)\s+da\s+Federaç[aã]o\s+([^.;\n]+?)(?:\s+apresenta|\s+requer|\.|;|$)/i,
    /(?:L[ií]der|Vice-L[ií]der)\s+do\s+Partido\s+([^.;\n]+?)(?:\s+apresenta|\s+requer|\.|;|$)/i,
    /pela\s+Federaç[aã]o\s+([^.;\n]+?)(?:\s+apresenta|\s+requer|\.|;|$)/i,
    /pelo\s+Bloco\s+Parlamentar\s+([^.;\n]+?)(?:\s+apresenta|\s+requer|\.|;|$)/i,
    /pelo\s+Partido\s+([^.;\n]+?)(?:\s+apresenta|\s+requer|\.|;|$)/i,
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match?.[1]) return limparTexto(match[1]);
  }

  return undefined;
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
  ementaDetalhada?: string;
  descricaoTipo?: string;
  urlInteiroTeor?: string;
  statusProposicao?: Proposicao["statusProposicao"];
}): Proposicao {
  return {
    id: d.id,
    siglaTipo: d.siglaTipo,
    numero: d.numero,
    ano: d.ano,
    ementa: limparTexto(d.ementa) || "(Sem ementa cadastrada.)",
    ementaDetalhada: limparTexto(d.ementaDetalhada),
    identificador: formatarIdentificador(d),
    descricaoTipo: d.descricaoTipo,
    urlInteiroTeor: d.urlInteiroTeor,
    statusProposicao: d.statusProposicao,
  };
}

export async function buscarPautaDoDia(): Promise<Proposicao[]> {
  const hoje = hojeISO();
  const PLENARIO_ID = 180;

  const urlEventos = new URL(`${BASE_URL}/eventos`);
  urlEventos.searchParams.set("idOrgao", String(PLENARIO_ID));
  urlEventos.searchParams.set("dataInicio", hoje);
  urlEventos.searchParams.set("dataFim", hoje);
  urlEventos.searchParams.set("ordem", "ASC");
  urlEventos.searchParams.set("ordenarPor", "dataHoraInicio");

  type EventosResp = { dados: Array<{ id: number; descricao: string }> };
  let eventos = await fetchJson<EventosResp>(urlEventos.toString());

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

  if (!eventos.dados || eventos.dados.length === 0) return [];

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
      const pauta = await fetchJson<PautaResp>(`${BASE_URL}/eventos/${evento.id}/pauta`);

      for (const item of pauta.dados || []) {
        const p = item.proposicao_;
        if (!p) continue;
        if (todasProposicoes.some((x) => x.id === p.id)) continue;
        todasProposicoes.push(mapearProposicao(p));
      }
    } catch {
      continue;
    }
  }

  return todasProposicoes;
}

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
      ementaDetalhada?: string;
      descricaoTipo?: string;
      urlInteiroTeor?: string;
    }>;
  };

  const resp = await fetchJson<Resp>(url.toString());
  return (resp.dados || []).map(mapearProposicao);
}

export async function buscarProposicao(id: number): Promise<Proposicao> {
  const url = `${BASE_URL}/proposicoes/${id}`;
  type Resp = {
    dados: {
      id: number;
      siglaTipo: string;
      numero: number;
      ano: number;
      ementa: string;
      ementaDetalhada?: string;
      descricaoTipo?: string;
      urlInteiroTeor?: string;
      statusProposicao?: Proposicao["statusProposicao"];
    };
  };

  const resp = await fetchJson<Resp>(url);
  return mapearProposicao(resp.dados);
}

async function buscarAutorPrincipal(idProposicao: number): Promise<{
  nome?: string;
  partido?: string;
}> {
  type Resp = {
    dados: Array<{
      nome?: string;
      siglaPartido?: string;
    }>;
  };

  try {
    const resp = await fetchJson<Resp>(`${BASE_URL}/proposicoes/${idProposicao}/autores`);
    const autor = resp.dados?.[0];
    if (!autor) return {};
    return {
      nome: limparTexto(autor.nome),
      partido: limparTexto(autor.siglaPartido),
    };
  } catch {
    return {};
  }
}

async function detalharDestaque(
  base: {
    id: number;
    siglaTipo: string;
    numero?: number | string;
    ano?: number | string;
    ementa?: string;
    ementaDetalhada?: string;
    descricaoTipo?: string;
    urlInteiroTeor?: string;
  },
  numeroFallback: number
): Promise<Destaque> {
  type RespDetalhe = {
    dados: {
      id: number;
      siglaTipo: string;
      numero?: number;
      ano?: number;
      ementa?: string;
      ementaDetalhada?: string;
      descricaoTipo?: string;
      urlInteiroTeor?: string;
    };
  };

  let dados = base;

  try {
    const detalhe = await fetchJson<RespDetalhe>(`${BASE_URL}/proposicoes/${base.id}`);
    dados = { ...base, ...detalhe.dados };
  } catch {
    // Mantém os dados resumidos da lista de relacionadas.
  }

  const fichaHtml = await fetchText(`${PORTAL_URL}/fichadetramitacao?idProposicao=${base.id}`);
  const urlInteiroTeor = dados.urlInteiroTeor || extrairUrlInteiroTeorDaFicha(fichaHtml);
  const textoInteiroTeor = urlInteiroTeor ? await fetchText(urlInteiroTeor) : undefined;
  const autor = await buscarAutorPrincipal(base.id);

  const numero =
    numeroOpcional(dados.numero) ||
    extrairNumeroDtq(
      dados.ementa,
      dados.ementaDetalhada,
      dados.descricaoTipo,
      dados.urlInteiroTeor,
      fichaHtml,
      textoInteiroTeor
    ) ||
    numeroFallback;
  const ano = numeroOpcional(dados.ano);
  const descricaoExtraida = extrairDescricaoDestaque(textoInteiroTeor);
  const ementaDetalhada = limparTexto(dados.ementaDetalhada);
  const ementa = limparTexto(dados.ementa);
  const apresentante = extrairApresentantePolitico(
    textoInteiroTeor,
    fichaHtml,
    ementaDetalhada,
    ementa,
    autor.partido
  );

  return {
    id: dados.id,
    siglaTipo: dados.siglaTipo,
    numero,
    ano,
    identificador: formatarIdentificador({
      siglaTipo: dados.siglaTipo,
      numero,
      ano,
    }),
    ementa,
    ementaDetalhada,
    descricao: descricaoExtraida || ementaDetalhada || ementa || limparTexto(dados.descricaoTipo),
    autor: autor.nome,
    partidoAutor: autor.partido,
    apresentante: apresentante || autor.partido,
    urlInteiroTeor,
  };
}

export async function buscarDestaques(id: number): Promise<Destaque[]> {
  const url = `${BASE_URL}/proposicoes/${id}/relacionadas`;

  type Resp = {
    dados: Array<{
      id: number;
      siglaTipo: string;
      numero?: number | string;
      ano?: number | string;
      ementa?: string;
      ementaDetalhada?: string;
      descricaoTipo?: string;
      urlInteiroTeor?: string;
    }>;
  };

  try {
    const resp = await fetchJson<Resp>(url);
    const destaques = (resp.dados || []).filter((p) =>
      String(p.siglaTipo || "").toUpperCase().startsWith("DTQ")
    );

    const detalhados = await Promise.all(
      destaques.map((d, index) => detalharDestaque(d, index + 1))
    );

    return detalhados.sort((a, b) => (a.numero || 0) - (b.numero || 0));
  } catch {
    return [];
  }
}

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
