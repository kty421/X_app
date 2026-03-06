export const formatPostDate = (iso?: string): string => {
  if (!iso) return '不明';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '不明';

  return date.toLocaleString('ja-JP');
};
