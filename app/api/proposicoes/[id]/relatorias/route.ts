// =========================================================
// API Route: /api/proposicoes/[id]/relatorias
// Retorna o último parecer do relator (quando houver).
// =========================================================
import { NextRequest, NextResponse } from "next/server";
import { buscarUltimoParecer } from "@/lib/camara";
import type { ApiResponse, Parecer } from "@/types";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse<ApiResponse<Parecer | null>>> {
  const idNum = Number(context.params.id);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json(
      { ok: false, error: "ID inválido." },
      { status: 400 }
    );
  }

  try {
    const parecer = await buscarUltimoParecer(idNum);
    return NextResponse.json({
      ok: true,
      data: parecer,
      message: parecer ? undefined : "Nenhum parecer encontrado.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
