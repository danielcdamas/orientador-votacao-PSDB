// =========================================================
// VERSÃO DO APP — FONTE ÚNICA
// =========================================================
// Este valor é usado em três lugares:
//   1) rodapé da tela (app/page.tsx);
//   2) rota /api/versao, que informa a versão publicada no servidor;
//   3) comparação feita pelo UpdateBanner no navegador.
//
// Ao subir uma versão nova para produção, altere SOMENTE aqui.
// Se as três fontes divergirem, o aviso de atualização dispara à toa.
// =========================================================

export const APP_VERSAO = process.env.NEXT_PUBLIC_APP_VERSION || "1.6.2";
