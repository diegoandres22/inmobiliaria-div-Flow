// Banner compartido por las 3 páginas de /legal — deja explícito que el
// texto de esta página es una plantilla de demostración (datos y redacción
// de ejemplo para Venezuela), no un documento legal válido todavía. Cuando
// aparezca un cliente real, un abogado redacta el texto definitivo y se
// reemplaza el contenido de la página — la estructura y el diseño no
// cambian, así que no hay nada más que tocar en el código.
export function LegalSimulationNotice() {
  return (
    <div className="mb-8 rounded-[var(--radius)] border-2 border-dashed border-warning bg-warning-bg p-4 text-sm text-warning-foreground">
      <p className="font-medium">
        Contenido de simulación — no es un documento legal válido
      </p>
      <p className="mt-1">
        Esta página muestra una plantilla con datos y redacción de ejemplo
        (modo demo, Venezuela) para que el sitio quede completo y funcional
        de punta a punta. Antes de operar con datos de usuarios reales, todo
        el texto de esta página debe ser redactado y validado por un abogado
        en la jurisdicción real donde opere el negocio.
      </p>
    </div>
  );
}
