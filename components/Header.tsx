"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-psdb-blue text-white shadow-md">
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        {/* Logo PSDB */}
        <div className="flex-shrink-0 bg-white rounded-lg px-2 py-1 shadow">
          <Image
            src="/logo-psdb.jpg"
            alt="Logo PSDB"
            width={80}
            height={44}
            className="h-9 w-auto object-contain"
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

       <div className="ml-auto flex-shrink-0">
          <Image
            src="/LOGO%20-%20C%C3%A2mara%20dos%20Deputados%202025_H2%20-%20Colorida.png"
            alt="Câmara dos Deputados"
            width={200}
            height={52}
            className="h-9 sm:h-10 w-auto object-contain"
            priority
          />
        </div>
      </div>
    </header>
  );
}
