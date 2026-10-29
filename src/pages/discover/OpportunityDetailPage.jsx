import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'wouter';

import EventAgendaRow from '../../components/discover/events/EventAgendaRow';
import ProgramCard from '../../components/discover/programs/ProgramCard';
import DetailRow from '../../components/opportunity-detail/DetailRow';
import OpportunityDetailSkeleton from '../../components/opportunity-detail/OpportunityDetailSkeleton';
import OpportunityHero from '../../components/opportunity-detail/OpportunityHero';
import { MEMBER_CITY_CODES, MEMBER_CITY_CONFIG } from '../../lib/member/memberPreferenceContract';
import { fetchDiscoveryItems } from '../../lib/member/memberDiscovery';
import {
  fetchPublishedOpportunity,
  formatOpportunityDate,
  formatOpportunityFormat,
  formatOpportunityTime,
  formatProgramRun,
  normalizeOpportunityKind,
  opportunityCanonicalUrl,
  opportunityDetailPath,
  opportunityKey,
  opportunityListPath,
  opportunityScope,
  slugifyOpportunityTitle,
} from '../../lib/discovery/opportunityDetail';
import { programApplicationStatus } from '../../lib/discovery/discover';
import { upcomingEvents } from '../../lib/discovery/eventAgenda';
import { comparePrograms, programGroup } from '../../lib/discovery/programBrowse';
import { deadlineStatus } from '../../lib/discovery/programFormat';
import { useLocation, useNavigate } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import '../../styles/discover-showcase.css';
import '../../styles/opportunity-detail.css';

