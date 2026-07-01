import { NextResponse } from "next/server";

// Roda no servidor (Node), onde a chave existe. Nunca na borda/cliente.
export const runtime = "nodejs";

// Prompt aprovado: gera SÓ o parágrafo descritivo neutro do destaque de texto.
// NÃO recomenda voto — a direção (SIM/NÃO) já é escolhida pelo usuário no app.
const PROMPT_DESTAQUE_TEXTO = `Você é um consultor legislativo especializado em análise de proposições da
Câmara dos Deputados. Sua tarefa é explicar, de forma neutra e objetiva, o
que faz um Destaque para Votação em Separado (DVS) apresentado a uma proposição.

Escreva UM único parágrafo, em linguagem clara e acessível, que:
- Diga o que o destaque pretende fazer (por exemplo, suprimir determinado
  dispositivo, expressão ou artigo), identificando o dispositivo atingido.
- Explique o efeito prático e jurídico dessa alteração: o que aquele
  dispositivo estabelece hoje e o que muda se o destaque for aprovado.
- Baseie-se no texto real da proposição/parecer/substitutivo e na descrição
  do destaque. Não invente conteúdo que não esteja nesses dados.

Regras de forma (obrigatórias):
- Responda APENAS com o texto do parágrafo. Sem título, sem prefixo, sem
  rótulos, sem aspas.
- NÃO recomende voto. NÃO escreva "Voto Sim", "Voto Não", "Impacto dos
  Votos" ou equivalentes. O texto é apenas descritivo.
- NÃO use asteriscos, marcadores, negrito ou qualquer marcação — apenas
  texto corrido. (O resultado será colado no WhatsApp, onde asteriscos
  viram negrito.)
- Seja conciso: normalmente de 2 a 4 frases.`;

// Remove caracteres de controle que poderiam sujar o prompt.
function limpar(valor: unknown): string {
  return String(valor ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
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
    proposicao?: { identificador?: string; ementa?: string };
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
    `Gere o parágrafo descritivo deste destaque conforme as instruções.`;

  const modelo = "gemini-2.5-flash";
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelo +
    ":generateContent?key=" +
    apiKey;

  const payload = {
    contents: [
      { parts: [{ text: PROMPT_DESTAQUE_TEXTO + "\n\n---\n\n" + contexto }] },
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
  };

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { ok: false, error: "O Gemini retornou um erro.", status: resp.status },
        { status: 502 }
      );
    }

    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!texto) {
      return NextResponse.json(
        { ok: false, error: "O Gemini não retornou texto." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, texto });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: "Falha ao chamar o Gemini.",
        detalhe: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
