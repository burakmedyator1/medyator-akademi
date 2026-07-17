/** Web frontend/src/components/colors.js karşılığı — kapak rengi adı → hex. */
export const COVER_COLORS: Record<string, string> = {
  yellow: '#f5c94f',
  purple: '#c9b7e4',
  blue: '#a9d3e5',
  pink: '#f3b6c8',
  green: '#b7e0c4',
  orange: '#f6c9a0',
  lavender: '#d3c5f0',
  mint: '#a8e0d1',
  peach: '#f7d6b8',
  slate: '#c2cbe0',
};

export function coverColorValue(name?: string): string {
  return (name && COVER_COLORS[name]) || COVER_COLORS.yellow;
}
