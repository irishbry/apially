import {
  addCsvColumns,
  DropboxUploadSession,
  orderCsvColumns,
  serializeCsvHeader,
  serializeCsvRows,
} from './csv-stream.ts';

Deno.test('CSV pages keep a stable ordered schema and escaping', () => {
  const columns = new Set<string>();
  addCsvColumns(columns, [{ id: '1', metadata: { email: 'a@example.com', note: 'hello, "world"', clientIp: 'hidden' } }]);
  addCsvColumns(columns, [{ id: '2', metadata: { fname: 'Ada', custom: 'yes' } }]);
  const ordered = orderCsvColumns(columns);

  if (serializeCsvHeader(ordered) !== 'Source,Date,fname,email,custom,note') throw new Error('Unexpected CSV header');
  const rows = serializeCsvRows([{
    id: '1', source_id: 'source-1', created_at: '2026-08-24T12:00:00Z',
    metadata: { email: 'a@example.com', note: 'hello, "world"' },
  }], ordered, new Map([['source-1', 'Evergreen']]));
  if (!rows.includes('Evergreen,08/24/2026')) throw new Error('Source or date formatting changed');
  if (!rows.includes('"hello, ""world"""')) throw new Error('CSV escaping changed');
});

Deno.test('declared mixed-case fields resolve to lowercase values across pages', () => {
  const columns = new Set(['Fname', 'Phone', 'Address', 'Email', 'created']);
  addCsvColumns(columns, [{ id: '1', metadata: { created: '2026-08-25' } }]);
  addCsvColumns(columns, [{ id: '2', metadata: { fname: 'Ada', phone: '123', address: 'Main', email: 'a@example.com' } }]);
  const ordered = orderCsvColumns(columns);
  if (ordered.some(key => ['Fname', 'Phone', 'Address', 'Email'].includes(key))) throw new Error('Stale schema casing remained');
  const row = serializeCsvRows([{ id: '2', source_id: 'one', metadata: { fname: 'Ada', phone: '123', address: 'Main', email: 'a@example.com' } }], ordered, new Map([['one', 'Source']]));
  for (const value of ['Ada', '123', 'Main', 'a@example.com']) {
    if (!row.includes(value)) throw new Error(`Missing received value for ${value}`);
  }
  const hsColumns = new Set(['fname', 'phone']);
  addCsvColumns(hsColumns, [{ id: '3', metadata: { fname: 'Sam', phone: '456' } }]);
  if (hsColumns.has('Fname') || !hsColumns.has('fname')) throw new Error('Lowercase schema changed');
});

Deno.test('Dropbox upload session advances byte offsets', async () => {
  const requests: Array<{ url: string; arg: Record<string, unknown> }> = [];
  const request = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    const arg = JSON.parse(String(new Headers(init?.headers).get('Dropbox-API-Arg')));
    requests.push({ url, arg });
    if (url.endsWith('/start')) return Response.json({ session_id: 'session-1' });
    return new Response('{}', { status: 200 });
  };

  const session = new DropboxUploadSession('token', '/Backups', 'file.csv', request as typeof fetch);
  await session.start();
  await session.append('é');
  await session.append('\nrow');
  await session.finish();

  if (session.byteCount !== 6) throw new Error(`Expected 6 bytes, got ${session.byteCount}`);
  const secondAppendCursor = requests[2].arg.cursor as { offset: number };
  if (secondAppendCursor.offset !== 2) throw new Error('Append cursor did not use UTF-8 byte length');
  const finishCommit = requests[3].arg.commit as { path: string };
  if (finishCommit.path !== '/Backups/file.csv') throw new Error('Finish path changed');
});