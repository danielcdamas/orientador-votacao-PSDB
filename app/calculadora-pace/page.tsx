"use client";

import { useState, useMemo } from "react";

const DISTANCES = [
  { label: "5 km", km: 5 },
  { label: "10 km", km: 10 },
  { label: "15 km", km: 15 },
  { label: "Meia Maratona", km: 21.0975 },
];

function formatRaceTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, "0")}min ${s.toString().padStart(2, "0")}s`;
  }
  return `${m}min ${s.toString().padStart(2, "0")}s`;
}

function formatPace(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")} min/km`;
}

type Mode = "kmh" | "pace";

export default function PaceCalculator() {
  const [mode, setMode] = useState<Mode>("kmh");

  // km/h mode input
  const [kmhInput, setKmhInput] = useState("");

  // min/km mode inputs
  const [paceMinInput, setPaceMinInput] = useState("");
  const [paceSecInput, setPaceSecInput] = useState("");

  const result = useMemo(() => {
    if (mode === "kmh") {
      const speed = parseFloat(kmhInput);
      if (!speed || speed <= 0 || speed > 100) return null;
      const paceSeconds = 3600 / speed;
      return { paceSeconds, speed };
    } else {
      const min = parseInt(paceMinInput, 10);
      const sec = parseInt(paceSecInput, 10) || 0;
      if (!paceMinInput || min <= 0 || sec < 0 || sec > 59) return null;
      const paceSeconds = min * 60 + sec;
      if (paceSeconds <= 0) return null;
      const speed = 3600 / paceSeconds;
      return { paceSeconds, speed };
    }
  }, [mode, kmhInput, paceMinInput, paceSecInput]);

  const paceMinError =
    paceSecInput !== "" && (parseInt(paceSecInput, 10) > 59 || parseInt(paceSecInput, 10) < 0);

  return (
    <div className="min-h-dvh" style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)" }}>
      <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-4">

        {/* Header */}
        <header className="text-center pt-4 pb-2">
          <div className="text-5xl mb-3 select-none">🏃</div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Calculadora de Pace</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Converta velocidade e preveja seus tempos de corrida
          </p>
        </header>

        {/* Mode toggle */}
        <div
          className="flex rounded-2xl p-1"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <button
            onClick={() => setMode("kmh")}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 select-none"
            style={{
              background: mode === "kmh" ? "#f97316" : "transparent",
              color: mode === "kmh" ? "#fff" : "#94a3b8",
            }}
          >
            km/h → min/km
          </button>
          <button
            onClick={() => setMode("pace")}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200 select-none"
            style={{
              background: mode === "pace" ? "#f97316" : "transparent",
              color: mode === "pace" ? "#fff" : "#94a3b8",
            }}
          >
            min/km → km/h
          </button>
        </div>

        {/* Input card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          {mode === "kmh" ? (
            <>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#f97316" }}>
                Velocidade
              </label>
              <div className="flex items-end gap-3">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={kmhInput}
                  onChange={(e) => setKmhInput(e.target.value)}
                  className="flex-1 rounded-xl px-4 py-4 text-3xl font-bold text-center focus:outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.15)",
                    caretColor: "#f97316",
                  }}
                />
                <span className="pb-4 font-semibold" style={{ color: "#94a3b8" }}>km/h</span>
              </div>
            </>
          ) : (
            <>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#f97316" }}>
                Pace
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex flex-col items-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="5"
                    value={paceMinInput}
                    onChange={(e) => setPaceMinInput(e.target.value)}
                    className="w-full rounded-xl px-3 py-4 text-3xl font-bold text-center focus:outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.15)",
                      caretColor: "#f97316",
                    }}
                  />
                  <span className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>minutos</span>
                </div>

                <span className="text-4xl font-bold pb-5" style={{ color: "#64748b" }}>:</span>

                <div className="flex-1 flex flex-col items-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="00"
                    value={paceSecInput}
                    onChange={(e) => setPaceSecInput(e.target.value)}
                    className="w-full rounded-xl px-3 py-4 text-3xl font-bold text-center focus:outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      color: paceMinError ? "#f87171" : "#fff",
                      border: `1px solid ${paceMinError ? "#f87171" : "rgba(255,255,255,0.15)"}`,
                      caretColor: "#f97316",
                    }}
                  />
                  <span className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>segundos</span>
                </div>

                <span className="pb-5 font-semibold text-sm" style={{ color: "#94a3b8" }}>min/km</span>
              </div>
              {paceMinError && (
                <p className="text-xs mt-2 text-center" style={{ color: "#f87171" }}>
                  Segundos devem ser entre 0 e 59
                </p>
              )}
            </>
          )}
        </div>

        {/* Conversion result */}
        {result && (
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
              boxShadow: "0 8px 32px rgba(249,115,22,0.35)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-100 mb-2">
              {mode === "kmh" ? "Pace equivalente" : "Velocidade equivalente"}
            </p>
            <p className="text-4xl font-bold text-white">
              {mode === "kmh"
                ? formatPace(result.paceSeconds)
                : `${result.speed.toFixed(2)} km/h`}
            </p>
          </div>
        )}

        {/* Race predictions */}
        {result && (
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#f97316" }}>
              Previsão de chegada
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {DISTANCES.map(({ label, km }) => {
                const totalSec = result.paceSeconds * km;
                return (
                  <div
                    key={label}
                    className="rounded-xl p-4 flex flex-col items-center gap-1"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-xs font-semibold" style={{ color: "#f97316" }}>
                      {label}
                    </span>
                    <span className="text-base font-bold text-white text-center leading-tight">
                      {formatRaceTime(totalSec)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!result && (
          <p className="text-center text-sm py-4" style={{ color: "#475569" }}>
            {mode === "kmh"
              ? "Digite uma velocidade em km/h para começar"
              : "Digite seu pace em minutos e segundos por km"}
          </p>
        )}

        {/* Footer */}
        <footer className="text-center py-4 text-xs" style={{ color: "#334155" }}>
          Meia Maratona = 21,0975 km
        </footer>
      </div>
    </div>
  );
}
