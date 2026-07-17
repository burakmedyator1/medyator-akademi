import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';

const PLACEHOLDER_IDS = ['', 'REPLACE_WITH_REAL_VIDEO_ID'];

// Koruma: videonun kaynağına gidişi engelle (YouTube'da izle / youtu.be / mobil
// YouTube / giriş sayfaları). Oynatıcının kendi kaynakları (embed, iframe api,
// about:blank, data:) serbest kalır.
function isBlocked(url: string): boolean {
  return (
    /\/watch\b/.test(url) ||
    url.includes('youtu.be/') ||
    url.includes('m.youtube.com') ||
    url.includes('accounts.google.com')
  );
}

// Uzun basma menüsü / metin seçimi / sağ tık kapatılır.
const INJECTED = `
  (function(){
    var s=document.createElement('style');
    s.innerHTML='*{-webkit-touch-callout:none!important;-webkit-user-select:none!important;user-select:none!important;}';
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
 * Korumalı video oynatıcı. YouTube için react-native-youtube-iframe (IFrame
 * API'yi doğru origin ile çalıştırır → "Hata 153" olmaz, web'deki gibi). Vimeo
 * için WebView embed. Her ikisinde de kullanıcı videonun kaynağına gidemez.
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
  const [width, setWidth] = useState(0);
  const valid = videoId && !PLACEHOLDER_IDS.includes(videoId);

  if (!valid) {
    return (
      <View style={[styles.frame, styles.center]}>
        <Text style={styles.msg}>Bu ders için video henüz eklenmemiş.</Text>
      </View>
    );
  }

  const height = width > 0 ? (width * 9) / 16 : 0;

  if (provider === 'youtube') {
    return (
      <View style={styles.frame} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <YoutubePlayer
            height={height}
            width={width}
            videoId={videoId}
            initialPlayerParams={{ modestbranding: true, rel: false, iv_load_policy: 3, controls: true }}
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
