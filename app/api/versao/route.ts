// =========================================================
// API Route: /api/versao
// =========================================================
// Devolve a versão ATUALMENTE PUBLICADA no servidor.
//
// Para que serve: no celular, o app instalado (PWA) costuma ficar
// suspenso em segundo plano com a página já carregada. Ao reabrir,
// o usuário continua rodando o JavaScript de uma versão antiga —
// no rodapé aparece a versão velha mesmo com o deploy novo no ar.
//
// O navegador compara a versão embutida no seu próprio pacote com
// a que esta rota devolve. Se diferirem, a faixa de atualização
// aparece. Como a URL contém "/api/", o service worker não a
// intercepta (ver public/sw.js), então a resposta vem sempre da rede.
// =========================================================
import { NextResponse } from "next/server";
import { APP_VERSAO } from "@/lib/versao";

export const runtime = "nodejs";
// Nunca cachear: esta rota existe justamente para detectar defasagem.
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<{ versao: string }>> {
  return NextResponse.json(
    { versao: APP_VERSAO },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
