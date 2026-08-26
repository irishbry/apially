import React from 'react';
import { AlertTriangle, ExternalLink, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { diagnoseDropboxError, DROPBOX_CONSOLE_URL, DROPBOX_APP_ID } from '@/utils/dropboxErrors';

interface Props {
  message?: string | null;
  /** compact renders a single-line summary with a details tooltip-ish block */
  compact?: boolean;
  className?: string;
}

/**
 * Renders a backup/Dropbox error. When the error is a permission problem it
 * explains which scopes are missing and what to enable in the App Console.
 */
const DropboxErrorHint: React.FC<Props> = ({ message, compact = false, className = '' }) => {
  if (!message) return null;
  const diagnosis = diagnoseDropboxError(message);

  if (!diagnosis) {
    return <span className={`text-xs text-destructive block ${className}`}>{message}</span>;
  }

  if (compact) {
    return (
      <span className={`text-xs text-destructive block ${className}`}>
        <span className="font-medium">{diagnosis.title}.</span>{' '}
        {diagnosis.missingScopes.length > 0 && <>Enable {diagnosis.missingScopes.join(', ')} in the Dropbox App Console, then reconnect.</>}
      </span>
    );
  }

  return (
    <div className={`rounded-md border border-destructive/30 bg-destructive/5 p-3 space-y-2 ${className}`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-destructive">{diagnosis.title}</p>
          <p className="text-xs text-muted-foreground break-words">{diagnosis.raw}</p>
        </div>
      </div>

      {diagnosis.missingScopes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          <KeyRound className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mr-1">Required scopes:</span>
          {diagnosis.missingScopes.map((scope) => (
            <Badge key={scope} variant="outline" className="text-[10px] font-mono">
              {scope}
            </Badge>
          ))}
        </div>
      )}

      <ol className="list-decimal pl-5 space-y-1 text-xs text-muted-foreground">
        {diagnosis.actions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ol>

      <a
        href={DROPBOX_CONSOLE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        Open Dropbox App Console (app {DROPBOX_APP_ID}) <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
};

export default DropboxErrorHint;
