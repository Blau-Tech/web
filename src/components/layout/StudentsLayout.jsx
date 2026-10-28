import AnimatedBackground from './AnimatedBackground';
import MobileNavbar from './MobileNavbar';
import SiteFooter from './SiteFooter';

const StudentsLayout = ({ children, allowPageScroll = false, flush = false, minimal = false }) => {
  return (
    <div className={`students-layout${minimal ? ' students-layout--minimal' : ''}${flush ? ' students-layout--flush' : ''} relative min-h-screen overflow-x-clip`}>
      {minimal ? null : <AnimatedBackground />}
      <div className="relative z-10 flex min-h-screen flex-col">
        <MobileNavbar />
        <main className="flex-1">
          <section className={`relative z-10 w-full ${
            allowPageScroll
              ? 'pb-10 pt-16 sm:pb-12 sm:pt-20'
              : 'pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24'
          }`}>
            {children}
          </section>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
};

export default StudentsLayout;
