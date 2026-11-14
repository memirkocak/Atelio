type AuthErrorLike = { code?: string | null; message?: string | null; status?: number | null };

const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou mot de passe incorrect.",
  email_not_confirmed: "Confirmez votre adresse e-mail avant de vous connecter (vérifiez votre boîte mail).",
  user_already_exists: "Un compte existe déjà avec cette adresse e-mail.",
  email_exists: "Un compte existe déjà avec cette adresse e-mail.",
  weak_password: "Mot de passe trop faible : au moins 8 caractères, dont une lettre et un chiffre.",
  same_password: "Le nouveau mot de passe doit être différent de l'ancien.",
  over_request_rate_limit: "Trop de tentatives. Patientez quelques minutes avant de réessayer.",
  over_email_send_rate_limit: "Trop d'e-mails envoyés. Patientez quelques minutes avant de réessayer.",
  email_address_invalid: "Adresse e-mail invalide.",
  email_address_not_authorized: "L'envoi d'e-mails vers cette adresse n'est pas autorisé pour le moment.",
  signup_disabled: "Les inscriptions sont momentanément fermées.",
  otp_expired: "Ce lien a expiré ou a déjà été utilisé. Faites une nouvelle demande.",
  session_not_found: "Votre session a expiré. Reconnectez-vous.",
  session_expired: "Votre session a expiré. Reconnectez-vous.",
};

export const GENERIC_AUTH_ERROR = "Une erreur est survenue. Réessayez dans un instant.";

/** Traduit une erreur Supabase Auth en message français affichable. */
export function authErrorMessage(error: AuthErrorLike | null | undefined): string {
  if (!error) return GENERIC_AUTH_ERROR;
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]!;
  if (error.status === 429) return MESSAGES.over_request_rate_limit!;
  return GENERIC_AUTH_ERROR;
}
