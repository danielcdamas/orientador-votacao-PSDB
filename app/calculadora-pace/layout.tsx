import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculadora de Pace",
  description: "Converta km/h para min/km e preveja seus tempos nas corridas de 5km, 10km, 15km e meia maratona.",
};

export default function PaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
