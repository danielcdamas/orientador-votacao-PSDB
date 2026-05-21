// =========================================================
// API Route: /api/proposicoes/[id]/destaques
// Retorna os destaques textuais (DTQ) de uma proposição.
// =========================================================
import { NextResponse } from "next/server";
import { buscarDestaques } from "@/lib/camara";
import type { ApiResponse, Destaque } from "@/types";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Destaque[]>>> {
  try {
    const { id } = await params;
    const idNum = Number(id);

    if (!Number.isFinite(idNum) || idNum <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "ID da proposição inválido.",
        },
        { status: 400 }
      );
    }

    const destaques = await buscarDestaques(idNum);
    return NextResponse.json({
      ok: true,
      data: destaques,
      message:
        destaques.length === 0
          ? "Nenhum destaque encontrado para esta proposição."
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
