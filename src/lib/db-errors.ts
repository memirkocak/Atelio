type PostgrestErrorLike = { code?: string | null; message?: string | null } | null | undefined;

/**
 * Traduit une erreur PostgreSQL / PostgREST en message français,
 * sans jamais exposer le message technique.
 */
export function dbErrorMessage(error: PostgrestErrorLike, overrides: Record<string, string> = {}): string {
  const code = error?.code ?? "";
  if (overrides[code]) return overrides[code];
  switch (code) {
    case "23514": // check_violation
    case "22001": // string_data_right_truncation
      return "Certaines valeurs sont invalides. Vérifiez le formulaire.";
    case "23503": // foreign_key_violation
      return "Cette opération est impossible : des éléments liés existent.";
    case "23505": // unique_violation
      return "Cet élément existe déjà.";
    case "42501": // insufficient_privilege / RLS
      return "Vous n’avez pas les droits nécessaires pour cette action.";
    default:
      return "Une erreur est survenue. Réessayez dans un instant.";
  }
}
