import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * Web VideoPlayer.jsx'in mobil karşılığı. YouTube/Vimeo videosunu WebView
 * içinde embed player ile oynatır (mobilde IFrame API yerine yerel embed
 * kontrolleri kullanılır).
 */
export function VideoPlayer({
  provider,
  videoId,
  title,
}: {
  provider?: string;
  videoId: string;
  title?: string;
}) {
  const html = useMemo(() => {
    const src =
      provider === 'youtube'
        ? `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&iv_load_policy=3`
        : `https://player.vimeo.com/video/${videoId}`;
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>*{margin:0;padding:0}html,body{background:#000;height:100%;overflow:hidden}
.wrap{position:absolute;inset:0}iframe{border:0;width:100%;height:100%}</style></head>
<body><div class="wrap"><iframe src="${src}" title="${(title || '').replace(/"/g, '')}"
allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
allowfullscreen></iframe></div></body></html>`;
  }, [provider, videoId, title]);

  return (
    <View style={styles.frame}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
});
