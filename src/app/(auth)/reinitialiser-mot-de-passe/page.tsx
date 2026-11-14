import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

// Accessible uniquement avec une session (ouverte par le lien reçu par e-mail) : voir proxy.ts.
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Nouveau mot de passe" description="Choisissez votre nouveau mot de passe.">
      <ResetPasswordForm />
    </AuthCard>
  );
}
