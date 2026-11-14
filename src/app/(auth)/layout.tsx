import Link from "next/link";

import { Brand } from "@/components/layout/brand";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col bg-canvas">
      <header className="flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="rounded-md">
          <Brand />
          <span className="sr-only">, retour à l’accueil</span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-8 pb-16 sm:items-center sm:pt-0">
        {children}
      </main>
    </div>
  );
}
