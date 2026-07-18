// Video süresini otomatik doldurmak için: Vimeo'nun resmi oEmbed servisi
// (anahtar gerektirmiyor, `duration` alanını doğrudan veriyor) ve YouTube'un
// resmi Data API v3'ü (bir API anahtarı gerektiriyor).
//
// YouTube video sayfasını doğrudan kazımak (scraping) da denendi ama bu
// ortamın çıkış IP'sinden yapılan istekler Google'ın bot korumasına takılıp
// "sorry/index" sayfasına yönlendirildi — production'da da aynı riski
// taşıyacağı için güvenilmez. Data API v3, aynı işi anahtarla ama güvenilir
// şekilde yapıyor.
function parseIsoDuration(iso) {
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return null;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

async function fetchYouTubeDurationSeconds(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY ayarlanmadı');
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(videoId)}&part=contentDetails&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('YouTube API isteği başarısız');

  const data = await res.json();
  const iso = data.items?.[0]?.contentDetails?.duration;
  if (!iso) throw new Error('Video bulunamadı');

  const seconds = parseIsoDuration(iso);
  if (seconds === null) throw new Error('Süre ayrıştırılamadı');
  return seconds;
}

async function fetchVimeoDurationSeconds(videoId) {
  const url = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${videoId}`)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Vimeo videosu bulunamadı');

  const data = await res.json();
  if (!data.duration) throw new Error('Vimeo yanıtında süre yok');
  return data.duration;
}

export async function fetchVideoDurationSeconds(provider, videoId) {
  return provider === 'vimeo' ? fetchVimeoDurationSeconds(videoId) : fetchYouTubeDurationSeconds(videoId);
}
