import { describe, expect, it } from "vitest";

import { isAuthorizedCronRequest } from "@/lib/cron";

const SECRET = "a".repeat(64);

describe("autorisation de la tâche quotidienne", () => {
  it("accepte exactement « Bearer <secret> »", () => {
    expect(isAuthorizedCronRequest(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("refuse un en-tête absent, un mauvais secret ou un autre schéma", () => {
    expect(isAuthorizedCronRequest(null, SECRET)).toBe(false);
    expect(isAuthorizedCronRequest(`Bearer ${"b".repeat(64)}`, SECRET)).toBe(false);
    expect(isAuthorizedCronRequest(SECRET, SECRET)).toBe(false);
    expect(isAuthorizedCronRequest(`Basic ${SECRET}`, SECRET)).toBe(false);
    expect(isAuthorizedCronRequest(`Bearer ${SECRET} `, SECRET)).toBe(false);
  });

  it("refuse tout si le secret n'est pas configuré ou trop court", () => {
    expect(isAuthorizedCronRequest("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedCronRequest("Bearer ", "")).toBe(false);
    expect(isAuthorizedCronRequest("Bearer court", "court")).toBe(false);
  });
});
