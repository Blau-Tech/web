import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useParams } from 'wouter';

import AddToCalendar from '../../components/opportunity-detail/AddToCalendar';
import DetailRow from '../../components/opportunity-detail/DetailRow';
import OpportunityDetailSkeleton from '../../components/opportunity-detail/OpportunityDetailSkeleton';
import OpportunityHero from '../../components/opportunity-detail/OpportunityHero';
import { MEMBER_CITY_CONFIG } from '../../lib/member/memberPreferenceContract';
import {
  fetchPublishedOpportunity,
  formatOpportunityDate,
  formatOpportunityFormat,
  formatOpportunityTime,
  formatProgramRun,
  normalizeOpportunityKind,
  opportunityCanonicalUrl,
  opportunityDetailPath,
  opportunityListPath,
  opportunityScope,
  slugifyOpportunityTitle,
} from '../../lib/discovery/opportunityDetail';
import { HOUSE_IMAGES } from '../../lib/discovery/opportunityImage';
import { programApplicationStatus } from '../../lib/discovery/discover';
import { deadlineStatus } from '../../lib/discovery/programFormat';
import { useLocation, useNavigate } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import '../../styles/opportunity-detail.css';

const KIND_LABELS = Object.freeze({
  events: 'Event',
  hackathons: 'Hackathon',
  programs: 'Program',
});

const KIND_VISUALS = Object.freeze({
  events: {
    fallbackImage: HOUSE_IMAGES.organisers,
  },
  hackathons: {
    fallbackImage: HOUSE_IMAGES.events,
  },
  programs: {
    fallbackImage: HOUSE_IMAGES.programs,
  },
});

function setMeta(selector, attribute, value) {
  const element = document.head.querySelector(selector);
  if (element && value) element.setAttribute(attribute, value);
}

function useOpportunityMetadata(item, kind, status) {
  useEffect(() => {
    const previousTitle = document.title;
    const tracked = [
      ['meta[name="description"]', 'content'],
      ['meta[name="robots"]', 'content'],
      ['meta[property="og:type"]', 'content'],
      ['meta[property="og:url"]', 'content'],
      ['meta[property="og:title"]', 'content'],
      ['meta[property="og:description"]', 'content'],
      ['meta[property="og:image"]', 'content'],
      ['meta[name="twitter:title"]', 'content'],
      ['meta[name="twitter:description"]', 'content'],
      ['meta[name="twitter:image"]', 'content'],
      ['link[rel="canonical"]', 'href'],
    ].map(([selector, attribute]) => {
      const element = document.head.querySelector(selector);
      return [selector, attribute, element?.getAttribute(attribute) ?? null];
    });

    const existingStructuredData = document.getElementById('opportunity-structured-data');
    existingStructuredData?.remove();

    if (status === 'ready' && item) {
      const typeLabel = KIND_LABELS[kind] || 'Opportunity';
      const description = (item.description || `${typeLabel} from ${item.organizer || 'Blau Tech'}`)
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
      const canonicalUrl = opportunityCanonicalUrl(item);
      const imageUrl = item.imageUrl || `https://www.blau-tech.de${KIND_VISUALS[kind].fallbackImage}`;
      const title = `${item.title} — ${typeLabel} | Blau Tech`;

      document.title = title;
      setMeta('meta[name="description"]', 'content', description);
      setMeta('meta[name="robots"]', 'content', 'index, follow, max-image-preview:large');
      setMeta('meta[property="og:type"]', 'content', kind === 'programs' ? 'website' : 'article');
      setMeta('meta[property="og:url"]', 'content', canonicalUrl);
      setMeta('meta[property="og:title"]', 'content', title);
      setMeta('meta[property="og:description"]', 'content', description);
      setMeta('meta[property="og:image"]', 'content', imageUrl);
      setMeta('meta[name="twitter:title"]', 'content', title);
      setMeta('meta[name="twitter:description"]', 'content', description);
      setMeta('meta[name="twitter:image"]', 'content', imageUrl);
      setMeta('link[rel="canonical"]', 'href', canonicalUrl);

      const structuredData = document.createElement('script');
      structuredData.id = 'opportunity-structured-data';
      structuredData.type = 'application/ld+json';
      const hasCurrentApplications = ['OPEN', 'UPCOMING', 'ROLLING'].includes(programApplicationStatus(item));
      const common = {
        '@context': 'https://schema.org',
        name: item.title,
        description,
        url: canonicalUrl,
        image: item.imageUrl || undefined,
        organizer: item.organizer ? { '@type': 'Organization', name: item.organizer } : undefined,
      };
      const schema = kind === 'programs'
        ? {
            ...common,
            '@type': 'EducationalOccupationalProgram',
            provider: common.organizer,
            applicationStartDate: hasCurrentApplications ? item.applicationOpenDate || undefined : undefined,
            applicationDeadline: hasCurrentApplications ? item.date || undefined : undefined,
            areaServed: (item.audienceCities || []).map((cityCode) => ({
              '@type': 'City',
              name: MEMBER_CITY_CONFIG[cityCode]?.name || cityCode,
            })),
          }
        : {
            ...common,
            '@type': 'Event',
            startDate: item.date || undefined,
            endDate: item.endDate || item.date || undefined,
            eventStatus: 'https://schema.org/EventScheduled',
            eventAttendanceMode: String(item.format || '').toUpperCase() === 'ONLINE'
              ? 'https://schema.org/OnlineEventAttendanceMode'
              : 'https://schema.org/OfflineEventAttendanceMode',
            location: item.location ? { '@type': 'Place', name: item.location } : undefined,
          };
      structuredData.textContent = JSON.stringify(schema);
      document.head.appendChild(structuredData);
    } else if (status === 'missing') {
      document.title = 'Opportunity not found | Blau Tech';
      setMeta('meta[name="robots"]', 'content', 'noindex, follow');
    }

    return () => {
      document.title = previousTitle;
      tracked.forEach(([selector, attribute, value]) => {
        const element = document.head.querySelector(selector);
        if (!element) return;
        if (value === null) element.removeAttribute(attribute);
        else element.setAttribute(attribute, value);
      });
      document.getElementById('opportunity-structured-data')?.remove();
    };
  }, [item, kind, status]);
}

