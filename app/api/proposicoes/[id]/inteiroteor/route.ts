// =========================================================
// API Route: /api/proposicoes/[id]/inteiroteor
// Retorna a URL do inteiro teor (quando houver).
// =========================================================
import { NextRequest, NextResponse } from "next/server";
import { buscarProposicao } from "@/lib/camara";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse<ApiResponse<{ url: string | null }>>> {
  const idNum = Number(context.params.id);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json(
      { ok: false, error: "ID inválido." },
      { status: 400 }
    );
  }

  try {
    const p = await buscarProposicao(idNum);
    return NextResponse.json({
      ok: true,
      data: { url: p.urlInteiroTeor || null },
      message: p.urlInteiroTeor
        ? undefined
        : "Esta proposição ainda não tem inteiro teor publicado.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
