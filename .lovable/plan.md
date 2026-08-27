# Why those sources show 0 records

They are not really empty. Two separate things are happening.

## 1. Retry backs up the wrong day

The scheduled run at 3 AM PST backs up **yesterday**. The 10:00 UTC run today did exactly that and produced real files (Popular - FRW 10,470 records for 2026-08-26, PL - Competitive 266, etc.).

The **Retry** button instead asks for the date the log row was created — today, 2026-08-27 — and today is only a few hours old, so almost no data exists yet. That is why the retried rows say "No eligible data was received for 2026-08-27" and 0 records, even though the same source had thousands of rows on 8/26 (BSD - FSP 2,341, Popular - FSP 1,677, Wisdom 5,463).

So: the data is fine, the retry is targeting the wrong day.

## 2. Three sources genuinely have no data

PMG Bath, PMG Home Seller and PMG Solar have never received a single record. Their failures are correct, just badly worded.

## Proposed fixes

1. **Store the backup's target date** on each backup log row so retry can reuse it instead of guessing from the created timestamp.
2. **Retry the correct day**: Retry (in Latest backup run and the run dashboard) sends the stored target date; when a log predates the new column, fall back to the previous PST day of the run instead of the run date itself.
3. **Distinguish "no data" from "failed"**: sources with zero eligible rows for the day get a neutral "No data" state (grey, no alarming red, no Retry) rather than a red Failed badge. Genuine errors (like the PMG Roofing Dropbox 429) stay red with Retry.
4. Re-run the affected sources for 2026-08-26 once the retry date is correct, so the missing 8/26 files exist.

## Technical notes

- Migration: add `backup_date date` to `public.backup_logs`; `dropbox-backup` writes `dateString` into it on every per-source log (scheduled, manual, and recreate paths).
- `BackupRunProgress.tsx` and `BackupRunDashboard.tsx`: replace `pstDate: getLosAngelesDate(log.created_at)` with `log.backup_date ?? previousLosAngelesDay(log.created_at)`.
- Status derivation: treat `error_message` starting with "No eligible data was received" (and the paused-source message) as a `no_data` state in `deriveStatus`/badge rendering; exclude these from the "Some sources never finished" warning count.
- No change to ingestion, schema of `data_entries`, or the streaming CSV engine.
