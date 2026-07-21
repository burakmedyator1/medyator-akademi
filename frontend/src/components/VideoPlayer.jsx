import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import './VideoPlayer.css';

let ytApiPromise = null;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve(window.YT);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

function formatTime(seconds) {
  if (!seconds || Number.isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

// Custom-controlled YouTube player: native controls are disabled so no
// "Watch on YouTube" link or channel branding is ever shown in the UI.
// The actual YouTube iframe is only mounted after the viewer presses play —
// before that, YouTube's own embed shows its title bar/channel avatar/share
// overlay on the paused frame regardless of player params, so we cover that
// entirely with our own plain thumbnail + play button instead.
function YouTubePlayer({ videoId, title, onEnded }) {
  const mountRef = useRef(null);
  const wrapperRef = useRef(null);
  const playerRef = useRef(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;
  const [started, setStarted] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [thumbnail, setThumbnail] = useState(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);

  useEffect(() => {
    setStarted(false);
    setThumbnail(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  }, [videoId]);

  useEffect(() => {
    if (!started) return undefined;
    let destroyed = false;
    let pollId;

    setReady(false);
    setPlaying(false);
    setCurrent(0);
    setDuration(0);

    loadYouTubeApi().then((YT) => {
      if (destroyed || !mountRef.current) return;
      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (destroyed) return;
            setReady(true);
            setDuration(playerRef.current.getDuration());
          },
          onStateChange: (e) => {
            if (destroyed) return;
            setPlaying(e.data === YT.PlayerState.PLAYING);
            if (e.data === YT.PlayerState.ENDED) onEndedRef.current?.();
          },
        },
      });

      pollId = setInterval(() => {
        const player = playerRef.current;
        if (player?.getCurrentTime) {
          setCurrent(player.getCurrentTime());
          const d = player.getDuration();
          if (d) setDuration(d);
        }
      }, 400);
    });

    return () => {
      destroyed = true;
      clearInterval(pollId);
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId, started]);

  const togglePlay = useCallback(() => {
    if (!started) {
      setStarted(true);
      return;
    }
    const player = playerRef.current;
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  }, [started, playing]);

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    if (muted) {
      player.unMute();
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }, [muted]);

  function handleSeek(e) {
    const player = playerRef.current;
    if (!player || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    player.seekTo(ratio * duration, true);
    setCurrent(ratio * duration);
  }

  function toggleFullscreen() {
    const el = wrapperRef.current;
    if (!el) return;

    // Zaten CSS ile tam ekransak (iPhone yolu) çık.
    if (pseudoFullscreen) {
      setPseudoFullscreen(false);
      return;
    }
    // Gerçek tam ekrandaysak çık (masaüstü / Android / iPad).
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
      return;
    }

    // Önce gerçek tam ekranı dene (vendor önekleri dahil). iPhone Safari'de
    // eleman tam ekranı desteklenmediği için bu metotlar yoktur — o zaman
    // CSS ile tüm ekranı kaplayan yalancı tam ekrana düşeriz.
    const request = el.requestFullscreen || el.webkitRequestFullscreen;
    if (request) {
      const result = request.call(el);
      if (result && typeof result.catch === 'function') {
        result.catch(() => setPseudoFullscreen(true));
      }
      // Destekleyen cihazlarda yatay moda geçmeyi dene (zorunlu değil).
      try {
        const lock = window.screen?.orientation?.lock;
        if (lock) lock.call(window.screen.orientation, 'landscape').catch(() => {});
      } catch {
        /* orientation kilidi desteklenmiyor — yoksay */
      }
    } else {
      setPseudoFullscreen(true);
    }
  }

  // Yalancı tam ekran açıkken arka planın kaymasını engelle.
  useEffect(() => {
    if (!pseudoFullscreen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [pseudoFullscreen]);

  const progressPct = duration ? (current / duration) * 100 : 0;

  return (
    <div
      className={`video-player video-player--custom${pseudoFullscreen ? ' video-player--pseudo-fullscreen' : ''}`}
      ref={wrapperRef}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="video-player__frame">
        {started && <div ref={mountRef} />}
        {!started && (
          <button className="video-player__thumb" onClick={togglePlay} aria-label={title}>
            <img
              src={thumbnail}
              alt={title}
              onError={() => setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)}
            />
            <span className="video-player__thumb-play">
              <Play size={28} fill="currentColor" />
            </span>
          </button>
        )}
      </div>
      {started && !ready && <div className="video-player__loading">Video yükleniyor...</div>}

      {started && <button className="video-player__cover" onClick={togglePlay} aria-label={title} tabIndex={-1} />}

      {started && (
        <div className="video-player__controls">
          <button onClick={togglePlay} aria-label={playing ? 'Duraklat' : 'Oynat'}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <span className="video-player__time">
            {formatTime(current)} / {formatTime(duration)}
          </span>
          <div className="video-player__seek" onClick={handleSeek}>
            <div className="video-player__seek-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <button onClick={toggleMute} aria-label={muted ? 'Sesi aç' : 'Sesi kapat'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button onClick={toggleFullscreen} aria-label="Tam ekran">
            <Maximize size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

export default function VideoPlayer({ provider, videoId, title, onEnded }) {
  if (provider === 'youtube') {
    return <YouTubePlayer videoId={videoId} title={title} onEnded={onEnded} />;
  }

  return (
    <div className="video-player" onContextMenu={(e) => e.preventDefault()}>
      <iframe
        src={`https://player.vimeo.com/video/${videoId}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
