export interface CsvDataEntry {
  id: string;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  timestamp?: string;
  source_id?: string;
  sourceId?: string;
}

export interface CsvSource {
  id: string;
  name: string;
}

const PREFERRED_COLUMNS = [
  'source', 'created_at', 'fname', 'phone', 'lname', 'address', 'city', 'state', 'zip', 'email', 'ip', 'jornaya', 'trusted_form_url',
];

export function addCsvColumns(columns: Set<string>, entries: CsvDataEntry[]): void {
  columns.add('source');
  columns.add('created_at');
  for (const entry of entries) {
    if (!entry.metadata || typeof entry.metadata !== 'object') continue;
    for (const key of Object.keys(entry.metadata)) {
      if (key !== 'clientIp' && key !== 'receivedAt' && key !== 'paused') columns.add(key);
    }
  }
}

export function orderCsvColumns(columns: Set<string>): string[] {
  const remaining = Array.from(columns).filter((column) => !PREFERRED_COLUMNS.includes(column)).sort();
  return [...PREFERRED_COLUMNS.filter((column) => columns.has(column)), ...remaining];
}

function sourceName(sourceId: string | undefined, sources: Map<string, string>): string {
  if (!sourceId) return 'Unknown';
  return sources.get(sourceId) ?? `Unknown (${sourceId.substring(0, 8)}...)`;
}

function displayName(column: string): string {
  if (column === 'source') return 'Source';
  if (column === 'created_at') return 'Date';
  return column;
}

function entryValue(entry: CsvDataEntry, column: string): unknown {
  if (column === 'source') return entry.source_id ?? entry.sourceId;
  if (column === 'created_at') return entry.created_at ?? entry.timestamp;
  if (entry.metadata && typeof entry.metadata === 'object') return entry.metadata[column];
  return undefined;
}

function formatValue(column: string, value: unknown, sources: Map<string, string>): string {
  if (value === undefined || value === null) return '';
  if (column === 'source') return sourceName(String(value), sources);
  if (column === 'created_at') {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${mm}/${dd}/${date.getFullYear()}`;
    }
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function serializeCsvHeader(columns: string[]): string {
  return columns.map(displayName).join(',');
}

export function serializeCsvRows(
  entries: CsvDataEntry[],
  columns: string[],
  sources: Map<string, string>,
): string {
  return entries.map((entry) => columns
    .map((column) => escapeCsv(formatValue(column, entryValue(entry, column), sources)))
    .join(','))
    .join('\n');
}

function dropboxPath(folderPath: string, fileName: string): string {
  let cleanFolderPath = folderPath.startsWith('/') ? folderPath : `/${folderPath}`;
  if (cleanFolderPath.endsWith('/')) cleanFolderPath = cleanFolderPath.slice(0, -1);
  return `${cleanFolderPath}/${fileName}`;
}

async function requireOk(response: Response, operation: string): Promise<Response> {
  if (response.ok) return response;
  throw new Error(`${operation} failed (${response.status}): ${await response.text()}`);
}

export class DropboxUploadSession {
  private sessionId: string | null = null;
  private offset = 0;
  private readonly encoder = new TextEncoder();

  constructor(
    private readonly token: string,
    private readonly folderPath: string,
    private readonly fileName: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  get byteCount(): number {
    return this.offset;
  }

  get fullPath(): string {
    return dropboxPath(this.folderPath, this.fileName);
  }

  async start(): Promise<void> {
    const response = await this.request('https://content.dropboxapi.com/2/files/upload_session/start', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({ close: false }),
      },
      body: new Uint8Array(),
    });
    const result = await (await requireOk(response, 'Dropbox upload session start')).json();
    if (!result.session_id) throw new Error('Dropbox upload session did not return a session ID');
    this.sessionId = result.session_id;
  }

  async append(content: string): Promise<void> {
    if (!this.sessionId) throw new Error('Dropbox upload session has not started');
    if (!content) return;
    const bytes = this.encoder.encode(content);
    const response = await this.request('https://content.dropboxapi.com/2/files/upload_session/append_v2', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({ cursor: { session_id: this.sessionId, offset: this.offset }, close: false }),
      },
      body: bytes,
    });
    await requireOk(response, 'Dropbox upload session append');
    this.offset += bytes.byteLength;
  }

  async finish(): Promise<void> {
    if (!this.sessionId) throw new Error('Dropbox upload session has not started');
    const response = await this.request('https://content.dropboxapi.com/2/files/upload_session/finish', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          cursor: { session_id: this.sessionId, offset: this.offset },
          commit: { path: this.fullPath, mode: 'overwrite', autorename: false, mute: false },
        }),
      },
      body: new Uint8Array(),
    });
    await requireOk(response, 'Dropbox upload session finish');
  }
}