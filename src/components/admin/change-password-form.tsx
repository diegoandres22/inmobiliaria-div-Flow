"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { changePassword } from "@/app/admin/(dashboard)/mi-cuenta/actions";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("La contraseña nueva debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    const formData = new FormData();
    formData.set("currentPassword", currentPassword);
    formData.set("newPassword", newPassword);

    startTransition(async () => {
      const result = await changePassword(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      toast.success("Contraseña actualizada — te mandamos un email de confirmación.");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <Input
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          type={show ? "text" : "password"}
          placeholder="Contraseña actual"
          autoComplete="current-password"
          required
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ocultar contraseñas" : "Mostrar contraseñas"}
          aria-pressed={show}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <Input
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        type={show ? "text" : "password"}
        placeholder="Contraseña nueva (mínimo 8 caracteres)"
        autoComplete="new-password"
        required
        minLength={8}
      />
      <Input
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        type={show ? "text" : "password"}
        placeholder="Repetí la contraseña nueva"
        autoComplete="new-password"
        required
        minLength={8}
      />
      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
