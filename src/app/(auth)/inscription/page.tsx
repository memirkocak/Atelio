import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/features/auth/components/auth-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Créer un compte" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Créer un compte"
      description="Commencez à organiser votre activité avec Atelio."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/connexion" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
