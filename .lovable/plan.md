

## Add Time Range Toggle to API Request Distribution Chart

### What Changes

The "API Request Distribution" bar chart currently shows all-time source data with no time filtering. We will add a toggle (Today / Yesterday / 7 Days / 30 Days) above the chart so users can filter the distribution by timeframe.

### Technical Approach

1. **Add a new RPC or query method** in `SourcesService` — `getApiUsageBySourceForPeriod(days: number)` — that filters `data_entries` by `created_at` within the specified period before grouping by source. This mirrors how `get_source_entry_counts` works but with a date filter. We will query `data_entries` directly joined with `sources` since the existing RPC likely does not accept a date parameter.

2. **Add state to `ApiAnalytics`** — a new `distributionRange` state (`'today' | 'yesterday' | '7d' | '30d'`) defaulting to `'30d'`, plus a `filteredUsageBySource` state to hold the filtered results.

3. **Render a ToggleGroup** above the "API Request Distribution" card content with four options: Today, Yesterday, 7 Days, 30 Days. When the user picks one, fetch the filtered source distribution data.

4. **Update the bar chart** to use the filtered data instead of the all-time `usageBySource`.

### Files to Modify

- **`src/services/SourcesService.ts`** — Add `getApiUsageBySourceForPeriod(days: number, offset?: number)` that queries `data_entries` with a date range filter, groups by source, and returns `ApiUsageBySource[]`.

- **`src/components/ApiAnalytics.tsx`** — Add `distributionRange` state, a `ToggleGroup` UI in the "API Request Distribution" card header, fetch logic that calls the new service method on range change, and wire the filtered data to the bar chart.

