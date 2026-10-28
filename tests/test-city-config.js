import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CENTRAL_LINKEDIN_URL,
  CITY_CONFIG,
  DEFAULT_PREVIEW_CITY_CODE,
  GENERIC_CITY_CODE,
  GENERIC_CITY_CONFIG,
  isConfiguredCommunityUrl,
  resolvePreviewCityCode,
} from '../src/lib/city/cityConfig.js';

assert.equal(DEFAULT_PREVIEW_CITY_CODE, GENERIC_CITY_CODE);
assert.equal(resolvePreviewCityCode('preview.vercel.app'), GENERIC_CITY_CODE);
assert.equal(resolvePreviewCityCode('localhost:5173'), GENERIC_CITY_CODE);
assert.equal(resolvePreviewCityCode('[::1]:5173', '?city=MUNICH'), 'MUNICH');
assert.equal(resolvePreviewCityCode('munich.lvh.me', '?city=munich'), 'MUNICH');
assert.equal(resolvePreviewCityCode('preview.vercel.app', '?city=berlin'), 'BERLIN');
assert.equal(resolvePreviewCityCode('preview.vercel.app', '?city=hamburg'), null);
assert.equal(resolvePreviewCityCode('preview.vercel.app', '?city=__proto__'), null);
assert.equal(resolvePreviewCityCode('localhost', '?city=madrid'), null);
assert.equal(
  resolvePreviewCityCode('berlin.blau-tech.de', '?city=MUNICH'),
  GENERIC_CITY_CODE,
  'city subdomains and query strings must not determine central-platform identity',
);
assert.equal(resolvePreviewCityCode('www.blau-tech.de'), GENERIC_CITY_CODE);
assert.equal(resolvePreviewCityCode('berlin.blau-tech.de.evil.example'), GENERIC_CITY_CODE);
assert.equal(GENERIC_CITY_CONFIG.code, null);
assert.equal(GENERIC_CITY_CONFIG.whatsappUrl, null);
assert.equal(GENERIC_CITY_CONFIG.linkedinUrl, CENTRAL_LINKEDIN_URL);
assert.equal(GENERIC_CITY_CONFIG.enabledSections.includes('programs'), true);
assert.equal(CITY_CONFIG.MUNICH.memberEnabled, true);
assert.equal(CITY_CONFIG.BERLIN.memberEnabled, true);
assert.equal(CITY_CONFIG.MADRID.memberEnabled, false);
assert.equal(CITY_CONFIG.AMSTERDAM.memberEnabled, false);
assert.equal(CITY_CONFIG.MADRID.enabledSections.includes('programs'), false);
assert.equal(CITY_CONFIG.MUNICH.enabledSections.includes('programs'), true);
assert.equal(
  CITY_CONFIG.BERLIN.enabledSections.includes('programs'),
  false,
  'The current Berlin design hides the empty programs section',
);
assert.equal(CITY_CONFIG.BERLIN.enabledSections.includes('clubs'), false);
assert.equal(CITY_CONFIG.AMSTERDAM.enabledSections.includes('programs'), true);
assert.equal(CITY_CONFIG.MUNICH.whatsappUrl, 'https://chat.whatsapp.com/DC8WPpK3MA4EC1FyzXqIxt');
assert.equal(CITY_CONFIG.BERLIN.whatsappUrl, 'https://chat.whatsapp.com/JtFNO5XxopgLiUY82YEkwx?mode=gi_t');
assert.equal(CITY_CONFIG.MADRID.whatsappUrl, 'https://chat.whatsapp.com/BTqaVMiKYmgLf2jgml2GiT');
assert.equal(CITY_CONFIG.AMSTERDAM.whatsappUrl, null);
assert.equal(CENTRAL_LINKEDIN_URL, 'https://www.linkedin.com/company/blau-tech/');
for (const city of Object.values(CITY_CONFIG)) {
  assert.equal(city.linkedinUrl, CENTRAL_LINKEDIN_URL);
  assert.equal(isConfiguredCommunityUrl(city.linkedinUrl), true);
}
assert.equal(isConfiguredCommunityUrl(CITY_CONFIG.BERLIN.whatsappUrl), true);
assert.equal(isConfiguredCommunityUrl(CITY_CONFIG.MUNICH.whatsappUrl), true);
assert.equal(isConfiguredCommunityUrl(null), false);
assert.equal(isConfiguredCommunityUrl('TBD'), false);
assert.equal(isConfiguredCommunityUrl('http://example.com'), false);
assert.equal(CITY_CONFIG.BERLIN.wording.opportunitiesTitle, 'Opportunities in Berlin');
assert.equal(CITY_CONFIG.MUNICH.wording.opportunitiesTitle, 'Opportunities in Munich');
assert.equal(CITY_CONFIG.BERLIN.wording.updatesTitle, 'Get Berlin updates');
assert.equal(CITY_CONFIG.MUNICH.wording.updatesTitle, 'Get Munich updates');
assert.equal(CITY_CONFIG.BERLIN.wording.noMatchesTitle, 'No matching opportunities in Berlin');
assert.equal(CITY_CONFIG.MUNICH.wording.noMatchesTitle, 'No matching opportunities in Munich');

