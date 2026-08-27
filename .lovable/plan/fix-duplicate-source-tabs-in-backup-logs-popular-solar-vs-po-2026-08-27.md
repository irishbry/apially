# Fix duplicate source tabs in Backup Logs ("Popular Solar" vs "Popular - Solar")

## What's happening

There is only one source in the database: **Popular - Solar**. No second source was created.

The duplicate tab comes from how tab names are built:

- Backup logs created **before 8/25** have no source link stored on them. Their tab name is parsed out of the file name (`backup_2026-08-24_Popular___Solar.csv`), and the underscores become spaces, so the tab reads "Popular Solar".
- Backup logs created **from 8/25 onward** do carry the source link, so they use the real source name, "Popular - Solar".

Two naming paths for the same source produce two tabs. The same thing happens for every source whose name contains punctuation (BLX - Source 2, BSD - FSP, PL - Competitive, Popular - Bathroom, etc.), which is why the tab bar shows those pairs too.

## The fix

1. **Backfill the source link on old backup logs.** For each historical log with no source link, match its file name to the correct source by comparing the punctuation-stripped name, and store the source id. This permanently collapses the pairs and also makes old logs benefit from renames.
2. **Make the UI resilient.** When a log still has no source link, match the parsed file-name text against known source names using a normalized comparison (lowercase, punctuation and repeated spaces removed) before falling back to the raw parsed text. This prevents duplicates reappearing for any log the backfill can't match.

Result: one tab per source, using the current source name, with all history under it.

## Technical notes

- Migration: `UPDATE public.backup_logs SET source_id = ...` joining on normalized name derived from `file_name` where `source_id IS NULL`. Read-only verification query first to confirm every duplicate pair maps to exactly one source before applying.
- `src/components/BackupLogs.tsx`: add a `resolveSourceName(log)` helper used by `sourceNames` and `filteredLogs` (and passed down to `BackupRunProgress` / `BackupRunDashboard`) that does source-id lookup, then normalized name lookup, then raw parsed name.
- No change to backup generation, file naming, or Dropbox paths.
