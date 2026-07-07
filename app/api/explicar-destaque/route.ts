import { NextResponse } from "next/server";
import { buscarPdfEmenda, buscarPdfParecer } from "@/lib/camara";

// Roda no servidor (Node), onde a chave existe. Nunca na borda/cliente.
export const runtime = "nodejs";

// Regras de forma comuns às respostas em parágrafo único (sem efeitos).
const FORMATO_PARAGRAFO = `Regras de forma (obrigatórias):
- Responda APENAS com o texto do parágrafo. Sem título, sem prefixo, sem
  rótulos, sem aspas.
- NÃO recomende voto. NÃO escreva "Voto Sim", "Voto Não", "Impacto dos
  Votos" ou equivalentes. O texto é apenas descritivo.
- NÃO use asteriscos, marcadores, negrito ou qualquer marcação — apenas
  texto corrido. (O resultado será colado no WhatsApp, onde asteriscos
  viram negrito.)`;

// Formato estruturado usado quando a posição é LIBERAR: além do parágrafo,
// a IA devolve o efeito prático de cada direção de voto em frases curtas,
// que o app insere entre parênteses nas linhas "Voto Sim" / "Voto Não".
// A DIREÇÃO do voto (mantém/suprime; aprova/rejeita) é fixa no código do
// app — a IA fornece apenas o conteúdo material de cada efeito.
function formatoComEfeitos(
  descricaoSim: string,
  descricaoNao: string
): string {
  return `Formato da resposta (obrigatório — exatamente três blocos, nesta ordem,
cada um iniciado pelo rótulo em maiúsculas no começo da linha):
EFEITO_SIM: em uma frase curta (até 20 palavras), ${descricaoSim}.
Comece com verbo no presente, letra minúscula (ex.: "mantém a exigência
de...", "preserva a competência de..."). Sem ponto final.
EFEITO_NAO: em uma frase curta (até 20 palavras), ${descricaoNao}.
Comece com verbo no presente, letra minúscula (ex.: "retira a exigência
de...", "flexibiliza a regra de..."). Sem ponto final.
EXPLICACAO: o parágrafo descritivo. NÃO repita nele a análise dos efeitos
da aprovação e da rejeição — ela já está nas linhas EFEITO_SIM/EFEITO_NAO;
encerre o parágrafo na descrição do conteúdo material.

Demais regras (obrigatórias):
- NÃO recomende voto nem escreva "Voto Sim"/"Voto Não" fora dos rótulos.
- NÃO use asteriscos, marcadores, negrito, aspas ou qualquer marcação —
  apenas texto corrido em cada bloco.`;
}

// Prompt do destaque de TEXTO (DVS): parágrafo descritivo neutro.
// NÃO recomenda voto — a direção (SIM/NÃO) já é escolhida pelo usuário no app.
function montarPromptTexto(comEfeitos: boolean): string {
  const base = `Você é um consultor legislativo especializado em análise de proposições da
Câmara dos Deputados. Sua tarefa é explicar, de forma neutra e objetiva, o
que faz um Destaque para Votação em Separado (DVS) apresentado a um
dispositivo do texto de uma proposição.

Quando um documento PDF estiver anexado (o parecer proferido em plenário ou o
substitutivo), use-o como fonte principal: localize nele o dispositivo
destacado — o artigo, parágrafo, inciso ou expressão indicado na descrição do
destaque — e leia o que ele de fato estabelece.

Escreva um parágrafo, em linguagem clara e acessível, que:
- Identifique o dispositivo atingido e o que o destaque pretende fazer com
  ele (por exemplo, suprimir, manter ou alterar).
- Explique o CONTEÚDO material do dispositivo: o que ele determina
  concretamente. Não basta citar "§ X do art. Y" — é preciso dizer o que
  aquele dispositivo estabelece, com base no texto anexado.
${
  comEfeitos
    ? ""
    : `- Explique o efeito prático e jurídico da aprovação e da rejeição do
  destaque para quem é afetado pela norma.
`
}- Baseie-se apenas no texto real da proposição/parecer/substitutivo anexado
  e na descrição do destaque. Não invente conteúdo. Se o texto anexado não
  permitir identificar o dispositivo, descreva o que for possível a partir da
  descrição, sem especular.
- Seja conciso, mas completo: normalmente de 3 a 6 frases, dada a densidade
  do conteúdo.

`;
  return (
    base +
    (comEfeitos
      ? formatoComEfeitos(
          "o efeito prático de MANTER o dispositivo destacado no texto",
          "o efeito prático de SUPRIMIR o dispositivo destacado do texto"
        )
      : FORMATO_PARAGRAFO)
  );
}

