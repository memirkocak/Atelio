import { StatusBadge } from "@/components/shared/status-badge";

import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONES, type QuoteStatus } from "../constants";
import { displayStatus } from "../status";

/** Badge de statut (« Expiré » calculé à partir de la date de validité). */
export function QuoteStatusBadge({ quote }: { quote: { status: QuoteStatus; valid_until: string } }) {
  const status = displayStatus(quote);
  return <StatusBadge tone={QUOTE_STATUS_TONES[status]}>{QUOTE_STATUS_LABELS[status]}</StatusBadge>;
}
