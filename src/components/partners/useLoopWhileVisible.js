import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/**
 * Runs a looping artwork only while it is on screen. `is-playing` on the root
 * lets CSS keyframe loops pause too. Reduced-motion visitors get the finished
 * frame (the timeline's `hold` label) and no movement.
 */
export default function useLoopWhileVisible(scope, createTimeline, dependencies = []) {
  useGSAP(() => {
    const root = scope.current;
    if (!root) return undefined;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timeline = createTimeline ? createTimeline(root) : null;

    if (reduceMotion) {
      timeline?.seek('hold').pause();
      return undefined;
    }

    const setPlaying = (isPlaying) => {
      root.classList.toggle('is-playing', isPlaying);
      if (!timeline) return;
      if (isPlaying) timeline.play();
      else timeline.pause();
    };

    timeline?.pause();
    if (!('IntersectionObserver' in window)) {
      setPlaying(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => setPlaying(entry.isIntersecting), { threshold: 0.1 });
    observer.observe(root);
    return () => {
      observer.disconnect();
      root.classList.remove('is-playing');
    };
  }, { scope, dependencies, revertOnUpdate: true });
}
