import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import MobileNavbar from '../components/layout/MobileNavbar';
import Hero from '../components/home/Hero';
import Testimonials from '../components/home/Testimonials';
import CommunityPulse from '../components/home/CommunityPulse';
import LivePulse from '../components/home/LivePulse';
import About from '../components/home/About';
import AnimatedBackground from '../components/layout/AnimatedBackground';
import SiteFooter from '../components/layout/SiteFooter';

const Home = () => {
  const scrollerRef = useRef(null);
  const contentRef = useRef(null);
  const lenisRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return undefined;

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

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <div className="home-page relative min-h-screen">
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
                      <LivePulse />
                    </div>
                  </div>
                  {/* Ordered by what a visitor asks: what can I find, who
                      vouches for it, and how alive is it right now. */}
                  <div className="home-scroll-panel home-about-panel">
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
