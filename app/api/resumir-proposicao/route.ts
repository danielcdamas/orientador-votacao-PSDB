// =========================================================
// Rota: POST /api/resumir-proposicao
// =========================================================
// Gera, via Gemini, um RESUMO BREVE de uma proposição a partir
// do PDF do seu INTEIRO TEOR (texto original) — não da ementa.
// Usada pelo botão "Resumo da proposição (IA)" da tela inicial.
//
// Recebe: { proposicao: { id, identificador, ementa } }
//   - Quando o item selecionado é um REQ de urgência ou parecer,
//     o CLIENTE já envia a proposição-ALVO (quem decide é o page.tsx).
// Devolve: { ok: true, texto } ou { ok: false, error }
//
// Princípios (v1.5.4+): erro real na tela + console.error nos
// Runtime Logs. NUNCA logar a chave da API.
// =========================================================

import { NextResponse } from "next/server";
import { buscarPdfInteiroTeor } from "@/lib/camara";

export const runtime = "nodejs";
// Download de PDF + leitura pelo Gemini podem passar do timeout padrão.
export const maxDuration = 60;

const PROMPT_RESUMO = `Você é assessor legislativo da Federação PSDB/Cidadania na Câmara dos Deputados.

TAREFA: escrever um resumo breve de uma proposição legislativa para um deputado federal ler em segundos, a partir do INTEIRO TEOR em PDF anexado.

REGRAS:
- Português claro e direto; evite juridiquês desnecessário.
- No máximo 10 linhas, em um ou dois parágrafos corridos.
- Texto puro: sem listas, sem títulos, sem markdown, sem asteriscos.
- Comece dizendo o que a proposição faz (objeto principal).
- Cubra em seguida: principais medidas e dispositivos; quais leis altera ou revoga (se houver); quem é afetado.
- NÃO emita opinião, juízo de mérito nem recomendação de voto.
- NÃO invente conteúdo: se a informação não estiver no PDF, não afirme.
- Baseie-se APENAS no PDF anexado, que é o texto da proposição.`;

function limpar(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor.trim();
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
    proposicao?: { id?: number; identificador?: string; ementa?: string };
  };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo da requisição inválido." },
      { status: 400 }
    );
  }

  const propIdNum = Number(corpo?.proposicao?.id) || 0;
  const propId = limpar(corpo?.proposicao?.identificador);
  const propEmenta = limpar(corpo?.proposicao?.ementa);

  if (!propIdNum) {
    return NextResponse.json(
      { ok: false, error: "Falta o id da proposição para buscar o inteiro teor." },
      { status: 400 }
    );
  }

  // Baixa o PDF do inteiro teor (texto original da proposição).
  const pdf = await buscarPdfInteiroTeor(propIdNum);
  if (!pdf.ok) {
    const mensagens: Record<typeof pdf.motivo, string> = {
      sem_url:
        "A Câmara não disponibilizou o inteiro teor desta proposição em PDF.",
      download:
        "Não consegui baixar o PDF do inteiro teor. Tente de novo em instantes.",
      muito_grande:
        "O inteiro teor desta proposição é grande demais para a IA ler (limite ~20 MB).",
    };
    console.error(
      `[resumir-proposicao] PDF indisponível | prop=${propId} (${propIdNum}) | motivo=${pdf.motivo}`
    );
    return NextResponse.json(
      { ok: false, error: mensagens[pdf.motivo] },
      { status: 404 }
    );
  }

  const contexto =
    `PROPOSIÇÃO: ${propId || "(não informada)"}\n` +
    `EMENTA OFICIAL: ${propEmenta || "(não informada)"}\n\n` +
    `Escreva o resumo conforme as instruções, com base no PDF anexado.`;

  const modelo = "gemini-3.1-flash-lite";
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelo +
    ":generateContent?key=" +
    apiKey;

  const payload = {
    contents: [
      {
        parts: [
          { text: PROMPT_RESUMO + "\n\n---\n\n" + contexto },
          { inline_data: { mime_type: pdf.mimeType, data: pdf.base64 } },
        ],
      },
    ],
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
      console.error(
        `[resumir-proposicao] Gemini HTTP ${resp.status} | prop=${propId} | ${motivoGemini}`
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
        `[resumir-proposicao] Gemini sem texto | motivo=${motivo} | prop=${propId}`
      );
      return NextResponse.json(
        { ok: false, error: `O Gemini não retornou texto (motivo: ${motivo}).` },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, texto });
  } catch (e) {
    const detalhe = e instanceof Error ? e.message : String(e);
    console.error(
      `[resumir-proposicao] Falha ao chamar o Gemini | prop=${propId} | ${detalhe}`
    );
    return NextResponse.json(
      { ok: false, error: `Falha ao chamar o Gemini: ${detalhe}` },
      { status: 500 }
    );
  }
}
