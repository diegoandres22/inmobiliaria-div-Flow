import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "positivo" | "negativo";
  className?: string;
}

// Marca real (PNG exportado por vos), no la aproximación trazada a mano de
// antes. Recortada sin margen extra (ver public/brand/) — aspect ratio real
// ~0.72, por eso el ancho se deja en auto en vez de forzar un valor fijo.
const MARK_ASPECT_RATIO = 234 / 324;

export function Logo({ variant = "positivo", className }: LogoProps) {
  const isNegativo = variant === "negativo";
  const src = isNegativo
    ? "/brand/logo-mark-negativo.png"
    : "/brand/logo-mark-positivo.png";

  return (
    <span
      className={cn("inline-flex min-h-8 items-center gap-2", className)} // min-h-8 = 32px, mínimo del manual
    >
      <span className="relative h-full" style={{ aspectRatio: MARK_ASPECT_RATIO }}>
        <Image
          src={src}
          alt="<div>Flow"
          fill
          className="object-contain"
          priority
        />
      </span>
      <span
        className={cn(
          "font-heading text-base font-medium tracking-tight",
          isNegativo ? "text-brand-paper" : "text-brand-ink",
        )}
      >
        &lt;div&gt;Flow
      </span>
    </span>
  );
}

// Se mantiene el trazado vectorial a mano solo para el motivo decorativo del
// hero (home): ahí se tiñe con currentColor a baja opacidad vía clases de
// Tailwind, algo que un <Image> raster no puede hacer. La marca "real"
// (Header, Footer, admin) ya usa el PNG de arriba.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M56 76 C 40 108, 100 118, 148 90"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M126 130 C 95 152, 66 168, 56 184"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M56 228 L 126 228"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="56" cy="50" r="26" stroke="currentColor" strokeWidth="6" />
      <circle cx="56" cy="50" r="9" stroke="currentColor" strokeWidth="6" />
      <circle cx="148" cy="112" r="22" stroke="currentColor" strokeWidth="6" />
      <circle cx="148" cy="112" r="8" stroke="currentColor" strokeWidth="6" />
      <circle cx="56" cy="206" r="22" stroke="currentColor" strokeWidth="6" />
      <circle cx="56" cy="206" r="8" stroke="currentColor" strokeWidth="6" />
      <circle cx="148" cy="228" r="22" stroke="currentColor" strokeWidth="6" />
      <circle cx="148" cy="228" r="8" stroke="currentColor" strokeWidth="6" />
    </svg>
  );
}
