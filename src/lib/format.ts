import { format, formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";

/** « 14 nov. 2026 » */
export function formatDate(value: string | Date): string {
  return format(new Date(value), "d MMM yyyy", { locale: fr });
}

/** « 14 nov. 2026 à 09:12 » */
export function formatDateTime(value: string | Date): string {
  return format(new Date(value), "d MMM yyyy 'à' HH:mm", { locale: fr });
}

/** « il y a 3 minutes » */
export function formatRelative(value: string | Date): string {
  return formatDistanceToNowStrict(new Date(value), { locale: fr, addSuffix: true });
}
