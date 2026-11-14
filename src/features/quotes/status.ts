import { todayIso } from "@/lib/dates";

import type { QuoteDisplayStatus, QuoteStatus } from "./constants";

/** Statut affiché : un devis envoyé dont la validité est dépassée (jour de Paris) est « expiré ». */
export function displayStatus(
  quote: { status: QuoteStatus; valid_until: string },
  today: string = todayIso(),
): QuoteDisplayStatus {
  return quote.status === "sent" && quote.valid_until < today ? "expired" : quote.status;
}
