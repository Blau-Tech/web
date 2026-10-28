import { lazy, Suspense } from 'react';
import { MotionConfig } from 'framer-motion';
import { Route, Switch } from 'wouter';
import { CityProvider, useCity } from './lib/city/cityContext';
import { DiscoveryFilterProvider } from './lib/discovery/discoveryFilterContext';
import { Navigate, Router, useLocation } from './lib/router';

import TimedAlert from './components/feedback/TimedAlert';
import ErrorBoundary from './components/common/ErrorBoundary';
import FeedbackWidget from './components/feedback/FeedbackWidget';
import NewsletterModal from './components/newsletter/NewsletterModal';

const Home = lazy(() => import('./pages/Home'));
const Partners = lazy(() => import('./pages/Partners'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const StudentsLayout = lazy(() => import('./components/layout/StudentsLayout'));
const MemberDiscoverPage = lazy(() => import('./pages/discover/MemberDiscoverPage'));
const EventShowcasePage = lazy(() => import('./pages/discover/EventShowcasePage'));
const ProgramShowcasePage = lazy(() => import('./pages/discover/ProgramShowcasePage'));
const OpportunityDetailPage = lazy(() => import('./pages/discover/OpportunityDetailPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RequireOpportunityType({ type, children }) {
  const { selectedOpportunityTypes } = useCity();

  if (!selectedOpportunityTypes.includes(type)) {
    return <Navigate to="/discover/programs?types=programs" replace />;
  }

  return children;
}

function LegacyDiscoverRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  // The former catch-all discovery page has been retired. Preserve the city
  // selection from old links, but always load the dedicated programs view.
  params.set('types', 'programs');
  params.delete('view');
  const nextSearch = params.toString();

  return (
    <Navigate
      to={`/discover/programs${nextSearch ? `?${nextSearch}` : ''}`}
      replace
    />
  );
}

function CityApp() {
  return (
    <>
      <ErrorBoundary>
        <Suspense fallback={null}>
          <Switch>
            <Route path="/partners"><Partners /></Route>
            {/* Confirmation emails link to /newsletter#token=…; NewsletterModal reads it before this redirect. */}
            <Route path="/newsletter"><Navigate to="/" replace /></Route>
            <Route path="/privacy"><PrivacyPage /></Route>
            <Route path="/onboarding"><Navigate to="/" replace /></Route>

            {/* Scholarships were retired; keep old links landing on programs. */}
            <Route path="/discover/programs/scholarships/guide">
              <Navigate to="/discover/programs?types=programs" replace />
            </Route>
            <Route path="/discover/scholarships/guide">
              <Navigate to="/discover/programs?types=programs" replace />
            </Route>
            <Route path="/discover/scholarships">
              <Navigate to="/discover/programs?types=programs" replace />
            </Route>
            <Route path="/discover/events/:id/:slug">
              <StudentsLayout allowPageScroll flush minimal>
                <OpportunityDetailPage kind="events" />
              </StudentsLayout>
            </Route>
            <Route path="/discover/hackathons/:id/:slug">
              <StudentsLayout allowPageScroll flush minimal>
                <OpportunityDetailPage kind="hackathons" />
              </StudentsLayout>
            </Route>
            <Route path="/discover/programs/:id/:slug">
              <StudentsLayout allowPageScroll flush minimal>
                <OpportunityDetailPage kind="programs" />
              </StudentsLayout>
            </Route>
            <Route path="/discover/programs">
              <StudentsLayout allowPageScroll flush minimal>
                <ProgramShowcasePage />
              </StudentsLayout>
            </Route>
            <Route path="/discover/ecosystem">
              <Navigate to="/discover/programs?types=programs" replace />
            </Route>
            <Route path="/discover/clubs">
              <Navigate to="/discover/programs?types=programs" replace />
            </Route>
            <Route path="/discover/hackathons">
              <StudentsLayout allowPageScroll>
                <RequireOpportunityType type="hackathons">
                  <MemberDiscoverPage mode="hackathons" />
                </RequireOpportunityType>
              </StudentsLayout>
            </Route>
            <Route path="/discover/events">
              <StudentsLayout allowPageScroll minimal>
                <RequireOpportunityType type="events">
                  <EventShowcasePage />
                </RequireOpportunityType>
              </StudentsLayout>
            </Route>
            <Route path="/discover">
              <LegacyDiscoverRedirect />
            </Route>
            <Route path="/">
              <Home />
            </Route>
            <Route path="*"><NotFoundPage /></Route>
          </Switch>
        </Suspense>
      </ErrorBoundary>
      <TimedAlert />
      <NewsletterModal />
      <FeedbackWidget />
    </>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <Router>
        <DiscoveryFilterProvider>
          <CityProvider>
            <CityApp />
          </CityProvider>
        </DiscoveryFilterProvider>
      </Router>
    </MotionConfig>
  );
}

export default App;
