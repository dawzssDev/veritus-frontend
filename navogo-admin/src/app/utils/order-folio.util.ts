/** Campos de folio que puede devolver el backend en órdenes / tickets. */
export type OrderFolioSource = {
  id?: number;
  folio?: string | number | null;
  folio_diario?: string | number | null;
  folio_dia?: string | number | null;
  folio_empresa?: string | number | null;
};

/**
 * Folio visible para el usuario: prioriza el campo `folio` de la API.
 */
export function getOrderFolio(
  order: OrderFolioSource | null | undefined,
  options?: { withHash?: boolean; fallback?: string }
): string {
  const withHash = options?.withHash ?? false;
  const empty = options?.fallback ?? '—';
  if (!order) {
    return withHash ? `#${empty}` : empty;
  }

  const raw =
    order.folio ??
    order.folio_diario ??
    order.folio_dia ??
    order.folio_empresa ??
    order.id;

  if (raw == null || raw === '') {
    return withHash ? `#${empty}` : empty;
  }

  const text = String(raw).trim();
  if (!withHash) return text;
  return text.startsWith('#') ? text : `#${text}`;
}
