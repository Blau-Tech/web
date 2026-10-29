import { Component } from 'react';
import MobileNavbar from '../layout/MobileNavbar';

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

    const { fallback, title = "That page didn't load", showMessage = false } = this.props;

    if (fallback) {
      return typeof fallback === 'function'
        ? fallback({ error: this.state.error, reset: this.reset })
        : fallback;
    }

    const message = showMessage && this.state.error?.message
      ? this.state.error.message
      : 'A temporary snag. Try again, or head back home.';

    return (
      <div className="route-fallback-shell relative min-h-screen overflow-hidden">
        <div className="relative z-10 flex min-h-screen flex-col">
          <MobileNavbar />
          <main
            className="route-fallback grid flex-1 place-items-center px-6 py-16 text-center"
            aria-labelledby="route-fallback-title"
            role="alert"
          >
            <div className="route-fallback__content">
              <div className="brand-pattern brand-pattern--soft route-fallback__pattern" aria-hidden="true" />
              <h1 id="route-fallback-title" className="route-fallback__title">
                {title}
              </h1>
              <p className="route-fallback__copy">{message}</p>
              <div className="route-fallback__actions">
                <button type="button" className="btn-primary" onClick={this.reset}>
                  Try again
                </button>
                <a href="/" className="btn-secondary">
                  Go home
                </a>
              </div>
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
