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

function ehRequerimentoInterstício(proposicao: Proposicao): boolean {
  const ementa = (proposicao.ementa || "").toLowerCase();
  return (
    proposicao.siglaTipo.toUpperCase() === "REQ" &&
    ementa.includes("interstício")
  );
}

function resumirEmenta(texto: string): string {
  const limpo = texto.trim().replace(/\s+/g, " ");

  // Se a ementa já é curta, mantém integral
  if (limpo.length <= 180) return limpo;

  // 1) Tenta encontrar o padrão "Altera a Lei nº X, de DATA," e troca por "Altera a Lei nº X"
  let resumido = limpo.replace(
    /(Altera|Modifica|Acrescenta|Inclui|Revoga)\s+a\s+Lei\s+n[ºo.]\s*([\d.]+),?\s+de\s+\d{1,2}\s+de\s+\w+\s+de\s+\d{4},?/i,
    "$1 a Lei nº $2"
  );

  // 2) Se ainda estiver longa, corta no primeiro ponto final seguido de espaço
  if (resumido.length > 220) {
    const primeiroPonto = resumido.indexOf(". ");
    if (primeiroPonto > 50 && primeiroPonto < 200) {
      resumido = resumido.slice(0, primeiroPonto + 1);
    }
  }

  // 3) Se mesmo assim continuar muito longa, trunca de forma educada
  if (resumido.length > 260) {
    resumido = resumido.slice(0, 240).replace(/[,;:\s]+\S*$/, "") + "...";
  }

  return resumido;
}

function adaptarEmenta(proposicao: Proposicao): string {
  const original = proposicao.ementa
    ? proposicao.ementa.trim().replace(/\s+/g, " ")
    : "(Ementa não disponível.)";

  if (ehRequerimentoUrgencia(proposicao)) {
    return original
      .replace(/^requer,?\s+nos\s+termos\s+do\s+art\.\s*155\s+do\s+ricd,?\s*/i, "")
      .replace(/^requer\s+urgência\s+para/i, "urgência para")
      .replace(/^requer\s+/i, "")
      .replace(/^urgência\s+urgentíssima\s+para/i, "urgência para")
      .trim();
  }

  if (ehRequerimentoInterstício(proposicao)) {
    return original
      .replace(/^requer,?\s+/i, "")
      .replace(/^solicita,?\s+/i, "")
      .trim();
  }

  return resumirEmenta(original);
}

function formatarOrientacao(valor: "SIM" | "NAO"): string {
  return valor === "SIM" ? "*SIM*" : "*NÃO*";
}

function obterIdentificadorDestaque(
  destaque: Destaque | null | undefined,
  manual: string | undefined
): string {
  const idBase = destaque?.identificador || sanitizarTexto(manual || "");
  const apresentante = sanitizarTexto(destaque?.apresentante || "");

  if (idBase && apresentante) return `${idBase} – ${apresentante}`;
  return idBase;
}

function limparDescricaoDestaque(texto: string): string {
  let limpo = sanitizarTexto(texto).replace(/\s+/g, " ");

  limpo = limpo
    .replace(/^DESTAQUE\s+PARA\s+VOTAÇÃO\s+EM\s+SEPARADO\s*-\s*[^.]*?Senhor\(a\)\s+Presidente,?\s*/i, "")
    .replace(/^DESTAQUE\s+DE\s+EMENDA\s*-\s*[^.]*?Senhor\(a\)\s+Presidente,?\s*/i, "")
    .replace(/^Destaque\s+para\s+Votação\s+em\s+Separado\s*-\s*[^.]*?Senhor\(a\)\s+Presidente,?\s*/i, "")
    .replace(/^Destaque\s+de\s+Emenda\s*-\s*[^.]*?Senhor\(a\)\s+Presidente,?\s*/i, "")
    .replace(/^Senhor\(a\)\s+Presidente,?\s*/i, "")
    .replace(/^Requeiro\s+a\s+V\.\s*Exa?,?\s+nos\s+termos\s+do\s+art\.\s*161,?\s*I,?\s+do\s+Regimento\s+Interno\s+da\s+Câmara\s+dos\s+Deputados,?\s*/i, "")
    .replace(/\s+apresentado\s+à\(ao\)\s+[^.]+$/i, "")
    .replace(/\s+apresentado\s+ao\s+[^.]+$/i, "")
    .trim();

  if (/^destaque\s+para/i.test(limpo)) {
    limpo = limpo.replace(/^destaque/i, "Destaque");
  }

  if (limpo && !/[.!?]$/.test(limpo)) limpo += ".";
  return limpo;
}

