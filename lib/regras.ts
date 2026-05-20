// =========================================================
// REGRAS LEGISLATIVAS — Federação PSDB/CID
// =========================================================
// Este módulo concentra TODAS as regras de orientação.
// Mantenha-o isolado para facilitar manutenção pela liderança.
// =========================================================

import type { Fase, Orientacao, Posicao } from "@/types";

/**
 * Resultado da aplicação da regra:
 * - orientacao: SIM, NÃO ou ANÁLISE (depende de análise técnica)
 * - exigeAnalise: true quando depende de análise técnica
 * - rotuloFase: rótulo legível da fase (para mensagem)
 */
export interface ResultadoRegra {
  orientacao: Orientacao;
  exigeAnalise: boolean;
  rotuloFase: string;
}

/**
 * Rótulos legíveis das fases (usados nas mensagens).
 */
export const ROTULO_FASE: Record<Fase, string> = {
  RETIRADA_PAUTA: "ao requerimento de retirada de pauta",
  ADIAMENTO_DISCUSSAO: "ao requerimento de adiamento da discussão",
  ADIAMENTO_VOTACAO: "ao requerimento de adiamento da votação",
  MERITO: "ao mérito da matéria",
  DESTAQUE_TEXTO: "ao texto",
  DESTAQUE_EMENDA: "ao destaque de emenda",
};

/**
 * Lista de fases disponíveis na UI, na ordem de exibição.
 */
export const FASES_DISPONIVEIS: Array<{ value: Fase; label: string }> = [
  { value: "RETIRADA_PAUTA", label: "Retirada de pauta" },
  { value: "ADIAMENTO_DISCUSSAO", label: "Adiamento da discussão" },
  { value: "ADIAMENTO_VOTACAO", label: "Adiamento da votação" },
  { value: "MERITO", label: "Mérito da matéria" },
  { value: "DESTAQUE_TEXTO", label: "Destaque de texto" },
  { value: "DESTAQUE_EMENDA", label: "Destaque de emenda" },
];

/**
 * Aplica as regras legislativas da Federação PSDB/CID.
 *
 * REGRAS:
 *
 * Se A FAVOR da matéria:
 *   - retirada de pauta        -> NÃO
 *   - adiamento da discussão   -> NÃO
 *   - adiamento da votação     -> NÃO
 *   - mérito                   -> SIM
 *   - destaque de texto        -> SIM
 *   - destaque de emenda       -> ANÁLISE TÉCNICA
 *
 * Se CONTRA a matéria:
 *   - retirada de pauta        -> SIM
 *   - adiamento da discussão   -> SIM
 *   - adiamento da votação     -> SIM
 *   - mérito                   -> NÃO
 *   - destaque de texto        -> ANÁLISE TÉCNICA
 *   - destaque de emenda       -> ANÁLISE TÉCNICA
 */
export function aplicarRegra(posicao: Posicao, fase: Fase): ResultadoRegra {
  const rotuloFase = ROTULO_FASE[fase];

  if (posicao === "A_FAVOR") {
    switch (fase) {
      case "RETIRADA_PAUTA":
      case "ADIAMENTO_DISCUSSAO":
      case "ADIAMENTO_VOTACAO":
        return { orientacao: "NAO", exigeAnalise: false, rotuloFase };
      case "MERITO":
      case "DESTAQUE_TEXTO":
        return { orientacao: "SIM", exigeAnalise: false, rotuloFase };
      case "DESTAQUE_EMENDA":
        return { orientacao: "ANALISE", exigeAnalise: true, rotuloFase };
    }
  }

  // posicao === "CONTRA"
  switch (fase) {
    case "RETIRADA_PAUTA":
    case "ADIAMENTO_DISCUSSAO":
    case "ADIAMENTO_VOTACAO":
      return { orientacao: "SIM", exigeAnalise: false, rotuloFase };
    case "MERITO":
      return { orientacao: "NAO", exigeAnalise: false, rotuloFase };
    case "DESTAQUE_TEXTO":
    case "DESTAQUE_EMENDA":
      return { orientacao: "ANALISE", exigeAnalise: true, rotuloFase };
  }
}
