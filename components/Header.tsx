"use client";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-psdb-blue text-white shadow-md">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        {/* Logo PSDB inline (SVG simples para não depender de imagem externa) */}
        <div
          className="h-11 w-11 rounded-full bg-white flex items-center justify-center shadow"
          aria-label="Logo PSDB"
        >
          <svg
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            className="h-9 w-9"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="30" fill="#0066B3" />
            <path
              d="M14 22 L32 12 L50 22 L50 42 L32 52 L14 42 Z"
              fill="#FFCC00"
              stroke="#003D7A"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <text
              x="32"
              y="38"
              textAnchor="middle"
              fontFamily="Arial, sans-serif"
              fontWeight="900"
              fontSize="14"
              fill="#003D7A"
              letterSpacing="0.5"
            >
              PSDB
            </text>
          </svg>
        </div>

        <div className="flex flex-col leading-tight">
          <span className="text-[11px] uppercase tracking-wider opacity-80">
            Federação PSDB/CID
          </span>
          <h1 className="text-base sm:text-lg font-bold">
            Orientador de Votação
          </h1>
        </div>

        <div className="ml-auto">
          <span className="chip-yellow !bg-psdb-yellow !text-psdb-darkblue text-[10px] sm:text-xs">
            Câmara dos Deputados
          </span>
        </div>
      </div>
    </header>
  );
}
