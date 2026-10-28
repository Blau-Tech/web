import { useEffect, useState } from 'react';

/**
 * True once the element has scrolled into view. Entry animations key off it,
 * so they play once when seen instead of on page load or on every pass.
 */
export default function useInViewOnce(ref, { rootMargin = '0px 0px -10% 0px' } = {}) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return undefined;
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setInView(true);
      observer.disconnect();
    }, { rootMargin, threshold: 0.12 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [inView, ref, rootMargin]);

  return inView;
}
