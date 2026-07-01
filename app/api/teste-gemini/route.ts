import { NextResponse } from "next/server";

// Garante que a rota rode no servidor (onde a chave existe), não na borda.
export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  // 1) A chave chegou do ambiente?
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, erro: "GEMINI_API_KEY nao encontrada nas variaveis de ambiente." },
      { status: 500 }
    );
  }

  const modelo = "gemini-2.5-flash";
  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    modelo +
    ":generateContent?key=" +
    apiKey;

  const payload = {
    contents: [
      {
        parts: [
          { text: "Responda apenas com a frase: O cano da IA esta funcionando." },
        ],
      },
    ],
  };

  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    // 2) O Gemini respondeu com erro (chave invalida, modelo errado etc.)?
    if (!resp.ok) {
      return NextResponse.json(
        { ok: false, erro: "O Gemini retornou um erro.", status: resp.status, detalhe: data },
        { status: 500 }
      );
    }

    // 3) Deu certo: extrai o texto da resposta.
    const texto =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "(sem texto na resposta)";

    return NextResponse.json({ ok: true, modelo, resposta: texto });
  } catch (e) {
    // 4) Falha de rede ou algo inesperado.
    return NextResponse.json(
      {
        ok: false,
        erro: "Falha ao chamar o Gemini.",
        detalhe: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