const repoRoot = fileURLToPath(new URL('..', import.meta.url));

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(fullPath) : [fullPath];
  });
}

const forbiddenConfigNames = [
  ['VITE', 'CITY', 'NAME'].join('_'),
  ['VITE', 'WHATSAPP', 'URL'].join('_'),
  ['VITE', 'LINKEDIN', 'URL'].join('_'),
  ['VITE', 'NEWSLETTER', 'URL'].join('_'),
];

for (const file of [...sourceFiles(join(repoRoot, 'src')), join(repoRoot, '.env.example')]) {
  const source = readFileSync(file, 'utf8');
  for (const configName of forbiddenConfigNames) {
    assert.equal(source.includes(configName), false, `${file} still uses ${configName}`);
  }
}

const source = (relativePath) => readFileSync(join(repoRoot, relativePath), 'utf8');
for (const file of sourceFiles(join(repoRoot, 'src'))) {
  if (file.endsWith('src/lib/city/cityConfig.js')) continue;
  assert.equal(
    readFileSync(file, 'utf8').includes('linkedin.com/'),
    false,
    `${file} hardcodes a LinkedIn destination outside city configuration`,
  );
}
assert.equal(source('src/components/home/Hero.jsx').includes("city.code === 'BERLIN'"), false);
assert.equal(source('src/components/feedback/TimedAlert.jsx').includes("cityCode === 'BERLIN'"), false);
for (const relativePath of [
  'src/components/home/Hero.jsx',
  'src/components/feedback/TimedAlert.jsx',
]) {
  const componentSource = source(relativePath);
  const whatsappGuard = relativePath.endsWith('Hero.jsx') ? 'whatsappUrl &&' : 'city.whatsappUrl &&';
  assert(componentSource.includes(whatsappGuard), `${relativePath} must hide a missing WhatsApp link`);
  assert(componentSource.includes('city.linkedinUrl &&'), `${relativePath} must hide a missing LinkedIn link`);
}
assert(source('src/components/home/Hero.jsx').includes('city.whatsappUrl || FALLBACK_WHATSAPP_URL'));
const memberDiscoverSource = source('src/pages/discover/MemberDiscoverPage.jsx');
assert(
  memberDiscoverSource.includes('communityCity?.whatsappUrl &&'),
  'discovery must hide city-specific WhatsApp when multiple cities are selected',
);
assert(memberDiscoverSource.includes('href={communityCity.whatsappUrl}'));
assert(memberDiscoverSource.includes('city.linkedinUrl &&'));
const partnersSource = source('src/pages/Partners.jsx');
assert(partnersSource.includes('fetch(EVENT_INTAKE_URL'));
assert(partnersSource.includes('import.meta.env.VITE_N8N_EVENT_INTAKE_URL?.trim()'));
assert.equal(partnersSource.includes("city: 'BERLIN'"), false);
assert.equal(partnersSource.includes('EVENT_CITIES'), false);
assert.equal(partnersSource.includes('eventForm.city'), false);
assert.equal(partnersSource.includes('VITE_N8N_STABLE_WEBHOOK_URL'), false);
assert.equal(partnersSource.includes('VITE_N8N_BERLIN_WEBHOOK_URL'), false);
assert.equal(partnersSource.includes('useCity'), false);
assert.equal(partnersSource.includes('automation.example/webhook'), false);
assert.match(partnersSource, /if \(!EVENT_INTAKE_URL\) \{\s*setEventError\('[^']+'\);\s*return;/, 'missing intake configuration must show an error and stop submission');
assert.match(source('.env.example'), /^VITE_N8N_EVENT_INTAKE_URL=$/m);
assert.equal(source('.env.example').includes('automation.example/webhook'), false);
assert(partnersSource.includes('type="url"'));
assert(partnersSource.includes('placeholder={submissionCopy.placeholder}'));
const memberDiscoveryDataSource = source('src/lib/member/memberDiscovery.js');
assert(memberDiscoveryDataSource.includes('buildOpportunityQueryPlan(cityCode, opportunityType)'));
assert(memberDiscoveryDataSource.includes('filters.cities.flatMap'));
assert(memberDiscoveryDataSource.includes("item.category === mode"));
for (const legacyPath of [
  'src/pages/students/EventsPage.jsx',
  'src/pages/students/HackathonsPage.jsx',
  'src/pages/students/EcosystemPage.jsx',
  'src/components/EventCard.jsx',
  'src/components/OpportunityCard.jsx',
]) {
  assert.equal(existsSync(join(repoRoot, legacyPath)), false, `${legacyPath} should stay retired`);
}
