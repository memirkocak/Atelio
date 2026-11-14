/**
 * Normalise une saisie de recherche comme la colonne SQL `search_text`
 * (private.normalize_search) : minuscules, sans accents, espaces réduits.
 */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Motif ILIKE « contient », avec échappement des jokers SQL (% _ \). */
export function containsPattern(value: string): string {
  const escaped = normalizeSearch(value).replace(/[\\%_]/g, (c) => `\\${c}`);
  return `%${escaped}%`;
}
