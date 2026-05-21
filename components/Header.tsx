"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-psdb-blue text-white shadow-md">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        {/* Logo PSDB */}
        <div
          className="h-11 w-11 rounded-full bg-white flex items-center justify-center shadow flex-shrink-0"
          aria-label="Logo PSDB"
        >
          <Image
            src="/logo-psdb.svg"
            alt="Logo PSDB"
            width={40}
            height={40}
            className="h-9 w-9"
            priority
          />
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
