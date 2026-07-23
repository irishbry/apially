## Goal
Search inside record fields (email, phone, name, any metadata value) across every source and every date since inception — without timeouts, even against millions of rows.

## Approach
Postgres can search JSONB fast if we give it the right index. We'll add a GIN trigram index over the flattened text of each `data_entries.metadata` row, expose a paginated search RPC, and add a search UI to the Data tab.

## Steps

### 1. Database (migration)
- Enable `pg_trgm` extension.
- Add generated column `metadata_text text` on `data_entries` = lowercased concatenation of all metadata values (via an immutable helper function).
- Create GIN trigram index on `metadata_text`.
- Create RPC `search_data_entries(p_user_id, p_query, p_source_id, p_from, p_to, p_limit, p_offset)`:
  - Filters by `user_id` (auth-scoped), optional `source_id`, optional date range on `created_at`.
  - Matches `metadata_text ILIKE '%query%'` (uses trigram index).
  - Returns rows ordered by `created_at desc`, plus a companion count RPC.
- Grant execute to `authenticated`.

Backfilling the generated column on a large table takes time but runs once; the migration will handle it.

### 2. Service layer
- Add `DataService.searchData({ query, sourceId, from, to, limit, offset })` calling the new RPC.
- Add `DataService.searchDataCount(...)` for pagination totals.

### 3. UI — Data tab (`EnhancedDataTable`)
- Add a search bar with:
  - Text input (debounced 400ms)
  - Source dropdown (all active + inactive)
  - Date range (from / to), defaulting to empty = all time
  - Clear button
- When query is empty → current "latest 100 active" behavior stays.
- When query is present → switch to search RPC results with server-side pagination (Prev/Next, 100/page).
- Show result count and matched field highlights inline.

## Technical notes
- Trigram GIN handles `ILIKE '%x%'` efficiently, unlike btree — this is what makes "search anything, anywhere" fast on multi-million-row tables.
- All filtering is server-side; the browser only ever holds one page.
- Search is scoped to `auth.uid()` inside the RPC (SECURITY DEFINER), so RLS-equivalent isolation is preserved.
- Existing Data tab default view (latest active) is unchanged when no query is entered — no regression risk.

## Out of scope
- Aggregations / drill-down dashboards
- Cross-field structured queries (e.g. `email=x AND state=y`) — can be added later on top of the same index
