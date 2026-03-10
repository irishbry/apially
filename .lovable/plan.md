

## Root Cause

The `dropbox-backup` edge function fetches all entries for the previous day with a single query (line 480-486 of `index.ts`):

```typescript
const { data: userData } = await supabase
  .from('data_entries')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', startOfDayUTC.toISOString())
  .lte('created_at', endOfDayUTC.toISOString())
  .order('created_at', { ascending: false });
```

**Two problems:**
1. **Supabase default 1000-row limit** -- With 25,000+ entries per day, only 1,000 rows are returned. Some sources get completely excluded.
2. **Statement timeout** -- The query can time out before returning results, causing the entire backup run to fail (today's backup has 4 "attempting" entries but zero completions).

This affects ALL sources, not just the 4 new ones. The 4 new sources (LD America, Home Quotes, Elite Mortgage, SunHarvest) were never included because they produce many rows that get cut off by the 1000-row limit.

## Missing Backup Data

- **Mar 9 (PST)**: LD America (3,759), Home Quotes (3,751), Elite Mortgage (9,298), SunHarvest (3,751) -- none backed up
- The other sources (DigiPeak, LBH, Avenuelink, WCMG) also likely have incomplete backups from recent days due to the row limit

## Plan

### 1. Fix the edge function to paginate data fetches

Instead of one big query, fetch data **per-source** with pagination:

- First query the list of distinct `source_id` values for the user+date range (small query)
- Then for each source, fetch entries in paginated batches of 1000 using `.range(offset, offset+999)` until all rows are retrieved
- Process and upload each source's backup independently (already done in current code)

This avoids both the 1000-row limit and timeout issues since each individual query is small.

### 2. Generate missing backups

After deploying the fixed edge function, invoke it to generate the missing Mar 9 backups. The function will be called with the user's existing Dropbox config and will process all sources correctly with the pagination fix.

### Technical Changes

**File: `supabase/functions/dropbox-backup/index.ts`**

Replace the single bulk query (lines ~456-527) with:

```typescript
// 1. Get distinct source_ids for this user + date range
const { data: sourceIds } = await supabase
  .from('data_entries')
  .select('source_id')
  .eq('user_id', userId)
  .gte('created_at', startOfDayUTC.toISOString())
  .lte('created_at', endOfDayUTC.toISOString())
  .not('source_id', 'is', null);

const uniqueSourceIds = [...new Set(sourceIds?.map(r => r.source_id))];

// 2. For each source, fetch ALL entries with pagination
for (const sourceId of uniqueSourceIds) {
  let allEntries = [];
  let offset = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data: page } = await supabase
      .from('data_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('source_id', sourceId)
      .gte('created_at', startOfDayUTC.toISOString())
      .lte('created_at', endOfDayUTC.toISOString())
      .range(offset, offset + PAGE_SIZE - 1);
    
    if (!page || page.length === 0) break;
    allEntries.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  // Process this source's backup...
}
```

This restructures the loop so data is fetched per-source with pagination, then each source is backed up individually (reusing the existing per-source upload logic).

After deploying, I will invoke the edge function to generate the missing backups for Mar 9 data.

