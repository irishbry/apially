/**
 * Translates raw Dropbox API / backup errors into actionable guidance:
 * which scopes are missing and what to enable in the Dropbox App Console.
 */

export const DROPBOX_APP_ID = '3866243';
export const DROPBOX_CONSOLE_URL = `https://www.dropbox.com/developers/apps/info/${DROPBOX_APP_ID}#permissions`;

export interface DropboxErrorDiagnosis {
  /** short human title of what went wrong */
  title: string;
  /** what the user should do next, in order */
  actions: string[];
  /** dropbox permission scopes that must be enabled */
  missingScopes: string[];
  /** true when reauthorization (Reconnect Dropbox) is required */
  needsReconnect: boolean;
  /** original message, always kept for reference */
  raw: string;
}

const SCOPE_HINTS: Array<{ match: RegExp; scopes: string[]; title: string }> = [
  {
    match: /(sharing|shared_link|create_shared_link|shared link)/i,
    scopes: ['sharing.write', 'sharing.read'],
    title: 'Dropbox blocked the share link step',
  },
  {
    match: /(upload_session|upload|files\.content\.write|finalize|commit)/i,
    scopes: ['files.content.write'],
    title: 'Dropbox blocked the file upload',
  },
  {
    match: /(download|files\.content\.read|temporary_link)/i,
    scopes: ['files.content.read'],
    title: 'Dropbox blocked reading the uploaded file',
  },
  {
    match: /(metadata|list_folder|path\/not_found|files\.metadata)/i,
    scopes: ['files.metadata.read'],
    title: 'Dropbox blocked reading folder metadata',
  },
];

const ALL_REQUIRED_SCOPES = [
  'files.content.write',
  'files.content.read',
  'files.metadata.read',
  'sharing.write',
  'sharing.read',
];

export const isDropboxPermissionError = (message?: string | null): boolean =>
  !!message && /(missing_scope|insufficient_scope|invalid_access_token|expired_access_token|401|403|no_permission|not_allowed)/i.test(message);

export const diagnoseDropboxError = (message?: string | null): DropboxErrorDiagnosis | null => {
  if (!message) return null;
  const raw = message;

  const scopeMatch = raw.match(/required_scope["\s:]+([a-z_.]+)/i);
  const permission = isDropboxPermissionError(raw);

  if (!permission) return null;

  const tokenIssue = /(invalid_access_token|expired_access_token)/i.test(raw);

  let missingScopes: string[] = [];
  let title = 'Dropbox rejected the request (permission problem)';

  if (scopeMatch) {
    missingScopes = [scopeMatch[1]];
    title = `Dropbox is missing the "${scopeMatch[1]}" permission`;
  } else {
    const hint = SCOPE_HINTS.find((h) => h.match.test(raw));
    if (hint) {
      missingScopes = hint.scopes;
      title = hint.title;
    } else if (!tokenIssue) {
      missingScopes = ALL_REQUIRED_SCOPES;
    }
  }

  if (tokenIssue && missingScopes.length === 0) {
    title = 'Dropbox authorization expired or was revoked';
  }

  const actions: string[] = [];
  if (missingScopes.length > 0) {
    actions.push(
      `Open the Dropbox App Console (app ID ${DROPBOX_APP_ID}) → Permissions tab and tick: ${missingScopes.join(', ')}.`,
    );
    actions.push('Click Submit at the bottom of the Permissions tab to save the scopes.');
  }
  actions.push('Use "Reconnect Dropbox" below to re-authorize — existing tokens keep their old scopes until you do.');
  actions.push('Re-run the failed backup for the affected source(s).');

  return { title, actions, missingScopes, needsReconnect: true, raw };
};
