# Organize Backup Logs by source folders

## Goal
Replace the wide source-tab strip with a folder browser like the reference: **All Sources** and top-level sources on the left, subsources for the selected source on the right, and matching backup files below. Keep the existing Backup Logs look and all current file actions.

## What will change
1. Use the same parent/subsource relationships shown in the Sources tab to build the backup browser. A top-level source opens its own backups plus its subsources; choosing a subsource narrows the file list to that subsource. Standalone sources show their files directly. All Sources shows everything.
2. Show the selected location clearly above the file list. Keep the existing file rows, dates, status, download links, delete action, link repair, and the missing-backup notice and retry buttons. On smaller screens, make the folder list and subsource choices usable without hiding the files or actions.
3. Keep the current option to show all sources; otherwise follow the current visibility rules for sources with data or backups. Include historical file-only sources in an accessible fallback location instead of making their backups disappear.
4. Check navigation and filtering against parent folders, individual subsources, standalone sources, renamed sources, and historical logs. Verify that typing in any added search field retains focus, and that downloads and warnings still apply to the correct files.

## Concerns and safeguards
- **Historical files:** Some older backup logs have no source link and are identified from filenames. Match these carefully against known source names; ambiguous or unmatched files remain visible under All Sources and a clearly labeled unmatched group rather than being assigned to the wrong folder.
- **No file migration:** This changes only how files are *shown*. It will not move or rename Dropbox or stored files, change backup schedules, change source relationships, or change the Reporting panels.
- **Verification limit:** The local preview currently opens at sign-in, and this project uses external sign-in, so the signed-in folder/file flow cannot be fully verified here without an available authenticated preview session. Static checks and any publicly reachable UI checks will still be completed; authenticated behavior must be checked in the user's preview if access remains unavailable.

## Technical approach
Extend the backup-source query/model to include `parent_id`, then derive folder contents from stable source IDs and a conservative filename fallback. Replace only the selector/presentation and its filtering in the Backup Logs component; reuse the existing log fetching, warning eligibility, repair, download, and deletion logic. No database migration or backend change is planned.
