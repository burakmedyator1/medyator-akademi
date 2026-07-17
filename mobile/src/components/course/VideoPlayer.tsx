import { useEffect, useRef, useState, useCallback } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView, WebViewNavigation } from 'react-native-webview';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import * as ScreenOrientation from 'expo-screen-orientation';

const PLACEHOLDER_IDS = ['', 'REPLACE_WITH_REAL_VIDEO_ID'];
const ACCENT = '#6aa016';

function isBlocked(url: string): boolean {
  return (
    /youtube\.com\/watch\b/.test(url) ||
    url.includes('youtu.be/') ||
    url.includes('m.youtube.com') ||
    url.includes('accounts.google.com')
  );
}

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
  // iOS'ta programatik oynatma (kendi play tuşumuz) için gerekli.
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserAction: false,
};

function fmt(sec: number): string {
  if (!sec || Number.isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

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
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        {...protectiveWebViewProps}
      />
    </View>
  );
}

/** Native kontroller KAPALI (controls:0) — ayar/paylaş/copy-url yok. Kendi
 *  kontrollerimiz: oynat/duraklat, 10sn ileri-geri, dokun-atla, tam ekran. */
function YoutubeCustom({ videoId }: { videoId: string }) {
  const ref = useRef<YoutubeIframeRef>(null);
  const startAt = useRef(0);
  const dims = useWindowDimensions();

  const [inlineW, setInlineW] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const id = setInterval(async () => {
      try {
        const t = await ref.current?.getCurrentTime();
        const d = await ref.current?.getDuration();
        if (typeof t === 'number') { setCurrent(t); startAt.current = t; }
        if (typeof d === 'number' && d) setDuration(d);
      } catch {
        /* yok say */
      }
    }, 500);
    return () => clearInterval(id);
  }, [ready]);

  // Ekrandan çıkınca dikeye geri dön.
  useEffect(() => () => { ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {}); }, []);

  const onState = useCallback((s: string) => {
    if (s === 'playing') setPlaying(true);
    else if (s === 'paused' || s === 'ended') setPlaying(false);
  }, []);

  const seekTo = (sec: number) => {
    const to = Math.max(0, duration ? Math.min(duration, sec) : sec);
    ref.current?.seekTo(to, true);
    setCurrent(to);
    startAt.current = to;
  };

  async function toggleFullscreen() {
    if (!fullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
      setFullscreen(true);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      setFullscreen(false);
    }
  }

  function player(w: number, h: number) {
    return (
      <YoutubePlayer
        ref={ref}
        height={h}
        width={w}
        play={playing}
        videoId={videoId}
        onReady={() => setReady(true)}
        onChangeState={onState}
        initialPlayerParams={{ controls: false, modestbranding: true, rel: false, iv_load_policy: 3, start: Math.floor(startAt.current) } as any}
        webViewProps={protectiveWebViewProps as any}
        webViewStyle={{ backgroundColor: '#000' }}
      />
    );
  }

  const controls = (
    <View style={styles.bar}>
      <Pressable onPress={() => setPlaying((p) => !p)} hitSlop={8}>
        <Ionicons name={playing ? 'pause' : 'play'} size={22} color="#fff" />
      </Pressable>
      <Pressable onPress={() => seekTo(current - 10)} hitSlop={6}>
        <Ionicons name="play-back" size={18} color="#fff" />
      </Pressable>
      <Pressable onPress={() => seekTo(current + 10)} hitSlop={6}>
        <Ionicons name="play-forward" size={18} color="#fff" />
      </Pressable>
      <Text style={styles.time}>{fmt(current)} / {fmt(duration)}</Text>
      <SeekBar current={current} duration={duration} onSeek={seekTo} />
      <Pressable onPress={toggleFullscreen} hitSlop={8}>
        <Ionicons name={fullscreen ? 'contract' : 'expand'} size={20} color="#fff" />
      </Pressable>
    </View>
  );

  if (fullscreen) {
    const fw = Math.max(dims.width, dims.height);
    const fh = Math.min(dims.width, dims.height);
    return (
      <Modal visible transparent={false} supportedOrientations={['landscape', 'landscape-left', 'landscape-right']} onRequestClose={toggleFullscreen}>
        <View style={styles.fsRoot}>
          {player(fw, fh)}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPlaying((p) => !p)} />
          {controls}
        </View>
      </Modal>
    );
  }

  const h = inlineW > 0 ? (inlineW * 9) / 16 : 0;
  return (
    <View style={styles.frame} onLayout={(e) => setInlineW(e.nativeEvent.layout.width)}>
      {inlineW > 0 && player(inlineW, h)}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setPlaying((p) => !p)} />
      {controls}
    </View>
  );
}

function SeekBar({ current, duration, onSeek }: { current: number; duration: number; onSeek: (s: number) => void }) {
  const [w, setW] = useState(0);
  const pct = duration ? (current / duration) * 100 : 0;
  return (
    <Pressable
      style={styles.seek}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onPress={(e) => w > 0 && duration > 0 && onSeek((e.nativeEvent.locationX / w) * duration)}
    >
      <View style={styles.seekTrack} />
      <View style={[styles.seekFill, { width: `${pct}%` }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', overflow: 'hidden' },
  web: { flex: 1, backgroundColor: '#000' },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  msg: { color: '#fff', fontSize: 14, textAlign: 'center' },
  fsRoot: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
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
