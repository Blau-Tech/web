import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const REQUIRED_VARIABLES = Object.freeze([
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
]);

function readBoundary() {
  return JSON.parse(readFileSync(join(repoRoot, 'config/deployment-boundary.json'), 'utf8'));
}

function invalid(name, reason) {
  throw new Error(`${name} ${reason}.`);
}

function requiredValue(values, name, mode) {
  const value = typeof values?.[name] === 'string' ? values[name].trim() : '';
  if (!value) invalid(name, `is required for ${mode} deployment`);
  return value;
}

function exactHttpsUrl(name, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    invalid(name, 'must be a valid URL');
  }

  if (
    url.protocol !== 'https:'
    || url.username
    || url.password
    || url.hostname.includes('*')
    || url.search
    || url.hash
  ) {
    invalid(name, 'must be an exact credential-free HTTPS URL without wildcards, query, or fragment');
  }

  return url;
}

function jwtRole(value) {
  const parts = value.split('.');
  if (parts.length !== 3) return null;

  try {
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')).role || null;
  } catch {
    return null;
  }
}

export function parseEnvironmentFile(contents) {
  const values = {};

  String(contents || '').split(/\r?\n/).forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      throw new Error(`Environment file contains an invalid entry on line ${index + 1}.`);
    }

    const [, name, rawValue] = match;
    let value = rawValue.trim();
    if (value.startsWith('"')) {
      try {
        value = JSON.parse(value);
      } catch {
        throw new Error(`Environment file contains an invalid quoted value on line ${index + 1}.`);
      }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }

    values[name] = value;
  });

  return values;
}

export function validatePlatformEnvironment(
  values,
  { mode = 'preview', boundary = readBoundary() } = {},
) {
  if (!['preview', 'production'].includes(mode)) {
    throw new Error(`Unsupported platform environment mode: ${mode}.`);
  }

  for (const name of REQUIRED_VARIABLES) requiredValue(values, name, mode);

  const supabaseValue = requiredValue(values, 'VITE_SUPABASE_URL', mode);
  const supabaseUrl = exactHttpsUrl('VITE_SUPABASE_URL', supabaseValue);
  if (supabaseUrl.pathname !== '/' || supabaseUrl.origin !== boundary.supabaseOrigin) {
    invalid('VITE_SUPABASE_URL', 'must use the reviewed shared Supabase origin');
  }

  const anonKey = requiredValue(values, 'VITE_SUPABASE_ANON_KEY', mode);
  if (
    anonKey.length < 24
    || /\s/.test(anonKey)
    || /(?:YOUR_|PLACEHOLDER|service[_-]?role|sb_secret_)/i.test(anonKey)
    || jwtRole(anonKey) === 'service_role'
  ) {
    invalid('VITE_SUPABASE_ANON_KEY', 'must be a browser-safe publishable or anon key');
  }

  for (const name of ['VITE_N8N_EVENT_INTAKE_URL']) {
    const value = typeof values?.[name] === 'string' ? values[name].trim() : '';
    if (!value) continue;
    const webhookUrl = exactHttpsUrl(name, value);
    if (webhookUrl.pathname === '/') invalid(name, 'must include an explicit webhook path');
  }

  return Object.freeze({
    mode,
    requiredVariables: REQUIRED_VARIABLES,
    deploymentOrigin: mode === 'production'
      ? boundary.productionVercelOrigin
      : boundary.previewVercelOrigin,
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    const mode = process.argv[2] || 'preview';
    validatePlatformEnvironment(process.env, { mode });
    console.log(`Platform ${mode} environment verified without exposing values.`);
  } catch (error) {
    console.error(`Platform environment check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
