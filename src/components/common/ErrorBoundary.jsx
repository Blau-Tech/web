import { Component } from 'react';
import AnimatedBackground from '../layout/AnimatedBackground';
import MobileNavbar from '../layout/MobileNavbar';
import { GlassButton } from '../ui/glass-button';

/**
 * ErrorBoundary catches any unhandled JavaScript error thrown during
 * rendering, lifecycle methods, or constructors of child components.
 *
 * Usage — wrap a subtree:
 *   <ErrorBoundary>
 *     <MyPage />
 *   </ErrorBoundary>
 *
 * Custom fallback:
 *   <ErrorBoundary fallback={({ error, reset }) => <MyFallback ... />}>
 *     ...
 *   </ErrorBoundary>
 *
 * HOC convenience:
 *   export default withErrorBoundary(MyPage);
 *
 * Props
 * ──────────────────────────────────────────────────────────────────────────
 * children        ReactNode  — the subtree to protect
 * fallback        ReactNode | ({ error, reset }) => ReactNode
 *                            — custom fallback UI (optional)
 * title           string     — heading shown in the default fallback UI
 * showMessage     boolean    — include err.message in the default fallback
 *                              (default false — avoids leaking internals)
 * onError         (err, info) => void  — optional side-effect callback
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack ?? '');
    this.props.onError?.(error, info);
  }

  reset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback, title = "We couldn't load this page", showMessage = false } = this.props;

    if (fallback) {
      return typeof fallback === 'function'
        ? fallback({ error: this.state.error, reset: this.reset })
        : fallback;
    }

    const message = showMessage && this.state.error?.message
      ? this.state.error.message
      : 'We hit a temporary snag. Try again, or return home and continue exploring.';

    return (
      <div className="route-fallback-shell relative min-h-screen overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-10 flex min-h-screen flex-col">
          <MobileNavbar />
          <main
            className="route-fallback grid flex-1 place-items-center px-6 py-16 text-center"
            aria-labelledby="route-fallback-title"
            role="alert"
          >
            <div className="route-fallback__content">
              <h1 id="route-fallback-title" className="heading-1 route-fallback__title">
                {title}
              </h1>
              <p className="body-section route-fallback__copy">{message}</p>
              <div className="route-fallback__actions">
                <GlassButton type="button" onClick={this.reset}>
                  Try again
                </GlassButton>
              </div>
              <button
                type="button"
                className="route-fallback__reload-link"
                onClick={() => window.location.reload()}
              >
                Refresh page
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }
}

/**
 * Wraps a component in an ErrorBoundary.
 *
 * @param {React.ComponentType} WrappedComponent
 * @param {object} [boundaryProps] - Props forwarded to ErrorBoundary
 */
export function withErrorBoundary(WrappedComponent, boundaryProps = {}) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';

  function WithBoundary(props) {
    return (
      <ErrorBoundary {...boundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  }

  WithBoundary.displayName = `withErrorBoundary(${displayName})`;
  return WithBoundary;
}

export default ErrorBoundary;