const KIND_LABELS = Object.freeze({
  events: 'Event',
  hackathons: 'Hackathon',
  programs: 'Program',
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
      // A listing without its own image leaves the site's default social preview in place.
      const imageUrl = item.imageUrl;
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

const RELATED_LIMIT = 3;

/** A few more listings from the same place, so a page is never a dead end. Silent if they cannot load. */
function useRelatedListings(item, kind) {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!item) return undefined;
    let active = true;
    const itemCities = kind === 'programs' ? item.audienceCities : [item.city];
    const cities = (itemCities || []).filter((cityCode) => MEMBER_CITY_CODES.includes(cityCode));

    fetchDiscoveryItems(supabase, {
      cities: cities.length ? cities : MEMBER_CITY_CODES,
      opportunityTypes: kind === 'programs' ? ['programs'] : ['events', 'hackathons'],
    }).then((items) => {
      if (!active) return;
      const others = items.filter((entry) => opportunityKey(entry) !== opportunityKey(item));
      const next = kind === 'programs'
        ? others
          .filter((entry) => entry.programType === 'program' && programGroup(entry) !== null
            && programApplicationStatus(entry) !== 'CLOSED')
          .sort(comparePrograms)
        : upcomingEvents(others);
      setRelated(next.slice(0, RELATED_LIMIT));
    }).catch(() => { if (active) setRelated([]); });

    return () => { active = false; };
  }, [item, kind]);

  return related;
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
  const related = useRelatedListings(state.item, kind);

  // Two big tiles for the answers people came for (when and where, or by when), then the rest as a short list.
  const { tiles, rows } = useMemo(() => {
    if (!state.item) return { tiles: [], rows: [] };
    const item = state.item;
    if (kind === 'programs') {
      return {
        tiles: [
          {
            label: 'Apply by',
            value: item.date ? formatOpportunityDate(item.date, { includeWeekday: false }) : deadlineStatus(item),
            sub: item.date ? deadlineStatus(item) : null,
            tone: 'navy',
          },
          {
            label: 'Where',
            value: opportunityScope(item),
            sub: [item.location, formatOpportunityFormat(item.format)].filter(Boolean).join(' · '),
          },
        ],
        rows: [
          ['Organisation', item.organizer],
          ['Application opens', item.applicationOpenDate ? formatOpportunityDate(item.applicationOpenDate, { includeWeekday: false }) : null],
          ['Program dates', formatProgramRun(item)],
          ['Program type', item.tag || (item.programType === 'fellowship' ? 'Fellowship' : 'Program')],
          ['Who can apply', item.eligibilityNotes],
          ['What you get', item.benefits],
        ],
      };
    }
    const endsLater = item.endDate && formatOpportunityDate(item.endDate) !== formatOpportunityDate(item.date);
    return {
      tiles: [
        {
          label: 'When',
          value: formatOpportunityDate(item.date),
          sub: [item.time ? formatOpportunityTime(item.time) : null, endsLater ? `Until ${formatOpportunityDate(item.endDate, { includeWeekday: false })}` : null]
            .filter(Boolean).join(' · '),
          tone: 'navy',
        },
        {
          label: 'Where',
          value: item.location || (String(item.format || '').toUpperCase() === 'ONLINE' ? 'Online' : 'To be announced'),
          sub: [opportunityScope(item), formatOpportunityFormat(item.format)].filter(Boolean).join(' · '),
        },
      ],
      rows: [
        ['Organiser', item.organizer],
        ['Registration deadline', item.signupDeadline ? formatOpportunityDate(item.signupDeadline) : null],
        ['Prizes', item.prizes],
      ],
    };
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
  const filledRows = rows.filter(([, value]) => value);
  return (
    <article className="opportunity-detail">
      <OpportunityHero
        key={`${kind}:${item.id}:${item.imageUrl || 'none'}`}
        item={item}
        kind={kind}
        typeLabel={typeLabel}
        backPath={backPath}
      />

      <div className="opportunity-detail__body" id="opportunity-details">
        <div className="opportunity-detail__tiles">
          {tiles.map((tile) => (
            <section
              key={tile.label}
              className={`opportunity-detail__tile${tile.tone === 'navy' ? ' opportunity-detail__tile--navy' : ''}`}
            >
              <h2 className="opportunity-detail__tile-label">{tile.label}</h2>
              <p className="opportunity-detail__tile-value">{tile.value}</p>
              {tile.sub ? <p className="opportunity-detail__tile-sub">{tile.sub}</p> : null}
            </section>
          ))}
          {filledRows.length === 1 ? (
            <section className="opportunity-detail__tile">
              <h2 className="opportunity-detail__tile-label">{filledRows[0][0]}</h2>
              <p className="opportunity-detail__tile-value">{filledRows[0][1]}</p>
            </section>
          ) : null}
          {filledRows.length > 1 ? (
            <dl className="opportunity-detail__tile opportunity-detail__facts" aria-label={`${typeLabel} details`}>
              {filledRows.map(([label, value]) => <DetailRow key={label} label={label}>{value}</DetailRow>)}
            </dl>
          ) : null}
        </div>

        <section className="opportunity-detail__tile opportunity-detail__description" aria-labelledby="opportunity-about-title">
          <h2 id="opportunity-about-title" className="opportunity-detail__tile-label">About this {typeLabel.toLowerCase()}</h2>
          {item.description ? (
            item.description.split(/\n{2,}/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)
          ) : (
            <p>The organiser has not added a longer description yet. The original listing may contain more information.</p>
          )}
        </section>
      </div>

      {related.length > 0 ? (
        <section className="ds-page opportunity-detail__more" aria-labelledby="opportunity-more-title">
          <h2 id="opportunity-more-title">{kind === 'programs' ? 'More programs.' : 'More coming up.'}</h2>
          {kind === 'programs' ? (
            <div className="ds-progs">
              {related.map((entry) => (
                <ProgramCard key={opportunityKey(entry)} item={entry} href={opportunityDetailPath(entry, location.search)} />
              ))}
            </div>
          ) : (
            <ul className="ds-day__rows">
              {related.map((entry) => (
                <EventAgendaRow key={opportunityKey(entry)} item={entry} href={opportunityDetailPath(entry, location.search)} />
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </article>
  );
}
