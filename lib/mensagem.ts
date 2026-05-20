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

import type { DadosMensagem, Destaque, Fase, Proposicao } from "@/types";
import { aplicarRegra } from "./regras";

const FEDERACAO =
  process.env.NEXT_PUBLIC_FEDERACAO_NOME || "Federação PSDB/CID";

export function sanitizarTexto(texto: string): string {
  if (!texto) return "";
  return texto
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, "")
    .slice(0, 1500)
    .trim();
}

function ehRequerimentoUrgencia(proposicao: Proposicao): boolean {
  const texto = `${proposicao.identificador} ${proposicao.ementa}`.toLowerCase();
  return proposicao.siglaTipo.toUpperCase() === "REQ" && texto.includes("urgência");
}

function adaptarEmenta(proposicao: Proposicao): string {
  const original = proposicao.ementa
    ? proposicao.ementa.trim().replace(/\s+/g, " ")
    : "(Ementa não disponível.)";

  if (!ehRequerimentoUrgencia(proposicao)) return original;

  return original
    .replace(/^requer,?\s+nos\s+termos\s+do\s+art\.\s*155\s+do\s+ricd,?\s*/i, "")
    .replace(/^requer\s+urgência\s+para/i, "urgência para")
    .replace(/^requer\s+/i, "")
    .replace(/^urgência\s+urgentíssima\s+para/i, "urgência para")
    .trim();
}

function formatarOrientacao(valor: "SIM" | "NAO"): string {
  return valor === "SIM" ? "*SIM*" : "*NÃO*";
}

function obterIdentificadorDestaque(destaque: Destaque | null | undefined, manual: string | undefined): string {
  if (destaque?.identificador) return destaque.identificador;
  return sanitizarTexto(manual || "");
}

function descricaoDestaque(destaque: Destaque | null | undefined): string {
  const ementa = sanitizarTexto(destaque?.ementa || "");
  if (ementa) return ementa;
  return sanitizarTexto(destaque?.descricao || "");
}

function rotuloDestaque(fase: Fase, destaque: Destaque | null | undefined): string {
  if (fase === "DESTAQUE_EMENDA") {
    const texto = `${destaque?.ementa || ""} ${destaque?.descricao || ""}`;
    const emenda = texto.match(/emenda\s+(?:de\s+plen[aá]rio\s+)?(?:n[ºo.]\s*)?(\d+)/i);
    if (emenda?.[1]) return `à Emenda de Plenário nº ${emenda[1]}`;
    return "à emenda destacada";
  }
  return "ao texto";
}

export function gerarMensagem(dados: DadosMensagem): string {
  const {
    proposicao,
    posicao,
    fase,
    justificativa,
    identificadorDestaque,
    destaqueSelecionado,
    orientacaoDestaque,
  } = dados;

  if (!proposicao || !posicao || !fase) {
    throw new Error(
      "Para gerar a mensagem, é preciso escolher proposição, posição e fase."
    );
  }

  const linhas: string[] = [];
  linhas.push("*VOTAÇÃO NOMINAL*");
  linhas.push("");

  const ementa = adaptarEmenta(proposicao);
  linhas.push(`${proposicao.identificador} – ${ementa}`);
  linhas.push("");

  const ehDestaque = fase === "DESTAQUE_TEXTO" || fase === "DESTAQUE_EMENDA";

  if (ehDestaque) {
    const orientacao = orientacaoDestaque || (posicao === "A_FAVOR" ? "SIM" : "NAO");
    const orientacaoNegrito = formatarOrientacao(orientacao);
    const idDtq = obterIdentificadorDestaque(destaqueSelecionado, identificadorDestaque);
    const complemento = idDtq ? ` (${idDtq})` : "";

    linhas.push(
      `${FEDERACAO} orienta ${orientacaoNegrito} ${rotuloDestaque(
        fase,
        destaqueSelecionado
      )}${complemento}.`
    );

    const desc = descricaoDestaque(destaqueSelecionado);
    if (desc) {
      linhas.push("");
      linhas.push(desc);
    }
  } else {
    const regra = aplicarRegra(posicao, fase);
    const orientacaoNegrito =
      regra.orientacao === "SIM"
        ? "*SIM*"
        : regra.orientacao === "NAO"
          ? "*NÃO*"
          : null;

    const rotulo =
      fase === "MERITO" && ehRequerimentoUrgencia(proposicao)
        ? "à urgência"
        : regra.rotuloFase;

    if (orientacaoNegrito) {
      linhas.push(`${FEDERACAO} orienta ${orientacaoNegrito} ${rotulo}.`);
    } else {
      linhas.push(`${FEDERACAO} – orientação ${rotulo} depende de *análise técnica*.`);
    }
  }

  const just = sanitizarTexto(justificativa || "");
  if (just) {
    linhas.push("");
    linhas.push(just);
  }

  return linhas.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function gerarPreview(dados: DadosMensagem): string {
  return gerarMensagem(dados);
}
