// =========================================================
// API Route: /api/proposicoes/pauta
// Retorna a pauta do Plenário do dia (ou mais recente).
// =========================================================
import { NextResponse } from "next/server";
import { buscarPautaDoDia } from "@/lib/camara";
import type { ApiResponse, Proposicao } from "@/types";

export const runtime = "nodejs";
// Revalida a cada 5 minutos
export const revalidate = 300;

export async function GET(): Promise<NextResponse<ApiResponse<Proposicao[]>>> {
  try {
    const proposicoes = await buscarPautaDoDia();
    return NextResponse.json({
      ok: true,
      data: proposicoes,
      message:
        proposicoes.length === 0
          ? "Nenhuma proposição pautada encontrada para hoje."
          : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json(
      {
        ok: false,
        error: msg,
      },
      { status: 502 }
    );
  }
}
