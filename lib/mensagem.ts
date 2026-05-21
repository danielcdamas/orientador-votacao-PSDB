// =========================================================
// Gerador de mensagem para WhatsApp
// =========================================================
// REGRAS CRÍTICAS DE FORMATAÇÃO (não alterar sem alinhamento
// com a liderança):
// 1) "*VOTAÇÃO NOMINAL*" sempre em negrito (asteriscos)
// 2) "*SIM*" ou "*NÃO*" sempre em negrito
// 3) Linha em branco entre os blocos de informação
// 4) Nunca gerar bloco "colado" sem separação
// =========================================================

import type { DadosMensagem } from "@/types";
import { aplicarRegra } from "./regras";

const FEDERACAO =
  process.env.NEXT_PUBLIC_FEDERACAO_NOME || "Federação PSDB/CID";

/**
 * Sanitiza texto livre (justificativa, identificador de destaque)
 * removendo caracteres que possam quebrar a mensagem.
 */
export function sanitizarTexto(texto: string): string {
  if (!texto) return "";
  return texto
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // remove caracteres de controle exceto quebra de linha
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "")
    // limita tamanho a 1000 caracteres
    .slice(0, 1000)
    .trim();
}

/**
 * Gera a mensagem final pronta para colar no WhatsApp.
 *
 * Formato base:
 *
 *   *VOTAÇÃO NOMINAL*
 *
 *   [PROPOSIÇÃO] – [EMENTA]
 *
 *   Federação PSDB/CID orienta *SIM/NÃO* [complemento].
 *
 *   [Justificativa opcional.]
 */
export function gerarMensagem(dados: DadosMensagem): string {
  const { proposicao, posicao, fase, justificativa, identificadorDestaque, destaque } =
    dados;

  if (!proposicao || !posicao || !fase) {
    throw new Error(
      "Para gerar a mensagem, é preciso escolher proposição, posição e fase."
    );
  }

  const regra = aplicarRegra(posicao, fase);

  // Cabeçalho
  const linhas: string[] = [];
  linhas.push("*VOTAÇÃO NOMINAL*");
  linhas.push(""); // linha em branco

  // Proposição + ementa
  const ementa = proposicao.ementa
    ? proposicao.ementa.trim().replace(/\s+/g, " ")
    : "(Ementa não disponível.)";
  linhas.push(`${proposicao.identificador} – ${ementa}`);
  linhas.push(""); // linha em branco

  // Linha de orientação
  let textoOrientacao: string;
  const orientacaoNegrito =
    regra.orientacao === "SIM"
      ? "*SIM*"
      : regra.orientacao === "NAO"
        ? "*NÃO*"
        : null;

  if (orientacaoNegrito) {
    // Caso normal: SIM ou NÃO
    if (fase === "DESTAQUE_TEXTO" && identificadorDestaque && identificadorDestaque.trim()) {
      // Para destaque de texto: "à manutenção do texto, objeto do destaque para votação em separado (DTQ 1 – NOVO)"
      const dtqInfo = sanitizarTexto(identificadorDestaque);
      textoOrientacao = `${FEDERACAO} orienta ${orientacaoNegrito} à manutenção do texto, objeto do destaque para votação em separado (${dtqInfo}).`;
    } else if (
      fase === "DESTAQUE_EMENDA" &&
      destaque &&
      identificadorDestaque &&
      identificadorDestaque.trim()
    ) {
      // Para destaque de emenda: "à Emenda de Plenário nº 3 (DTQ 7 – APRESENTANTE)"
      const numeroEmenda = destaque.numero || "?";
      const apresentante = destaque.apresentante ? ` – ${destaque.apresentante}` : "";
      const dtqInfo = sanitizarTexto(identificadorDestaque);
      textoOrientacao = `${FEDERACAO} orienta ${orientacaoNegrito} à Emenda de Plenário nº ${numeroEmenda} (${dtqInfo}${apresentante}).`;
    } else {
      textoOrientacao = `${FEDERACAO} orienta ${orientacaoNegrito} ${regra.rotuloFase}.`;
    }
  } else {
    // Caso "ANÁLISE TÉCNICA"
    if (fase === "DESTAQUE_EMENDA" && destaque && identificadorDestaque && identificadorDestaque.trim()) {
      // Para destaque de emenda com análise técnica
      const numeroEmenda = destaque.numero || "?";
      const apresentante = destaque.apresentante ? ` – ${destaque.apresentante}` : "";
      const dtqInfo = sanitizarTexto(identificadorDestaque);
      textoOrientacao = `${FEDERACAO} – orientação à Emenda de Plenário nº ${numeroEmenda} (${dtqInfo}${apresentante}) depende de *análise técnica*.`;
    } else if (fase === "DESTAQUE_TEXTO" && identificadorDestaque && identificadorDestaque.trim()) {
      const dtqInfo = sanitizarTexto(identificadorDestaque);
      textoOrientacao = `${FEDERACAO} – orientação ao destaque para votação em separado (${dtqInfo}) depende de *análise técnica*.`;
    } else {
      const sufixoDestaque =
        (fase === "DESTAQUE_TEXTO" || fase === "DESTAQUE_EMENDA") &&
        identificadorDestaque &&
        identificadorDestaque.trim()
          ? ` (${sanitizarTexto(identificadorDestaque)})`
          : "";
      textoOrientacao = `${FEDERACAO} – orientação ${regra.rotuloFase}${sufixoDestaque} depende de *análise técnica*.`;
    }
  }
  linhas.push(textoOrientacao);

  // Justificativa opcional
  const just = sanitizarTexto(justificativa || "");
  if (just) {
    linhas.push(""); // linha em branco
    linhas.push(just);
  }

  // Junta com quebras de linha e garante apenas uma linha em branco entre blocos
  return linhas.join("\n").replace(/\n{3,}/g, "\n\n");
}

/**
 * Versão "preview" para mostrar na UI.
 * É idêntica à versão final — o WhatsApp interpreta os asteriscos.
 */
export function gerarPreview(dados: DadosMensagem): string {
  return gerarMensagem(dados);
}
