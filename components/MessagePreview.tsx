"use client";

import { useEffect, useState } from "react";
import { copiarTexto } from "@/lib/clipboard";

interface MessagePreviewProps {
  mensagem: string;
  onChange: (s: string) => void;
}

/**
 * Converte texto com asteriscos do WhatsApp para HTML com <strong>
 * apenas para fins de exibição. O texto original é preservado.
 */
function formatarParaPreview(texto: string): string {
  // Escapa HTML
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  // Aplica negrito do WhatsApp: *texto* -> <strong>texto</strong>
  // Cuidado: precisa ter conteúdo entre os asteriscos e não pode ser asterisco em si.
  return escapado.replace(/\*([^\*\n]+)\*/g, "<strong>$1</strong>");
}

export function MessagePreview({ mensagem, onChange }: MessagePreviewProps) {
  const [editando, setEditando] = useState(false);
  const [feedback, setFeedback] = useState<null | "ok" | "erro">(null);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (feedback) {
      const t = setTimeout(() => setFeedback(null), 2500);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  async function handleCopiar() {
    const ok = await copiarTexto(mensagem);
    if (ok) {
      setFeedback("ok");
      setShowFallback(false);
    } else {
      setFeedback("erro");
      setShowFallback(true);
    }
  }

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <label className="label !mb-0">4. Mensagem para WhatsApp</label>
        <button
          type="button"
          onClick={() => setEditando((e) => !e)}
          className="btn-ghost text-xs"
          aria-pressed={editando}
        >
          {editando ? (
            <>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" />
              </svg>
              Concluir edição
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path
                  d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"
                  strokeLinejoin="round"
                />
              </svg>
              Editar texto
            </>
          )}
        </button>
      </div>

      {/* Aviso de revisão humana */}
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 mb-3 text-[12px] text-amber-900 leading-snug">
        <span className="font-semibold">⚠️ Revise antes de enviar:</span>{" "}
        confirme com a Liderança e a Assessoria Técnica antes do envio oficial.
      </div>

      {editando ? (
        <textarea
          value={mensagem}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          className="input-base font-mono text-[13px] leading-relaxed"
          aria-label="Editar mensagem"
        />
      ) : (
        <div
          className="whatsapp-preview"
          dangerouslySetInnerHTML={{ __html: formatarParaPreview(mensagem) }}
          aria-label="Pré-visualização da mensagem"
        />
      )}

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <button
          type="button"
          onClick={handleCopiar}
          className="btn-primary flex-1"
          aria-live="polite"
        >
          {feedback === "ok" ? (
            <>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" />
              </svg>
              Copiado!
            </>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              Copiar para o WhatsApp
            </>
          )}
        </button>
      </div>

      {feedback === "erro" && (
        <p className="text-xs text-red-700 mt-2">
          Não foi possível copiar automaticamente. Selecione o texto abaixo e
          copie manualmente.
        </p>
      )}

      {showFallback && (
        <textarea
          readOnly
          value={mensagem}
          rows={8}
          className="input-base mt-3 font-mono text-[13px]"
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Texto para cópia manual"
        />
      )}
    </div>
  );
}
