import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-neutral p-4">
      <div className="w-full max-w-sm space-y-6 rounded-[var(--radius)] border border-border bg-background p-8 shadow-sm">
        <div>
          <p className="font-heading text-lg text-foreground">
            Panel de agentes
          </p>
          <p className="text-sm text-muted-foreground">
            Iniciá sesión para gestionar tus propiedades.
          </p>
        </div>
        {/* LoginForm usa useSearchParams (mensaje de error del callback de
            Google) — Next exige un límite de Suspense para eso. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
