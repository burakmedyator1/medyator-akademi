import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';

const PLACEHOLDER_IDS = ['', 'REPLACE_WITH_REAL_VIDEO_ID'];

// Koruma: videonun KAYNAĞINA gidişi engelle (YouTube'da izle / youtu.be / mobil
// YouTube / giriş). Oynatıcının kendi kaynakları (embed, iframe api, video akışı)
// serbest kalır — böylece oynatma + altyazı + kalite çalışır ama kullanıcı
// videonun linkine/sayfasına gidemez.
function isBlocked(url: string): boolean {
  return (
    /youtube\.com\/watch\b/.test(url) ||
    url.includes('youtu.be/') ||
    url.includes('m.youtube.com') ||
    url.includes('accounts.google.com')
  );
}

// Uzun basma menüsü / metin seçimi / sağ tık kapatılır ("bağlantıyı kopyala"yı önler).
const INJECTED = `
  (function(){
    var s=document.createElement('style');
    s.innerHTML='*{-webkit-touch-callout:none!important;-webkit-user-select:none!important;}';
    document.head.appendChild(s);
    document.addEventListener('contextmenu',function(e){e.preventDefault();},true);
  })(); true;
`;

const protectiveWebViewProps = {
  onShouldStartLoadWithRequest: (req: WebViewNavigation) => !isBlocked(req.url),
  setSupportMultipleWindows: false,
  allowsLinkPreview: false,
  injectedJavaScript: INJECTED,
};

/**
 * Video oynatıcı. Yerel kontroller açık (play, altyazı/CC, kalite/ayar dişlisi,
 * tam ekran) ama kullanıcı videonun kaynağına gidemez (koruma). YouTube için
 * react-native-youtube-iframe (origin doğru → "Hata 153" olmaz), Vimeo için
 * sade WebView embed.
 */
export function VideoPlayer({ provider, videoId }: { provider?: string; videoId: string; title?: string }) {
  const [width, setWidth] = useState(0);
  const valid = videoId && !PLACEHOLDER_IDS.includes(videoId);

  if (!valid) {
    return (
      <View style={[styles.frame, styles.center]}>
        <Text style={styles.msg}>Bu ders için video henüz eklenmemiş.</Text>
      </View>
    );
  }

  if (provider === 'youtube') {
    const height = width > 0 ? (width * 9) / 16 : 0;
    return (
      <View style={styles.frame} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <YoutubePlayer
            height={height}
            width={width}
            videoId={videoId}
            // Yerel kontroller açık (altyazı + kalite dahil); marka/öneri kısık.
            initialPlayerParams={{ modestbranding: true, rel: false, iv_load_policy: 3 }}
            webViewProps={protectiveWebViewProps as any}
            webViewStyle={{ backgroundColor: '#000' }}
          />
        )}
      </View>
    );
  }

  // Vimeo
  const uri = `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
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
        {...protectiveWebViewProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  msg: { color: '#fff', fontSize: 14, textAlign: 'center' },
});
