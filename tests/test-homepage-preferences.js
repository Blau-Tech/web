import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  hasActiveModal,
  MODAL_OPEN_REQUEST_EVENT,
  requestModalOwnership,
} from '../src/lib/modalCoordination.js';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const heroSource = readFileSync(`${repoRoot}src/components/home/Hero.jsx`, 'utf8');
const appSource = readFileSync(`${repoRoot}src/App.jsx`, 'utf8');
const timedAlertSource = readFileSync(`${repoRoot}src/components/feedback/TimedAlert.jsx`, 'utf8');
const modalSource = readFileSync(`${repoRoot}src/lib/modalCoordination.js`, 'utf8');

assert.equal(hasActiveModal({ querySelector: () => null }), false);
assert.equal(hasActiveModal({ querySelector: () => ({}) }), true);
let requestedEvent = null;
requestModalOwnership({ dispatchEvent: (event) => { requestedEvent = event; } });
assert.equal(requestedEvent.type, MODAL_OPEN_REQUEST_EVENT);

assert(
  heroSource.includes("navigate('/discover/events?types=events');")
    && appSource.includes('path="/discover/events"'),
  'the homepage CTA should go straight to events',
);
assert.equal(heroSource.includes("navigate('/member/setup')"), false);
assert(heroSource.includes('Find your next opportunity'));
assert.equal(heroSource.includes('Where are you based?'), false);
assert.equal(heroSource.includes('setHeroView'), false);
assert.equal(heroSource.includes('DiscoveryPreferenceDialog'), false);
assert.equal(heroSource.includes('setIsPreferenceDialogOpen'), false);
assert(timedAlertSource.includes('if (hasActiveModal())'));
assert(timedAlertSource.includes('MODAL_OPEN_REQUEST_EVENT'));
assert(timedAlertSource.includes('if (isNewsletterPage || suppressExit) return null;'));
assert(modalSource.includes("'[aria-modal=\"true\"]'"));

console.log('Homepage preference component checks passed.');
