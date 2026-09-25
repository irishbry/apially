# Make backup warnings reflect real failures

## What the records show
- The red notice treats every active source with any historical records as if it must produce a file every day. It does not check whether that source received eligible data on that particular date.
- For September 18–24, the seven dates shown account for 45 missing source-days. A check of the actual records found **44 with no eligible data** and **one with eligible data but no completed file**: Benefinds on September 24. That run still has a stale “Waiting for this source to begin” record. The other missing rows have “No eligible data was received” messages; those are not upload failures.
- The heading counts up to 14 days, while the notice only displays the first seven. The log loader also requests records without paging, so older days may be assessed with incomplete logs. These are separate presentation/data-loading issues to verify before trusting older warnings.

## Plan
1. Separate **no data for this date** from **backup failed or stuck**. Determine daily eligibility using the same Los Angeles day boundary and paused-record rule as backup generation; use a bounded server-side check so the page does not scan large datasets. Do not delete historical logs or invent empty backup files.
2. Show a red missing-file notice and Retry action only when eligible records exist but no completed file exists. Keep no-data days visible as neutral information in Reporting, rather than treating them as errors or retrying them pointlessly.
3. Make Reporting's latest run and historical status use the same distinction, including stale processing rows. Update the alert check to ignore confirmed no-data cases while retaining genuine failure/stuck alerts.
4. Fix historical log loading to cover the whole displayed period, and make the notice's day count match the visible rows. Preserve working file downloads and source filtering.
5. Recheck September 18–24 against the actual data, then verify the Backups and Reporting screens: the false positives disappear and Benefinds September 24 remains actionable. Leave that genuine missing backup untouched until a deliberate retry succeeds.

## Technical details
- Add a server-side, authenticated, per-source/per-day eligibility summary over `data_entries`, restricted to the signed-in user's sources and the recent 14-day window; test with date boundaries and paused entries. Use it in the missing-day and Reporting calculations.
- Keep source IDs as the comparison key where available instead of source names. Page `backup_logs` in 1,000-row batches or use a bounded query that covers the reporting window; avoid interpreting a missing fetched row as a failed backup.
- Keep existing backup records for audit history; change their interpretation and the alerts rather than rewriting history.