// Prompt do destaque de EMENDA: descreve o que a emenda faz.
// O texto integral da emenda (PDF) é anexado à requisição.
function montarPromptEmenda(comEfeitos: boolean): string {
  const base = `Você é um consultor legislativo especializado em análise de proposições da
Câmara dos Deputados. Foi anexado o texto integral (em PDF) de uma Emenda de
Plenário que é objeto de um destaque para votação em separado. Sua tarefa é
explicar, de forma neutra e objetiva, o que essa emenda faz.

Escreva um parágrafo, em linguagem clara e acessível, que:
- Diga o que a emenda propõe (o dispositivo que inclui, altera ou suprime),
  identificando o ponto atingido na proposição.
${
  comEfeitos
    ? ""
    : `- Explique o efeito prático e jurídico da emenda: o que muda no texto da
  proposição se a emenda for acolhida.
`
}- Baseie-se exclusivamente no texto da emenda anexada e na descrição
  fornecida. Não invente conteúdo que não esteja nesses dados.
- Seja conciso: normalmente de 2 a 4 frases.

`;
  return (
    base +
    (comEfeitos
      ? formatoComEfeitos(
          "o efeito prático de APROVAR a emenda destacada (incorporá-la ao texto)",
          "o efeito prático de REJEITAR a emenda (o texto segue como está)"
        )
      : FORMATO_PARAGRAFO)
  );
}

