import { StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

const PLACEHOLDER_IDS = ['', 'REPLACE_WITH_REAL_VIDEO_ID'];

/**
 * Web VideoPlayer.jsx'in mobil karşılığı. YouTube/Vimeo videosunu WebView'de
 * oynatır. ÖNEMLİ: embed sayfası doğrudan URL olarak yüklenir (source.uri) —
 * böylece YouTube geçerli bir origin (youtube.com) görür ve oynatır. HTML
 * içine iframe gömmek (source.html) origin'siz kaldığından oynatmayı engeller.
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
  const valid = videoId && !PLACEHOLDER_IDS.includes(videoId);

  if (!valid) {
    return (
      <View style={[styles.frame, styles.center]}>
        <Text style={styles.msg}>Bu ders için video henüz eklenmemiş.</Text>
      </View>
    );
  }

  const uri =
    provider === 'youtube'
      ? `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&fs=1`
      : `https://player.vimeo.com/video/${videoId}`;

  return (
    <View style={styles.frame}>
      <WebView
        source={{ uri }}
        style={styles.web}
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        // iOS'ta gömülü YouTube/Vimeo oynatıcısının tam çalışması için:
        setSupportMultipleWindows={false}
        allowsProtectedMedia
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  web: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  msg: { color: '#fff', fontSize: 14, textAlign: 'center' },
});
