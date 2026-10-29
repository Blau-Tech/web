import { useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export const HERO_VIDEO_SRC = '/assets/hero/events.mp4';
export const HERO_POSTER_SRC = '/assets/hero/poster.jpg';

/**
 * The hero's backdrop: a muted loop of people at events, full bleed under the nav. It holds the
 * poster frame for reduced motion, and if the file will not play.
 */
export default function HeroVideo() {
  const shouldReduceMotion = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const videoRef = useRef(null);
  const still = shouldReduceMotion || failed;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // React does not reflect `muted` to the DOM, and autoplay needs it.
    video.muted = true;
    video.play().catch(() => setFailed(true));
  }, [still]);

  return (
    <div className="hero-video" aria-hidden="true">
      {still ? (
        <img src={HERO_POSTER_SRC} alt="" />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={HERO_POSTER_SRC}
          onError={() => setFailed(true)}
        >
          <source src={HERO_VIDEO_SRC} type="video/mp4" />
        </video>
      )}
    </div>
  );
}
