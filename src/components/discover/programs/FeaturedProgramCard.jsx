import { deadlineStatus, scopeLabel } from '../../../lib/discovery/programFormat';
import { OpportunityArtwork, OpportunityHitArea } from '../FeaturedOpportunityCard';

export default function FeaturedProgramCard({ item, href }) {
  return (
    <article className="program-showcase-feature-card program-showcase-feature-card--imaged">
      <OpportunityArtwork item={item} />
      <OpportunityHitArea item={item} href={href} className="program-showcase-hitarea" />
      <span className="program-showcase-feature-copy">
        <span className="program-showcase-feature-primary">
          <span className="program-showcase-feature-title">{item.title}</span>
          <span className="program-showcase-card-meta">
            {item.organizer || 'Organisation TBA'}
          </span>
        </span>
        <span className="program-showcase-card-deadline">
          {deadlineStatus(item)}
          <span aria-hidden="true">·</span>
          {scopeLabel(item)}
        </span>
      </span>
    </article>
  );
}
