import assert from 'node:assert/strict';

import {
  parseEnvironmentFile,
  validatePlatformEnvironment,
} from '../scripts/check-platform-environment.js';

const boundary = Object.freeze({
  previewVercelOrigin:
    'https://blautech-platform-flamurmaliqi-flamurmaliqis-projects.vercel.app',
  productionVercelOrigin: 'https://www.blau-tech.de',
  supabaseOrigin: 'https://rumglmxgshrrbahpohtn.supabase.co',
});

const validEnvironment = Object.freeze({
  VITE_SUPABASE_URL: boundary.supabaseOrigin,
  VITE_SUPABASE_ANON_KEY: 'sb_publishable_validation_only_000000000000',
  VITE_N8N_EVENT_INTAKE_URL: '',
});

assert.doesNotThrow(() => validatePlatformEnvironment(validEnvironment, { boundary }));

assert.doesNotThrow(() => validatePlatformEnvironment(
  validEnvironment,
  { mode: 'production', boundary },
));

for (const name of [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
]) {
  assert.throws(
    () => validatePlatformEnvironment({ ...validEnvironment, [name]: '' }, { boundary }),
    new RegExp(name),
  );
}

for (const invalidSupabaseUrl of [
  'http://rumglmxgshrrbahpohtn.supabase.co',
  'https://example.supabase.co',
  'https://rumglmxgshrrbahpohtn.supabase.co/rest/v1',
]) {
  assert.throws(() => validatePlatformEnvironment({
    ...validEnvironment,
    VITE_SUPABASE_URL: invalidSupabaseUrl,
  }, { boundary }));
}

assert.throws(() => validatePlatformEnvironment(
  validEnvironment,
  { mode: 'staging', boundary },
));

const serviceRoleJwt = [
  Buffer.from('{}').toString('base64url'),
  Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'),
  'signature',
].join('.');

for (const unsafeKey of [
  'YOUR_SUPABASE_PUBLISHABLE_KEY',
  'sb_secret_do_not_bundle_this_value',
  serviceRoleJwt,
]) {
  assert.throws(() => validatePlatformEnvironment({
    ...validEnvironment,
    VITE_SUPABASE_ANON_KEY: unsafeKey,
  }, { boundary }));
}

assert.throws(() => validatePlatformEnvironment({
  ...validEnvironment,
  VITE_N8N_EVENT_INTAKE_URL: 'http://example.com/webhook',
}, { boundary }));

assert.deepEqual(
  parseEnvironmentFile(`
# Generated test fixture
VITE_SUPABASE_URL="${boundary.supabaseOrigin}"
VITE_SUPABASE_ANON_KEY='sb_publishable_validation_only_000000000000'
`),
  {
    VITE_SUPABASE_URL: boundary.supabaseOrigin,
    VITE_SUPABASE_ANON_KEY: 'sb_publishable_validation_only_000000000000',
  },
);

assert.throws(() => parseEnvironmentFile('not-an-environment-entry'));
