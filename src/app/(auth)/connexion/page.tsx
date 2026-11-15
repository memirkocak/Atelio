import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AuthCard } from "@/features/auth/components/auth-card";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { DemoButton } from "@/features/demo/components/demo-button";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <AuthCard
      title="Connexion"
      description="Accédez à votre espace Atelio."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-medium text-primary hover:underline">
            Créer un compte
          </Link>
        </>
      }
    >
      {/* Le formulaire lit ?next= et ?erreur= : donnée d'exécution (cacheComponents) */}
      <Suspense>
        <SignInForm />
      </Suspense>
      <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        ou
        <span className="h-px flex-1 bg-border" />
      </div>
      <DemoButton className="mt-6 [&_button]:w-full" size="default" variant="outline" />
    </AuthCard>
  );
}
