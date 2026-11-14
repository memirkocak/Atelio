import type { Page } from "@playwright/test";

/**
 * Next.js 16 conserve les pages déjà visitées dans le DOM, masquées (React Activity),
 * pour un retour instantané. getByLabel / getByText / getByTestId incluent ces éléments
 * cachés : on filtre donc sur les éléments visibles. (getByRole les exclut déjà.)
 */
export function byLabel(page: Page, text: string, options?: { exact?: boolean }) {
  return page.getByLabel(text, options).filter({ visible: true });
}

export function byText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true });
}

export function byTestId(page: Page, id: string) {
  return page.getByTestId(id).filter({ visible: true });
}