// Remove caracteres de controle que poderiam sujar o prompt.
function limpar(valor: unknown): string {
  return String(valor ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
}

// Extrai o número da emenda (ex.: "EMP 3" -> 3) da descrição/identificação.
function extrairNumeroEmenda(...textos: string[]): number | null {
  const texto = textos.filter(Boolean).join(" ");
  const m =
    texto.match(/\b(?:EMP|EMC|EMR|EMO|SBT|EMD)\s*n?[ºo.]?\s*(\d+)/i) ||
    texto.match(/emenda\s+(?:de\s+plen[aá]rio\s+)?(?:n[ºo.]\s*)?(\d+)/i);
  return m ? Number(m[1]) : null;
}

// Interpreta a resposta estruturada (EFEITO_SIM / EFEITO_NAO / EXPLICACAO).
// Se o modelo não seguiu o formato, devolve null e a rota degrada para o
// comportamento antigo (texto inteiro como explicação, sem efeitos).
function extrairEfeitos(
  texto: string
): { efeitoSim: string; efeitoNao: string; explicacao: string } | null {
  const mSim = texto.match(/EFEITO_SIM:\s*([\s\S]*?)\n\s*EFEITO_NAO:/i);
  const mNao = texto.match(/EFEITO_NAO:\s*([\s\S]*?)\n\s*EXPLICACAO:/i);
  const mExp = texto.match(/EXPLICACAO:\s*([\s\S]*)$/i);
  if (!mSim || !mNao || !mExp) return null;

  const normalizar = (s: string) =>
    s.replace(/\*/g, "").replace(/\s+/g, " ").replace(/[.\s]+$/, "").trim();

  const efeitoSim = normalizar(mSim[1]);
  const efeitoNao = normalizar(mNao[1]);
  const explicacao = mExp[1].replace(/\*/g, "").replace(/\s+/g, " ").trim();

  if (!efeitoSim || !efeitoNao || !explicacao) return null;
  return { efeitoSim, efeitoNao, explicacao };
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "GEMINI_API_KEY não configurada no servidor." },
      { status: 500 }
    );
  }

  let corpo: {
    fase?: string;
    posicao?: string;
    proposicao?: { id?: number; identificador?: string; ementa?: string };
    destaque?: { identificador?: string; descricao?: string };
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const fase = limpar(corpo?.fase);
  // Posição LIBERAR => a mensagem terá linhas "Voto Sim/Voto Não" e a IA
  // deve devolver também o efeito prático de cada direção (formato estruturado).
  const comEfeitos = limpar(corpo?.posicao).toUpperCase() === "LIBERAR";
  const propIdNum = Number(corpo?.proposicao?.id) || 0;
  const propId = limpar(corpo?.proposicao?.identificador);
  const propEmenta = limpar(corpo?.proposicao?.ementa);
  const dtqId = limpar(corpo?.destaque?.identificador);
  const dtqDesc = limpar(corpo?.destaque?.descricao);

  // Sem a descrição do destaque não há o que analisar.
  if (!dtqDesc) {
    return NextResponse.json(
      { ok: false, error: "Sem descrição do destaque para analisar." },
      { status: 400 }
    );
  }

  const contexto =
    `PROPOSIÇÃO: ${propId || "(não informada)"}\n` +
    `EMENTA DA PROPOSIÇÃO: ${propEmenta || "(não informada)"}\n\n` +
    `DADOS DO DESTAQUE:\n` +
    `Identificação: ${dtqId || "(não informada)"}\n` +
    `Descrição: ${dtqDesc}\n\n` +
    `Gere a resposta conforme as instruções.`;

  const modelo = "gemini-3.1-flash-lite";
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelo +
    ":generateContent?key=" +
    apiKey;

  // Monta as "parts" do prompt: texto sempre; para emenda, anexa o PDF.
  const partes: Array<Record<string, unknown>> = [];

  if (fase === "DESTAQUE_EMENDA") {
    const numero = extrairNumeroEmenda(dtqDesc, dtqId);
    if (!numero) {
      return NextResponse.json(
        { ok: false, error: "Não identifiquei o número da emenda no destaque." },
        { status: 400 }
      );
    }
    if (!propIdNum) {
      return NextResponse.json(
        { ok: false, error: "Falta o id da proposição para localizar a emenda." },
        { status: 400 }
      );
    }
    const pdf = await buscarPdfEmenda(propIdNum, numero);
    if (!pdf) {
      return NextResponse.json(
        {
          ok: false,
          error: `Não encontrei o PDF da EMP ${numero} desta proposição.`,
        },
        { status: 404 }
      );
    }
    partes.push({ text: montarPromptEmenda(comEfeitos) + "\n\n---\n\n" + contexto });
    partes.push({ inline_data: { mime_type: pdf.mimeType, data: pdf.base64 } });
  } else {
    partes.push({ text: montarPromptTexto(comEfeitos) + "\n\n---\n\n" + contexto });
    // Anexa o inteiro teor do parecer/substitutivo (quando houver) para que o
    // modelo explique o CONTEÚDO material do dispositivo destacado, não só a
    // mecânica. Se não achar o PDF, degrada para só-texto (comportamento antigo).
    if (propIdNum) {
      const pdfParecer = await buscarPdfParecer(propIdNum);
      if (pdfParecer) {
        partes.push({
          inline_data: { mime_type: pdfParecer.mimeType, data: pdfParecer.base64 },
        });
      }
    }
  }

  const payload = {
    contents: [{ parts: partes }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      thinkingConfig: { thinkingBudget: 1024 },
    },
  };

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();

    if (!resp.ok) {
      // Mensagem que o Gemini devolve no corpo (cota, sobrecarga, chave, etc.).
      const motivoGemini =
        data?.error?.message || data?.error?.status || "sem detalhe";
      // Log à parte: aparece nos Runtime Logs da Vercel. NUNCA logar a chave.
      console.error(
        `[explicar-destaque] Gemini HTTP ${resp.status} | fase=${fase} | prop=${propId} | dtq=${dtqId} | ${motivoGemini}`
      );
      return NextResponse.json(
        {
          ok: false,
          error: `Gemini (${resp.status}): ${motivoGemini}`,
          status: resp.status,
        },
        { status: 502 }
      );
    }

    const candidato = data?.candidates?.[0];
    const texto = candidato?.content?.parts?.[0]?.text?.trim() || "";

    if (!texto) {
      const motivo = candidato?.finishReason || "desconhecido";
      console.error(
        `[explicar-destaque] Gemini sem texto | motivo=${motivo} | fase=${fase} | prop=${propId} | dtq=${dtqId}`
      );
      return NextResponse.json(
        {
          ok: false,
          error: `O Gemini não retornou texto (motivo: ${motivo}).`,
        },
        { status: 502 }
      );
    }

    if (comEfeitos) {
      const estruturado = extrairEfeitos(texto);
      if (estruturado) {
        return NextResponse.json({
          ok: true,
          texto: estruturado.explicacao,
          efeitoSim: estruturado.efeitoSim,
          efeitoNao: estruturado.efeitoNao,
        });
      }
      // Modelo não seguiu o formato estruturado: degrada para o comportamento
      // antigo (texto inteiro como explicação, linhas de voto fixas no app).
      console.error(
        `[explicar-destaque] Resposta sem EFEITO_SIM/EFEITO_NAO | fase=${fase} | prop=${propId} | dtq=${dtqId}`
      );
    }

    return NextResponse.json({ ok: true, texto });
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e);
    console.error(
      `[explicar-destaque] Falha ao chamar o Gemini | fase=${fase} | prop=${propId} | dtq=${dtqId} | ${detalhe}`
    );
    return NextResponse.json(
      { ok: false, error: `Falha ao chamar o Gemini: ${detalhe}` },
      { status: 500 }
    );
  }
}
