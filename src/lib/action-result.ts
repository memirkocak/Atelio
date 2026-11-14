/** Résultat standard d'une Server Action. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(
  error: string,
  fieldErrors?: Record<string, string[]>,
): { ok: false; error: string; fieldErrors?: Record<string, string[]> } {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}
