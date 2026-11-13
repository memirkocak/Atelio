import { Button } from "@/components/ui/button";

// Page provisoire : remplacée par la vraie page d'accueil en phase 2.
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-muted/40 px-4">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <span className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          En construction
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">Atelio</h1>
        <p className="text-muted-foreground">
          La plateforme qui centralise vos clients, projets, tâches, devis et rendez-vous.
        </p>
        <Button disabled>Bientôt disponible</Button>
      </div>
    </main>
  );
}
