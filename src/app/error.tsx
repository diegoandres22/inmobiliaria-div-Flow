"use client";

// Error boundary raíz — Next.js lo usa como fallback para cualquier
// segmento anidado que no defina su propio error.tsx. error.tsx tiene que
// ser Client Component (regla de Next.js).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-heading text-lg text-foreground">
        Algo salió mal
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        No pudimos cargar esta página. Probá de nuevo en unos segundos.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60">
          Código: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        className="mt-2 rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Reintentar
      </button>
    </div>
  );
}
