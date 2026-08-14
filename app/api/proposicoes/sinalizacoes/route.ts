import { NextResponse } from "next/server";
import { contarSinalizacoesEmLote } from "@/lib/camara";
import type { ApiResponse, MapaSinalizacoes } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

// Destaques e requerimentos entram e saem no meio da sessão: esta rota NUNCA
// pode ser servida de cache, senão o botão "Atualizar sinalizações" mentiria.
// Como a URL contém "/api/", o service worker também não a intercepta.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Teto de itens por chamada. A maior pauta observada tem ~20 itens. */
const MAX_IDS = 80;

const SEM_CACHE = { "Cache-Control": "no-store" };

/**
 * POST { ids: number[] }
 * → { ok: true, data: { "<id>": { destaques, rpd } } }
 *
 * Conta, para cada proposição da pauta, quantos destaques (DTQ) e quantos
 * requerimentos procedimentais (RPD) estão PENDENTES de deliberação, lendo a
 * coluna "Situação" das páginas do portal do Plenário.
 * Ver lib/camara.ts → contarSinalizacoes para a fonte e as armadilhas.
 */
export async function POST(
  req: Request
): Promise<NextResponse<ApiResponse<MapaSinalizacoes>>> {
  try {
    const body = (await req.json()) as { ids?: unknown };

    const ids = Array.isArray(body.ids)
      ? body.ids
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0)
          .slice(0, MAX_IDS)
      : [];

    if (ids.length === 0) {
      return NextResponse.json({ ok: true, data: {} }, { headers: SEM_CACHE });
    }

    const mapa = await contarSinalizacoesEmLote(ids);

    return NextResponse.json({ ok: true, data: mapa }, { headers: SEM_CACHE });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido.";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 502, headers: SEM_CACHE }
    );
  }
}
