import assert from 'node:assert/strict';
import { parseInspectedDeploymentOrigin } from '../scripts/vercel-preview-alias.js';

const stableAliasHostname = 'blautech-platform-example.vercel.app';

const inspection = `
  General

    id      dpl_example
    name    blautech-platform
    target  preview
    status  Ready
    url     https://blautech-platform-candidate-example.vercel.app
`;

assert.equal(
  parseInspectedDeploymentOrigin(inspection, { stableAliasHostname }),
  'https://blautech-platform-candidate-example.vercel.app',
);

assert.equal(
  parseInspectedDeploymentOrigin(`\n${inspection}`, { stableAliasHostname }),
  'https://blautech-platform-candidate-example.vercel.app',
);

for (const invalidInspection of [
  '',
  'url https://blautech-platform-example.vercel.app',
  'url http://blautech-platform-candidate-example.vercel.app',
  'url https://blautech-platform-candidate-example.vercel.app/path',
  'url https://example.com',
]) {
  assert.throws(
    () => parseInspectedDeploymentOrigin(invalidInspection, { stableAliasHostname }),
    /Vercel inspection/,
  );
}
