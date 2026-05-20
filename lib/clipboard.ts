// =========================================================
// Utilitário de clipboard com fallback robusto
// =========================================================

/**
 * Copia texto para a área de transferência.
 * Funciona em browsers modernos (navigator.clipboard) e
 * usa fallback com textarea+execCommand em navegadores antigos.
 *
 * Retorna true se sucesso, false caso contrário.
 */
export async function copiarTexto(texto: string): Promise<boolean> {
  // Estratégia 1: Clipboard API moderna
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      // segue para o fallback
    }
  }

  // Estratégia 2: Fallback com textarea + execCommand
  if (typeof document === "undefined") return false;

  try {
    const textarea = document.createElement("textarea");
    textarea.value = texto;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);

    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const sucesso = document.execCommand("copy");
    document.body.removeChild(textarea);
    return sucesso;
  } catch {
    return false;
  }
}
