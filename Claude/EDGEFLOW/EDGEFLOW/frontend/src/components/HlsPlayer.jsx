import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ src, autoPlay = true, className = '' }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari native HLS
      video.src = src;
      if (autoPlay) video.play().catch(() => {});
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      className={`w-full rounded-xl bg-black ${className}`}
      controls
      playsInline
    />
  );
}