function descricaoDestaque(destaque: Destaque | null | undefined): string {
  const bruto = destaque?.descricao || destaque?.ementaDetalhada || destaque?.ementa || "";
  return limparDescricaoDestaque(bruto);
}

function rotuloDestaque(
  fase: Fase,
  destaque: Destaque | null | undefined,
  orientacao: "SIM" | "NAO"
): string {
  if (fase === "DESTAQUE_TEXTO") {
    return orientacao === "SIM"
      ? "à manutenção do texto objeto do Destaque para Votação em Separado"
      : "à supressão do texto objeto do Destaque para Votação em Separado";
  }

  if (fase === "DESTAQUE_EMENDA") {
    const texto = `${destaque?.ementa || ""} ${destaque?.ementaDetalhada || ""} ${destaque?.descricao || ""}`;
    const emenda = texto.match(/(?:EMP|emenda)\s+(?:de\s+plen[aá]rio\s+)?(?:n[ºo.]\s*)?(\d+)/i);
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

  // Decide o que mostrar no topo do WhatsApp:
  // - REQ de urgência: mostra o ALVO com prefixo "urgência à proposição que..."
  // - REQ de quebra de interstício: mostra o próprio REQ (com "Requer" removido)
  // - Parecer (PAR/PPR/PRLP/PRLE/PEP/PPP/PRL): mostra a PROPOSIÇÃO-ALVO
  // - Demais: mostra a própria proposição
  const alvo = proposicao.proposicaoAlvo;
  if (alvo && ehRequerimentoUrgencia(proposicao)) {
    const ementaAlvoBruta = (alvo.ementa || "(Ementa não disponível.)").trim().replace(/\s+/g, " ");
    const ementaAlvo = resumirEmenta(ementaAlvoBruta);
    // Primeira letra em minúscula para encaixar depois de "que"
    const ementaMinuscula = ementaAlvo.charAt(0).toLowerCase() + ementaAlvo.slice(1);
    linhas.push(`${alvo.identificador} – urgência à proposição que ${ementaMinuscula}`);
  } else if (alvo && ehRequerimentoInterstício(proposicao)) {
    // Para interstício, mostra o próprio REQ com "Requer" removido
    const ementa = adaptarEmenta(proposicao);
    linhas.push(`${proposicao.identificador} – ${ementa}`);
  } else if (alvo) {
    // Parecer e demais casos: mostra a proposição-alvo
    const ementaAlvo = resumirEmenta(
      (alvo.ementa || "(Ementa não disponível.)").trim().replace(/\s+/g, " ")
    );
    linhas.push(`${alvo.identificador} – ${ementaAlvo}`);
  } else {
    const ementa = adaptarEmenta(proposicao);
    linhas.push(`${proposicao.identificador} – ${ementa}`);
  }
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
        destaqueSelecionado,
        orientacao
      )}${complemento}.`
    );

    const just = sanitizarTexto(justificativa || "");
    const desc = just || descricaoDestaque(destaqueSelecionado);
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

    let rotulo = regra.rotuloFase;
    if (fase === "MERITO" && ehRequerimentoUrgencia(proposicao)) {
      rotulo = "à urgência";
    } else if (fase === "MERITO" && ehRequerimentoInterstício(proposicao)) {
      rotulo = "à quebra de interstício";
    }

    if (orientacaoNegrito) {
      linhas.push(`${FEDERACAO} orienta ${orientacaoNegrito} ${rotulo}.`);
    } else {
      linhas.push(`${FEDERACAO} – orientação ${rotulo} depende de *análise técnica*.`);
    }

    const just = sanitizarTexto(justificativa || "");
    if (just) {
      linhas.push("");
      linhas.push(just);
    }
  }

  return linhas.join("\n").replace(/\n{3,}/g, "\n\n");
}

export function gerarPreview(dados: DadosMensagem): string {
  return gerarMensagem(dados);
}
