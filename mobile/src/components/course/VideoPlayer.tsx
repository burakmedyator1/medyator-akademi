import { StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';

const PLACEHOLDER_IDS = ['', 'REPLACE_WITH_REAL_VIDEO_ID'];

// Videonun kaynağına gidişi engelle (koruma): YouTube'da izle / youtu.be /
// mobil YouTube / harici gezinmeler bloklanır. Yalnız embed sayfası ve
// oynatıcının kendi kaynakları yüklenir.
function isBlocked(url: string): boolean {
  return (
    /\/watch\b/.test(url) ||
    url.includes('youtu.be/') ||
    url.includes('m.youtube.com') ||
    url.includes('accounts.google.com')
  );
}

// Uzun basma/menü, seçim ve sağ tık kapatılır (link kopyalama/"YouTube'da aç"ı önler).
const INJECTED = `
  (function(){
    var css = '*{ -webkit-touch-callout: none !important; -webkit-user-select: none !important; user-select: none !important; }';
    var s = document.createElement('style'); s.innerHTML = css; document.head.appendChild(s);
    document.addEventListener('contextmenu', function(e){ e.preventDefault(); }, true);
  })();
  true;
`;

/**
 * Web VideoPlayer.jsx'in korumalı mobil karşılığı. Embed doğrudan URL olarak
 * yüklenir (oynatma için geçerli origin), ama kullanıcı videonun YouTube/Vimeo
 * kaynağına gidemez — gezinme engellenir.
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
      ? `https://www.youtube.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&fs=1`
      : `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;

  function onShouldStart(req: WebViewNavigation): boolean {
    // İlk embed yüklemesine ve oynatıcı kaynaklarına izin ver; kaynağa gidişi engelle.
    return !isBlocked(req.url);
  }

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
        // Koruma: kaynağa gidişi engelle, yeni pencere/menü/önizleme kapalı.
        onShouldStartLoadWithRequest={onShouldStart}
        setSupportMultipleWindows={false}
        allowsLinkPreview={false}
        injectedJavaScript={INJECTED}
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
