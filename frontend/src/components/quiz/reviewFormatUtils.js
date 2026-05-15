/** Slug or label → Title Case (e.g. `transport` → Transport). */
export function formatReviewCategory(raw) {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (!s) return '';
  return s
    .replace(/_/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