export default function OpportunityDetailPage({ kind: kindValue }) {
  const { id, slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const kind = normalizeOpportunityKind(kindValue);
  const [state, setState] = useState({ status: 'loading', item: null });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading', item: null });

    fetchPublishedOpportunity(supabase, kind, id).then(({ item, error }) => {
      if (!active) return;
      if (error) setState({ status: 'error', item: null });
      else if (!item) setState({ status: 'missing', item: null });
      else setState({ status: 'ready', item });
    });

    return () => { active = false; };
  }, [id, kind]);

  useEffect(() => {
    if (state.status !== 'ready' || !state.item) return;
    const expectedSlug = slugifyOpportunityTitle(state.item.title);
    if (slug === expectedSlug) return;
    navigate(opportunityDetailPath(state.item, location.search), { replace: true });
  }, [location.search, navigate, slug, state]);

  useOpportunityMetadata(state.item, kind, state.status);

  const facts = useMemo(() => {
    if (!state.item) return [];
    const item = state.item;
    if (kind === 'programs') {
      return [
        ['Applications', deadlineStatus(item)],
        ['Application opens', item.applicationOpenDate ? formatOpportunityDate(item.applicationOpenDate, { includeWeekday: false }) : null],
        ['Application deadline', item.date ? formatOpportunityDate(item.date) : null],
        ['Program dates', formatProgramRun(item)],
        ['Organisation', item.organizer],
        ['Location', item.location],
        ['Format', formatOpportunityFormat(item.format)],
        ['Available in', opportunityScope(item)],
        ['Program type', item.tag || (item.programType === 'fellowship' ? 'Fellowship' : 'Program')],
        ['Who can apply', item.eligibilityNotes],
        ['What you get', item.benefits],
      ];
    }
    return [
      ['Date', formatOpportunityDate(item.date)],
      ['Time', formatOpportunityTime(item.time)],
      ['Ends', item.endDate ? formatOpportunityDate(item.endDate) : null],
      ['Location', item.location || (String(item.format || '').toUpperCase() === 'ONLINE' ? 'Online' : 'To be announced')],
      ['City', opportunityScope(item)],
      ['Format', formatOpportunityFormat(item.format)],
      ['Organiser', item.organizer],
      ['Registration deadline', item.signupDeadline ? formatOpportunityDate(item.signupDeadline) : null],
      ['Prizes', item.prizes],
    ];
  }, [kind, state.item]);

  const backPath = opportunityListPath(kind, location.search);

  if (state.status === 'loading') {
    return <OpportunityDetailSkeleton />;
  }

  if (state.status === 'error') {
    return (
      <div className="opportunity-detail opportunity-detail--state">
        <h1>This opportunity could not be loaded.</h1>
        <p>Check your connection and try again.</p>
        <button type="button" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  if (state.status === 'missing' || !state.item) {
    return (
      <div className="opportunity-detail opportunity-detail--state">
        <h1>Opportunity not found.</h1>
        <p>It may have closed or been removed.</p>
        <a href={backPath}>Browse current opportunities</a>
      </div>
    );
  }

  const item = state.item;
  const typeLabel = KIND_LABELS[kind];
  return (
    <article className="opportunity-detail">
      <OpportunityHero
        key={`${kind}:${item.id}:${item.imageUrl || 'fallback'}`}
        item={item}
        kind={kind}
        typeLabel={typeLabel}
        backPath={backPath}
        fallbackImage={KIND_VISUALS[kind].fallbackImage}
      />

      <div className="opportunity-detail__body" id="opportunity-details">
        <section className="opportunity-detail__description" aria-labelledby="opportunity-about-title">
          <h2 id="opportunity-about-title">About this {typeLabel.toLowerCase()}</h2>
          {item.description ? (
            item.description.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)
          ) : (
            <p>The organiser has not added a longer description yet. The original listing may contain more information.</p>
          )}
        </section>

        <aside className="opportunity-detail__aside" aria-label={`${typeLabel} details`}>
          <div className="opportunity-detail__trust">
            <ShieldCheckIcon className="opportunity-detail__trust-icon" aria-hidden="true" />
            <span>
              <strong>{item.link ? 'Original source available' : 'Curated listing'}</strong>
              <small>
                {item.link
                  ? 'Continue to the organiser’s page for final details.'
                  : 'Published from the information available to Blau Tech.'}
              </small>
            </span>
          </div>
          <dl className="opportunity-detail__facts">
            {facts.map(([label, value]) => <DetailRow key={label} label={label}>{value}</DetailRow>)}
          </dl>
          <div className="opportunity-detail__actions">
            {item.link ? (
              <a href={item.link} target="_blank" rel="noreferrer" className="opportunity-detail__primary-action">
                {kind === 'programs' ? 'View official page' : 'View original listing'}
                <ArrowUpRightIcon aria-hidden="true" />
              </a>
            ) : null}
            <AddToCalendar item={item} />
          </div>
        </aside>
      </div>
    </article>
  );
}
