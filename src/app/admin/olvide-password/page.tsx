import { Suspense } from "react";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/admin/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-neutral p-4">
      <div className="w-full max-w-sm space-y-6 rounded-[var(--radius)] border border-border bg-background p-8 shadow-sm">
        <div>
          <p className="font-heading text-lg text-foreground">
            Recuperar contraseña
          </p>
          <p className="text-sm text-muted-foreground">
            Ingresá el email con el que accedés al panel — te mandamos un
            enlace para elegir una contraseña nueva.
          </p>
        </div>
        {/* useSearchParams (mensaje de enlace vencido) exige un límite de Suspense. */}
        <Suspense fallback={null}>
          <ForgotPasswordForm />
        </Suspense>
        <Link
          href="/admin/login"
          className="block text-center text-sm text-muted-foreground hover:text-brand-accent-dark"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
