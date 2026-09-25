# Restore personal details in GlobUSA backups

## What happened
The received records still contain personal details. I checked stored records for the five named sources, and recent records have populated lowercase fields such as `fname`, `phone`, and `address`. The August 24 files used those lowercase columns and contained values. Starting August 25, the affected files instead used capitalized columns such as `Fname`, `Phone`, and `Address`, with blank cells. The backup writer takes column names from each source's declared schema when one exists; four affected sources declare capitalized names, while the actual received fields are lowercase. QualifiedSolarSurvey has the same mismatch. HS declares lowercase names and its August 25 file contains populated details, so it should be inspected separately rather than treated as broken.

## Fix
1. Change CSV backup generation to retain schema columns but also discover actual field names from the records being exported, across every page. Keep the existing metadata values intact and avoid duplicate case-only columns where possible. Add regression tests covering lowercase received fields against capitalized schema fields, multiple pages, and existing HS behavior.
2. Compare representative regenerated output against stored records for all five named sources, checking filled-field counts without displaying personal data. Confirm that the download has the expected columns and nonblank personal details.
3. Repair affected historical daily backups from August 25 onward **where the underlying records still exist**, processing them in manageable date/source batches and verifying downloads afterward. Keep existing files and links until each replacement passes validation; avoid duplicate visible backup rows. Report any dates that cannot be reconstructed because the source records have expired.

## Technical notes
- The source records are in `data_entries.metadata`; the current streaming CSV writer chooses only `sources.schema.fieldTypes` for schema-defined sources, even when actual JSON keys have different capitalization.
- Backup generation uses paginated reads and uploads to Dropbox and the public `backup-files` storage bucket. The repair must preserve those download paths and the current retention/scheduling behavior.
- No database schema change or intake change is needed for the observed mismatch.
