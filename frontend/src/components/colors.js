export const COVER_COLORS = {
  yellow: '#f5c94f',
  purple: '#c9b7e4',
  blue: '#a9d3e5',
};

export function coverColorValue(name) {
  return COVER_COLORS[name] || COVER_COLORS.yellow;
}

const AVATAR_PALETTE = ['#f0653c', '#6c63b5', '#3b9ab4', '#e2a33d', '#6b7280'];

export function avatarColorFor(seed) {
  const index = Math.abs(seed) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}
