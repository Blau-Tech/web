import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import Snap from 'lenis/snap';
import 'lenis/dist/lenis.css';
import MobileNavbar from '../components/layout/MobileNavbar';
import Hero from '../components/home/Hero';
import Testimonials from '../components/home/Testimonials';
import CommunityPulse from '../components/home/CommunityPulse';
import About from '../components/home/About';
import AnimatedBackground from '../components/layout/AnimatedBackground';
import SiteFooter from '../components/layout/SiteFooter';

const Home = () => {
  const scrollerRef = useRef(null);
  const contentRef = useRef(null);
  const lenisRef = useRef(null);
  const aboutPanelRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    const page = pageRef.current;
    if (!scroller || !content || !page) return undefined;

    // The nav floats over the scroller, so it frosts once the page moves.
    // The nav floats over the scroller, so it turns white once the page moves.
    const markScrolled = () => page.classList.toggle('home-page--scrolled', scroller.scrollTop > 8);
    scroller.addEventListener('scroll', markScrolled, { passive: true });
    markScrolled();

    const lenis = new Lenis({
      wrapper: scroller,
      content,
      eventsTarget: scroller,
      autoRaf: true,
      lerp: 0.13,
      smoothWheel: true,
      syncTouch: false,
      overscroll: false,
      respectReducedMotion: true,
    });
    lenisRef.current = lenis;

    // Snap.addElement measures against the window, which is off by the nav
    // above this wrapper, so the bento's snap point is placed from its offset.
    const snap = new Snap(lenis, { type: 'proximity', distanceThreshold: '25%', debounce: 250 });
    const desktop = window.matchMedia('(min-width: 901px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let removeSnap = () => {};
    const placeSnap = () => {
      removeSnap();
      removeSnap = () => {};
      const bento = aboutPanelRef.current;
      const navHeight = document.querySelector('.apple-global-nav')?.offsetHeight ?? 0;
      if (bento && desktop.matches && !reducedMotion.matches) removeSnap = snap.add(bento.offsetTop - navHeight);
    };
    placeSnap();
    const resizeObserver = new ResizeObserver(placeSnap);
    resizeObserver.observe(content);
    desktop.addEventListener('change', placeSnap);
    reducedMotion.addEventListener('change', placeSnap);

    return () => {
      scroller.removeEventListener('scroll', markScrolled);
      resizeObserver.disconnect();
      desktop.removeEventListener('change', placeSnap);
      reducedMotion.removeEventListener('change', placeSnap);
      snap.destroy();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <div ref={pageRef} className="home-page relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <MobileNavbar />
        <main className="flex-1">
          <div className="home-scroll-stage">
            <div
              ref={scrollerRef}
              className="home-scroll-viewport"
            >
              <div ref={contentRef} className="home-scroll-content">
                <div className="home-scroll-content__track">
                  <div className="home-scroll-panel home-hero-panel">
                    <div className="home-hero-inner">
                      <Hero />
                    </div>
                  </div>
                  {/* Ordered by what a visitor asks: what can I find, who
                      vouches for it, and how alive is it right now. */}
                  <div ref={aboutPanelRef} className="home-scroll-panel home-about-panel">
                    <About />
                  </div>
                  <div className="home-scroll-panel home-testimonials-panel">
                    <Testimonials />
                  </div>
                  <div className="home-scroll-panel home-community-pulse-panel">
                    <CommunityPulse />
                  </div>
                  <div className="home-scroll-panel home-footer-panel">
                    <SiteFooter />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
