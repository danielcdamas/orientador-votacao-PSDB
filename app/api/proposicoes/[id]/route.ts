// =========================================================
// API Route: /api/proposicoes/[id]
// Retorna detalhes de uma proposição específica.
// =========================================================
import { NextRequest, NextResponse } from "next/server";
import { buscarProposicao } from "@/lib/camara";
import type { ApiResponse, Proposicao } from "@/types";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Proposicao>>> {
  const idNum = Number(context.params.id);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json(
      { ok: false, error: "ID inválido." },
      { status: 400 }
    );
  }

  try {
    const proposicao = await buscarProposicao(idNum);
    return NextResponse.json({ ok: true, data: proposicao });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
