import AnimatedBackground from '../components/layout/AnimatedBackground';
import MobileNavbar from '../components/layout/MobileNavbar';
import { GlassButton } from '../components/ui/glass-button';
import { useNavigate } from '../lib/router';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <MobileNavbar />
        <main className="grid flex-1 place-items-center px-6 py-16 text-center">
          <section aria-labelledby="not-found-title" className="max-w-lg">
            <h1 id="not-found-title" className="heading-2">
              Page not found
            </h1>
            <p className="body-section mt-5">
              The page you’re looking for doesn’t exist or may have moved.
            </p>
            <div className="mt-8">
              <GlassButton type="button" onClick={() => navigate('/')}>
                Return home
              </GlassButton>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
