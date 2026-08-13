"use client";

// =========================================================
// Faixa "Nova versão disponível"
// =========================================================
// Compara a versão embutida neste pacote (APP_VERSAO, congelada no
// momento do build que o navegador baixou) com a versão que o servidor
// informa em /api/versao. Se forem diferentes, o usuário está rodando
// uma cópia antiga — caso clássico do PWA instalado no celular, que
// fica suspenso em segundo plano e volta com o código velho na memória.
//
// A checagem roda ao abrir e sempre que o app volta ao primeiro plano,
// que é exatamente o momento em que o usuário retoma o app suspenso.
//
// Falha de rede é ignorada de propósito: sem internet, seguir com a
// versão em mãos é melhor do que assustar o usuário em plenário.
// =========================================================

import { useCallback, useEffect, useState } from "react";
import { APP_VERSAO } from "@/lib/versao";

export function UpdateBanner() {
  const [versaoPublicada, setVersaoPublicada] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  const checarVersao = useCallback(async () => {
    try {
      const res = await fetch("/api/versao", { cache: "no-store" });
      if (!res.ok) return;
      const json: { versao?: string } = await res.json();
      const publicada = typeof json.versao === "string" ? json.versao.trim() : "";
      if (publicada && publicada !== APP_VERSAO) {
        setVersaoPublicada(publicada);
      }
    } catch {
      // Sem rede ou servidor fora: mantém a tela como está.
    }
  }, []);

  useEffect(() => {
    checarVersao();

    const aoVoltarAoPrimeiroPlano = () => {
      if (document.visibilityState === "visible") checarVersao();
    };

    document.addEventListener("visibilitychange", aoVoltarAoPrimeiroPlano);
    window.addEventListener("focus", checarVersao);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltarAoPrimeiroPlano);
      window.removeEventListener("focus", checarVersao);
    };
  }, [checarVersao]);

  async function atualizarAgora() {
    setAtualizando(true);
    // Limpa o cache do service worker e força a busca de um SW novo antes
    // de recarregar. Se qualquer etapa falhar, o reload sozinho já resolve
    // na maioria dos casos (o SW é network-first).
    try {
      if ("caches" in window) {
        const chaves = await caches.keys();
        await Promise.all(chaves.map((k) => caches.delete(k)));
      }
      if ("serviceWorker" in navigator) {
        const registro = await navigator.serviceWorker.getRegistration();
        await registro?.update();
      }
    } catch {
      // segue para o reload de qualquer forma
    }
    window.location.reload();
  }

  if (!versaoPublicada) return null;

  return (
    <div className="sticky top-0 z-50 bg-psdb-yellow border-b border-amber-500/50 shadow-sm">
      <div className="mx-auto max-w-3xl px-4 py-2 flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold text-psdb-darkblue leading-snug">
          Nova versão disponível (v{versaoPublicada}).{" "}
          <span className="font-normal">
            Você está usando a v{APP_VERSAO}.
          </span>
        </p>
        <button
          type="button"
          onClick={atualizarAgora}
          disabled={atualizando}
          className="shrink-0 rounded-lg bg-psdb-blue px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm hover:bg-psdb-darkblue active:scale-[0.98] disabled:opacity-60"
        >
          {atualizando ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
    </div>
  );
}
