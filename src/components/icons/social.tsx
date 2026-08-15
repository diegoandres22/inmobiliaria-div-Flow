// lucide-react retiró los logos de marca de su set (trademark). Estos son
// glifos genéricos hechos a mano, mismo criterio visual (viewBox 24x24,
// currentColor) que el resto de los íconos de lucide-react en el proyecto.
import type { SVGProps } from "react";

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14 3h-2.5C9.01 3 7.5 4.79 7.5 7.5V10H5v3h2.5v8h3v-8h2.6l.4-3h-3V7.7c0-.87.24-1.7 1.5-1.7H14V3z" />
    </svg>
  );
}

export function TiktokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.5 3c.3 2.1 1.7 3.6 4 3.9v3c-1.4 0-2.8-.4-4-1.2v6.8c0 3.6-2.9 6.5-6.5 6.5S3.5 19.1 3.5 15.5 6.4 9 10 9c.4 0 .8 0 1.2.1v3.1c-.4-.1-.8-.2-1.2-.2-1.9 0-3.4 1.5-3.4 3.4S8.1 18.9 10 18.9s3.4-1.5 3.4-3.4V3h3.1z" />
    </svg>
  );
}

// Único ícono a color de todo el set (a propósito): las guías de marca de
// Google piden el "G" a 4 colores en botones de "Iniciar sesión con
// Google", no una versión monocromática con currentColor como el resto.
export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.56-5.2 3.56-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.89-3.02c-1.08.72-2.46 1.15-4.04 1.15-3.1 0-5.73-2.1-6.67-4.92H1.3v3.1C3.27 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.33 14.31A7.2 7.2 0 0 1 4.96 12c0-.8.14-1.58.37-2.31V6.59H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.41l4.03-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.59l4.03 3.1c.94-2.82 3.57-4.92 6.67-4.92z"
      />
    </svg>
  );
}
