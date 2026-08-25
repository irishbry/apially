# Stream Dropbox backup generation

## Goal
Generate each source's daily CSV in bounded pages and append those pages directly to Dropbox, avoiding a full-source or full-user in-memory dataset while preserving existing schedules, filenames, source filtering, logs, and record marking.

## Changes
- Refactor scheduled/manual CSV backups to process one source at a time and fetch at most 1,000 rows per page.
- Determine the source CSV column set with a lightweight metadata-key pass, then write the header once and serialize each subsequent page with the same column order and formatting currently used.
- Use Dropbox upload sessions (`start`, repeated `append_v2`, then `finish`) so CSV bytes are sent incrementally and the final file still overwrites the existing path.
- Keep only the current page's entry IDs long enough to mark successfully uploaded records, rather than retaining all records for all sources.
- Maintain per-source `backup_logs` status, record count, byte size, storage path/Dropbox URL behavior, and finalize the overall `backup_attempts` row even when an individual source fails.
- Preserve the current JSON path as a bounded, non-streaming fallback; streaming applies to the scheduled CSV path requested here.

## Supabase Storage compatibility
Supabase Storage does not expose an append API. After Dropbox upload finishes, copy the completed Dropbox file into `backup-files` using a temporary download URL, keeping the existing public Storage download behavior without assembling the CSV in function memory.

## Validation
- Add focused tests for CSV header/row generation and upload-session chunk sequencing.
- Run the edge-function tests and inspect the deployed function logs after an invocation.
