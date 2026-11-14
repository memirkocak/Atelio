import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type PaginationNavProps = {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  /** Construit l'URL d'une page en conservant les autres paramètres. */
  hrefForPage: (page: number) => string;
  itemLabel: { one: string; many: string };
};

/** Pagination simple « Précédent / Suivant » avec le décompte des éléments. */
export function PaginationNav({ page, pageCount, total, pageSize, hrefForPage, itemLabel }: PaginationNavProps) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const label = total > 1 ? itemLabel.many : itemLabel.one;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4 text-muted-foreground">
      <p className="tabular-nums">
        {total <= pageSize ? `${total} ${label}` : `${first}–${last} sur ${total} ${label}`}
      </p>
      {pageCount > 1 ? (
        <div className="flex items-center gap-2">
          <PageLink href={page > 1 ? hrefForPage(page - 1) : null} label="Page précédente">
            <ChevronLeft aria-hidden />
          </PageLink>
          <span className="text-xs tabular-nums">
            Page {page} / {pageCount}
          </span>
          <PageLink href={page < pageCount ? hrefForPage(page + 1) : null} label="Page suivante">
            <ChevronRight aria-hidden />
          </PageLink>
        </div>
      ) : null}
    </nav>
  );
}

function PageLink({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  if (!href) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={label}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="outline" size="icon">
      <Link href={href} aria-label={label} scroll={false}>
        {children}
      </Link>
    </Button>
  );
}
