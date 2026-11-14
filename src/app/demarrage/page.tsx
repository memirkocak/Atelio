import { CircleCheck, LogOut } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Bienvenue" };

/*
 * Page temporaire (phase 3) : les espaces de travail n'existent pas encore.
 * En phase 4, cette route redirigera vers l'espace de l'utilisateur.
 */
export default function OnboardingPage() {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="flex h-16 items-center px-4 md:px-6">
        <Link href="/" aria-label="Atelio, accueil" className="rounded-md">
          <Brand />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xs sm:p-8">
          <Suspense fallback={<WelcomeSkeleton />}>
            <Welcome />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function Welcome() {
  const user = await requireUser();
  const firstName = user.fullName?.split(" ")[0];

  return (
    <div className="flex flex-col gap-4">
      <CircleCheck className="size-8 text-status-success-foreground" aria-hidden />
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          {firstName ? `Bienvenue, ${firstName} !` : "Bienvenue !"}
        </h1>
        <p className="text-muted-foreground">
          Vous êtes connecté avec <span className="font-medium text-foreground">{user.email}</span>.
        </p>
      </div>
      <p className="rounded-lg border bg-muted/50 p-3 text-muted-foreground">
        La création de votre espace de travail sera disponible à la prochaine étape du
        développement d’Atelio.
      </p>
      <form action={signOut}>
        <Button type="submit" variant="outline" className="w-full">
          <LogOut aria-hidden />
          Se déconnecter
        </Button>
      </form>
    </div>
  );
}

function WelcomeSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
