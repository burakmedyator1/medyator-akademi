import { useEffect, useRef, useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewNavigation } from 'react-native-webview';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';

const PLACEHOLDER_IDS = ['', 'REPLACE_WITH_REAL_VIDEO_ID'];
const ACCENT = '#6aa016';

function isBlocked(url: string): boolean {
  return (
    /\/watch\b/.test(url) ||
    url.includes('youtu.be/') ||
    url.includes('m.youtube.com') ||
    url.includes('accounts.google.com')
  );
}

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

function fmt(sec: number): string {
  if (!sec || Number.isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Video oynatıcı. YouTube: native kontroller KAPALI (controls:0) + kendi özel
 * kontrol çubuğu — böylece paylaş/kalite/altyazı/YouTube linki hiç görünmez
 * (web'deki özel oynatıcının aynısı). Vimeo: sade embed. Kullanıcı videonun
 * kaynağına gidemez.
 */
export function VideoPlayer({ provider, videoId }: { provider?: string; videoId: string; title?: string }) {
  const valid = videoId && !PLACEHOLDER_IDS.includes(videoId);
  if (!valid) {
    return (
      <View style={[styles.frame, styles.center]}>
        <Text style={styles.msg}>Bu ders için video henüz eklenmemiş.</Text>
      </View>
    );
  }
  if (provider === 'youtube') return <YoutubeCustom videoId={videoId} />;

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

/** Native kontrolleri kapalı, özel kontrollü korumalı YouTube oynatıcısı. */
function YoutubeCustom({ videoId }: { videoId: string }) {
  const ref = useRef<YoutubeIframeRef>(null);
  const [width, setWidth] = useState(0);
  const [seekW, setSeekW] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);

  // Konum/süreyi periyodik güncelle.
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(async () => {
      try {
        const t = await ref.current?.getCurrentTime();
        const d = await ref.current?.getDuration();
        if (typeof t === 'number') setCurrent(t);
        if (typeof d === 'number' && d) setDuration(d);
      } catch {
        /* yok say */
      }
    }, 500);
    return () => clearInterval(id);
  }, [ready]);

  const onState = useCallback((state: string) => {
    if (state === 'playing') setPlaying(true);
    else if (state === 'paused' || state === 'ended') setPlaying(false);
  }, []);

  function seekTo(ratio: number) {
    const to = Math.max(0, Math.min(1, ratio)) * duration;
    ref.current?.seekTo(to, true);
    setCurrent(to);
  }

  async function toggleMute() {
    // IFrame API mute/unMute komutu (ref üzerinden değil) yerine player'a JS'siz
    // erişim yok; basitçe ses ikonu durumunu takip et + seek/oynatma yeterli.
    setMuted((m) => !m);
  }

  const pct = duration ? (current / duration) * 100 : 0;
  const height = width > 0 ? (width * 9) / 16 : 0;

  return (
    <View style={styles.frame} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <YoutubePlayer
          ref={ref}
          height={height}
          width={width}
          play={playing}
          mute={muted}
          videoId={videoId}
          onReady={() => setReady(true)}
          onChangeState={onState}
          initialPlayerParams={{ controls: false, modestbranding: true, rel: false, iv_load_policy: 3, preventFullScreen: true }}
          webViewProps={protectiveWebViewProps as any}
          webViewStyle={{ backgroundColor: '#000' }}
        />
      )}

      {/* Dokunmaları yakalayan katman — YouTube arayüzüne erişimi keser, tek dokunuş oynat/duraklat */}
      <Pressable style={styles.tapLayer} onPress={() => setPlaying((p) => !p)}>
        {!playing && ready && (
          <View style={styles.bigPlay}>
            <Ionicons name="play" size={30} color="#fff" />
          </View>
        )}
      </Pressable>

      {/* Özel kontrol çubuğu */}
      <View style={styles.bar}>
        <Pressable onPress={() => setPlaying((p) => !p)} hitSlop={8}>
          <Ionicons name={playing ? 'pause' : 'play'} size={20} color="#fff" />
        </Pressable>
        <Text style={styles.time}>{fmt(current)} / {fmt(duration)}</Text>
        <Pressable
          style={styles.seek}
          onLayout={(e) => setSeekW(e.nativeEvent.layout.width)}
          onPress={(e) => seekW > 0 && seekTo(e.nativeEvent.locationX / seekW)}
        >
          <View style={styles.seekTrack} />
          <View style={[styles.seekFill, { width: `${pct}%` }]} />
        </Pressable>
        <Pressable onPress={toggleMute} hitSlop={8}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  msg: { color: '#fff', fontSize: 14, textAlign: 'center' },
  tapLayer: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  bigPlay: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  time: { color: '#fff', fontSize: 11.5, fontVariant: ['tabular-nums'] },
  seek: { flex: 1, height: 22, justifyContent: 'center' },
  seekTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  seekFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: ACCENT },
});
