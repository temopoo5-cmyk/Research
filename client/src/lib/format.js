export const coverGradients = [
  'linear-gradient(150deg,#0b6b52,#053f31)',
  'linear-gradient(150deg,#0f8a6c,#075744)',
  'linear-gradient(150deg,#2a9d8f,#0b6b52)',
  'linear-gradient(150deg,#103f37,#0b6b52)',
  'linear-gradient(150deg,#1b7f68,#093f31)',
  'linear-gradient(150deg,#13876d,#075744)',
];

export function coverGradient(index = 0) {
  return coverGradients[((index % coverGradients.length) + coverGradients.length) % coverGradients.length];
}

export function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function pluralize(count, singular, plural) {
  return `${count} ${count === 1 ? singular : (plural || `${singular}s`)}`;
}