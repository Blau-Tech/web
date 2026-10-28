import { useRef } from 'react';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  CheckIcon,
  GlobeAltIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { GlassMaterial } from '../ui/glass-material';
import ListingTile from './ListingTile';
import useLoopWhileVisible from './useLoopWhileVisible';

const CHANNELS = Object.freeze([
  { id: 'site', name: 'Blau Tech', detail: 'Events page', Icon: GlobeAltIcon },
  { id: 'telegram-berlin', name: 'Telegram', detail: 'Berlin channel', Icon: PaperAirplaneIcon },
  { id: 'telegram-munich', name: 'Telegram', detail: 'Munich channel', Icon: PaperAirplaneIcon },
  { id: 'whatsapp', name: 'WhatsApp', detail: 'City communities', Icon: ChatBubbleOvalLeftEllipsisIcon },
  { id: 'linkedin', name: 'LinkedIn', detail: 'Blau Tech page', Icon: UserGroupIcon },
]);
// The stage is roughly 2.56:1 (256 x 100). The drawing only spans the left 60%,
// up to where the glass channels start, so the animated lines never sit behind
// the glass and force its blur to be recomputed every frame.
const CHANNEL_Y = Object.freeze([12, 31, 50, 69, 88]);
const STAGE_WIDTH = 256;
const VIEW_WIDTH = STAGE_WIDTH * 0.6;
const SOURCE_X = 0.38 * STAGE_WIDTH;
const TARGET_X = VIEW_WIDTH;

const YOUR_EVENT = Object.freeze({ id: 'your-event', title: 'Your event', date: null, category: 'events' });

function flowPath(y) {
  const bend = (SOURCE_X + TARGET_X) / 2;
  return `M${SOURCE_X} 50 C ${bend} 50, ${bend} ${y}, ${TARGET_X} ${y}`;
}

/** One submitted link fanning out to every place a listing is published. */
export default function ChannelFlow() {
  const scope = useRef(null);
  useLoopWhileVisible(scope, null);

  return (
    <div ref={scope} className="bp-flow">
      <div className="bp-flow__source" aria-hidden="true">
        <ListingTile listing={YOUR_EVENT} className="bp-tile--feature" />
      </div>

      <svg className="bp-flow__lines" viewBox={`0 0 ${VIEW_WIDTH} 100`} preserveAspectRatio="none" aria-hidden="true">
        {CHANNELS.map((channel, index) => (
          <g key={channel.id} style={{ '--i': index }}>
            <path className="bp-flow__track" d={flowPath(CHANNEL_Y[index])} pathLength="100" />
            <path className="bp-flow__pulse" d={flowPath(CHANNEL_Y[index])} pathLength="100" />
          </g>
        ))}
      </svg>

      <ul className="bp-flow__channels" aria-label="Where listings are published">
        {CHANNELS.map(({ id, name, detail, Icon }, index) => (
          <li className="bp-flow__channel" style={{ '--i': index, '--y': `${CHANNEL_Y[index]}%` }} key={id}>
            <GlassMaterial className="bp-flow__glass" materialClassName="bp-flow__glass-surface">
              <Icon className="bp-flow__icon" aria-hidden="true" />
              <span className="bp-flow__name"><strong>{name}</strong><small>{detail}</small></span>
              <CheckIcon className="bp-flow__tick" aria-hidden="true" />
            </GlassMaterial>
          </li>
        ))}
      </ul>
    </div>
  );
}
