const GRADE_COLORS = {
  a: '#038141',
  b: '#85bb2f',
  c: '#fecb02',
  d: '#ee8100',
  e: '#e63e11',
  unknown: '#9ca3af',
};

export default function NutriScoreBadge({ grade, size = 'md' }) {
  const g = (grade || 'unknown').toLowerCase();
  const color = GRADE_COLORS[g] || GRADE_COLORS.unknown;
  const label = g === 'unknown' ? '?' : g.toUpperCase();

  return (
    <span
      className={`nutriscore-badge nutriscore-${size}`}
      style={{ backgroundColor: color }}
      title={`Nutri-Score: ${label}`}
    >
      {label}
    </span>
  );
}
