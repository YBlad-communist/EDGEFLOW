import { useRef, useEffect } from "react";
import Hls from "hls.js";

export default function HlsPlayer({ src, autoPlay = true }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    let hls;
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { if (autoPlay) video.play().catch(() => {}); });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => { if (autoPlay) video.play().catch(() => {}); });
    }
    return () => { if (hls) hls.destroy(); };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      controls
      className="w-full rounded-xl bg-black"
      onContextMenu={(e) => e.preventDefault()}
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
    />
  );
}
