import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SetNewPasswordForm } from "@/components/admin/set-new-password-form";

// Llega acá solo después de que /admin/auth/callback intercambió el código
// del email de "olvidé mi contraseña" (?next=/admin/reset-password) y ya
// dejó una sesión activa — por eso esta page no recibe ningún token en la
// URL, solo chequea que haya sesión. Si alguien entra directo sin pasar por
// el enlace (o el enlace ya venció/se usó), no hay sesión y se lo manda a
// pedir uno nuevo.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-neutral p-4">
      <div className="w-full max-w-sm space-y-6 rounded-[var(--radius)] border border-border bg-background p-8 shadow-sm">
        <div>
          <p className="font-heading text-lg text-foreground">
            Elegí una contraseña nueva
          </p>
          <p className="text-sm text-muted-foreground">
            {user
              ? "Es la última vez que te la vamos a pedir así — a partir de acá, usás la nueva para entrar."
              : "Este enlace no es válido."}
          </p>
        </div>
        {user ? (
          <SetNewPasswordForm />
        ) : (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-destructive">
              El enlace venció, ya se usó, o no es válido.
            </p>
            <Link
              href="/admin/olvide-password"
              className="block text-center text-sm font-medium text-brand-accent-dark hover:underline"
            >
              Pedir un enlace nuevo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
