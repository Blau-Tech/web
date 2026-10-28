export function parseInspectedDeploymentOrigin(
  output,
  { stableAliasHostname } = {},
) {
  const match = String(output || '').match(/^\s*url\s+(https:\/\/\S+)\s*$/m);
  if (!match) {
    throw new Error('Vercel inspection did not return the current deployment URL.');
  }

  let deploymentUrl;
  try {
    deploymentUrl = new URL(match[1]);
  } catch {
    throw new Error('Vercel inspection returned an invalid deployment URL.');
  }

  if (
    deploymentUrl.protocol !== 'https:'
    || deploymentUrl.username
    || deploymentUrl.password
    || deploymentUrl.pathname !== '/'
    || deploymentUrl.search
    || deploymentUrl.hash
    || !deploymentUrl.hostname.endsWith('.vercel.app')
    || deploymentUrl.hostname === stableAliasHostname
  ) {
    throw new Error('Vercel inspection returned an unsafe deployment URL.');
  }

  return deploymentUrl.origin;
}
