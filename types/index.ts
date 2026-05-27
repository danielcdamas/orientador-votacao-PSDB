// =========================================================
// Tipos compartilhados do app
// =========================================================

/** Posição do partido em relação à matéria */
export type Posicao = "A_FAVOR" | "CONTRA";

/** Orientação específica para um destaque */
export type OrientacaoDestaque = "SIM" | "NAO";

/** Fase da votação */
export type Fase =
  | "RETIRADA_PAUTA"
  | "ADIAMENTO_DISCUSSAO"
  | "ADIAMENTO_VOTACAO"
  | "MERITO"
  | "DESTAQUE_TEXTO"
  | "DESTAQUE_EMENDA";

/** Orientação resultante (SIM, NÃO ou ANÁLISE) */
export type Orientacao = "SIM" | "NAO" | "ANALISE";

/** Proposição vinda da API da Câmara */
export interface Proposicao {
  id: number;
  siglaTipo: string;
  numero: number;
  ano: number;
  ementa: string;
  /** Texto identificador, ex.: "PL 4822/2025" */
  identificador: string;
  /** Resumo curto (opcional, vindo de campos auxiliares) */
  descricaoTipo?: string;
  /** Texto mais completo, quando a API disponibilizar */
  ementaDetalhada?: string;
  /** Link para o inteiro teor (quando disponível) */
  urlInteiroTeor?: string;
  /** Status atual (quando disponível) */
statusProposicao?: {
    descricaoSituacao?: string;
    descricaoTramitacao?: string;
    despacho?: string;
    dataHora?: string;
  };
  /** Quando o item da pauta é um requerimento (REQ) sobre outra proposição
   *  (ex.: urgência de um PLP), guarda a proposição-alvo. A lista mostra o REQ,
   *  mas o texto do WhatsApp usa esta proposição-alvo. */
  proposicaoAlvo?: {
    id: number;
    siglaTipo: string;
    numero: number;
    ano: number;
    ementa: string;
    identificador: string;
  };
}

/** Destaque apresentado à proposição */
export interface Destaque {
  id: number;
  siglaTipo: string;
  numero?: number;
  ano?: number;
  identificador: string;
  ementa?: string;
  ementaDetalhada?: string;
  descricao?: string;
  /** Pessoa que assinou/apresentou formalmente o destaque */
  autor?: string;
  partidoAutor?: string;
  /** Partido, Federação ou Bloco Parlamentar em nome do qual o destaque foi apresentado */
  apresentante?: string;
  urlInteiroTeor?: string;
}

/** Último parecer do relator */
export interface Parecer {
  idProposicaoRelatada: number;
  relator?: string;
  partidoRelator?: string;
  ufRelator?: string;
  urlInteiroTeorParecer?: string;
  dataApresentacao?: string;
  ementa?: string;
}

/** Resposta padrão da API interna */
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Dados para gerar a mensagem */
export interface DadosMensagem {
  proposicao: Proposicao | null;
  posicao: Posicao | null;
  fase: Fase | null;
  justificativa?: string;
  /** Texto do destaque (DTQ X - NOVO/SUPRESSIVO/etc), opcional */
  identificadorDestaque?: string;
  /** Destaque selecionado a partir da API da Câmara */
  destaqueSelecionado?: Destaque | null;
  /** Orientação definida pelo usuário para o destaque */
  orientacaoDestaque?: OrientacaoDestaque | null;
}
