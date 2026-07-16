export function extractYouTubeId(input) {
  if (!input) return input;
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  return trimmed;
}

export function extractVimeoId(input) {
  if (!input) return input;
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : trimmed;
}

export function extractVideoId(input, provider) {
  return provider === 'vimeo' ? extractVimeoId(input) : extractYouTubeId(input);
}
