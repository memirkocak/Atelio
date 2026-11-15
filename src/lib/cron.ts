import { createHash, timingSafeEqual } from "node:crypto";

/** Longueur minimale du secret (une chaîne aléatoire de 32 octets en hexadécimal en fait 64). */
export const MIN_CRON_SECRET_LENGTH = 32;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/**
 * Vérifie l'en-tête `Authorization: Bearer <CRON_SECRET>` envoyé par le cron Vercel.
 * Comparaison à temps constant (empreintes de même longueur) ; secret absent ou trop court = refus.
 */
export function isAuthorizedCronRequest(authorization: string | null, secret: string | undefined): boolean {
  if (!secret || secret.length < MIN_CRON_SECRET_LENGTH || !authorization) return false;
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`));
}
