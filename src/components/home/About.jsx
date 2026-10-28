import { useEffect, useMemo, useState } from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

import { useCity } from '../../lib/city/cityContext';
import { hasPrograms } from '../../lib/city/cityConfig';
import { homeShowcase, showcaseCounts } from '../../lib/discovery/homeShowcase';
import { fetchDiscoveryItems, filterMemberDiscoveryItems } from '../../lib/member/memberDiscovery';
import { Link, useLocation } from '../../lib/router';
import { supabase } from '../../lib/supabase';
import SectionHeading from '../common/SectionHeading';
import { EventWeekArt, HackathonDeckArt, ProgramRunwayArt } from './OpportunityArt';
import '../../styles/home-sections.css';

const EVENT_TYPES = Object.freeze(['events', 'hackathons']);
const ALL_TYPES = Object.freeze(['events', 'hackathons', 'programs']);

const About = () => {
  const { enabledSections, selectedDiscoveryCityCodes } = useCity();
  const { search } = useLocation();
  const programsEnabled = hasPrograms(enabledSections);
  const [items, setItems] = useState([]);
  const cityKey = selectedDiscoveryCityCodes.join(',');

  useEffect(() => {
    let isCurrent = true;
    fetchDiscoveryItems(supabase, {
      cities: cityKey.split(','),
      opportunityTypes: programsEnabled ? ALL_TYPES : EVENT_TYPES,
    })
      .then((nextItems) => { if (isCurrent) setItems(nextItems); })
      // The graphics fall back to their empty frames; the links still work.
      .catch((error) => console.error('Could not load the opportunity showcase.', error));
    return () => { isCurrent = false; };
  }, [cityKey, programsEnabled]);

  const showcase = useMemo(() => homeShowcase({
    events: filterMemberDiscoveryItems(items, 'events'),
    hackathons: filterMemberDiscoveryItems(items, 'hackathons'),
    programs: programsEnabled ? filterMemberDiscoveryItems(items, 'programs') : [],
  }), [items, programsEnabled]);
  const counts = showcaseCounts(showcase);

  const paths = [
    {
      key: 'events',
      title: 'Events',
      path: '/discover/events',
      art: <EventWeekArt week={showcase.events.week} />,
    },
    {
      key: 'hackathons',
      title: 'Hackathons',
      path: '/discover/hackathons',
      art: <HackathonDeckArt deck={showcase.hackathons.deck} />,
    },
    ...(programsEnabled ? [{
      key: 'programs',
      title: 'Programs',
      path: '/discover/programs',
      art: <ProgramRunwayArt marks={showcase.programs.marks} />,
    }] : []),
  ];

  return (
    <section id="about" className="about-section relative z-10 w-full" aria-labelledby="about-title">
      <div className="section-container relative">
        <SectionHeading
          titleId="about-title"
          title="Find your next opportunity"
          description={programsEnabled
            ? 'What’s on this week, the next hackathons, and deadlines closing soon.'
            : 'What’s on this week and the next hackathons to build at.'}
          align="center"
        />

        <div id="explore" className={`ho-paths ho-paths--${paths.length}`}>
          {paths.map(({ key, title, path, art }) => (
            <Link key={key} to={{ pathname: path, search }} className={`ho-path ho-path--${key}`}>
              <span className="ho-path__stage">{art}</span>
              <span className="ho-path__body">
                <span className="ho-path__copy">
                  <strong className="ho-path__title">{title}</strong>
                  <small className="ho-path__count">{counts[key] || ' '}</small>
                </span>
                <span className="ho-path__action">
                  <span className="sr-only">Browse {title.toLowerCase()}</span>
                  <ArrowRightIcon aria-hidden="true" />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
