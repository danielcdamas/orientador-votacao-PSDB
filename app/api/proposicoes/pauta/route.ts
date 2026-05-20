import { NextResponse } from "next/server";
import { buscarPautaDoDia, buscarProposicoes, buscarDestaques } from "@/lib/camara";
import type { ApiResponse, Destaque, Proposicao } from "@/types";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(req: Request): Promise<NextResponse<ApiResponse<Proposicao[] | Destaque[]>>> {
  try {
    const url = new URL(req.url);
    const termo = url.searchParams.get("q") || "";
    const idParaDestaques = url.searchParams.get("destaquesDe") || "";

    if (idParaDestaques) {
      const id = Number(idParaDestaques);
      if (!Number.isFinite(id)) {
        return NextResponse.json({ ok: false, error: "ID da proposição inválido." }, { status: 400 });
      }
      const destaques = await buscarDestaques(id);
      return NextResponse.json({
        ok: true,
        data: destaques,
        message: destaques.length === 0 ? "Nenhum destaque estruturado foi encontrado para esta proposição. Use o campo manual." : undefined,
      });
    }

    if (termo.trim().length >= 2) {
      const proposicoes = await buscarProposicoes(termo);
      return NextResponse.json({
        ok: true,
        data: proposicoes,
        message: proposicoes.length === 0 ? "Nenhuma proposição encontrada na base da Câmara para esse termo." : undefined,
      });
    }

    const proposicoes = await buscarPautaDoDia();
    return NextResponse.json({
      ok: true,
      data: proposicoes,
      message: proposicoes.length === 0 ? "Nenhuma proposição pautada encontrada para hoje." : undefined,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
