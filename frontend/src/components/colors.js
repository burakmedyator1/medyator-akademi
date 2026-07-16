export const COVER_COLORS = {
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

export const COVER_COLOR_LABELS = {
  yellow: 'Sarı',
  purple: 'Mor',
  blue: 'Mavi',
  pink: 'Pembe',
  green: 'Yeşil',
  orange: 'Turuncu',
  lavender: 'Lavanta',
  mint: 'Nane',
  peach: 'Şeftali',
  slate: 'Gri-Mavi',
};

export function coverColorValue(name) {
  return COVER_COLORS[name] || COVER_COLORS.yellow;
}

const AVATAR_PALETTE = ['#f0653c', '#6c63b5', '#3b9ab4', '#e2a33d', '#6b7280'];

export function avatarColorFor(seed) {
  const index = Math.abs(seed) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}
