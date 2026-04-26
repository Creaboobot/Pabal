export const MICROSOFT_ENTRA_PROVIDER_ID = "microsoft-entra-id";

export function getMicrosoftEntraIssuer(source: NodeJS.ProcessEnv = process.env) {
  if (source.AUTH_MICROSOFT_ENTRA_ID_ISSUER) {
    return source.AUTH_MICROSOFT_ENTRA_ID_ISSUER;
  }

  if (source.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID) {
    return `https://login.microsoftonline.com/${source.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`;
  }

  return undefined;
}

export function hasMicrosoftEntraProviderConfig(
  source: NodeJS.ProcessEnv = process.env,
) {
  return Boolean(
    source.AUTH_MICROSOFT_ENTRA_ID_ID &&
      source.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      getMicrosoftEntraIssuer(source),
  );
}
