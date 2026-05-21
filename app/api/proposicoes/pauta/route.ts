// =========================================================
// API Route: /api/proposicoes/pauta
// Retorna a pauta do Plenário do dia (ou mais recente).
// =========================================================
import { NextResponse } from "next/server";
import { buscarPautaDoDia, buscarProposicoes } from "@/lib/camara";
import type { ApiResponse, Proposicao } from "@/types";

export const runtime = "nodejs";
// Revalida a cada 5 minutos
export const revalidate = 300;

export async function GET(req: Request): Promise<NextResponse<ApiResponse<Proposicao[]>>> {
  try {
    const url = new URL(req.url);
    const termo = url.searchParams.get("q") || "";

    // Se há termo de busca, faz busca livre
    if (termo.trim().length >= 2) {
      const proposicoes = await buscarProposicoes(termo);
      return NextResponse.json({
        ok: true,
        data: proposicoes,
        message:
          proposicoes.length === 0
            ? "Nenhuma proposição encontrada com esse termo."
            : undefined,
      });
    }

    // Caso contrário, retorna a pauta do dia
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
