## Goal

1. Add a "Duplicate" action for any source that mints a new API key, prompts for a new name, and copies the schema.
2. Introduce optional parent/child grouping for sources without changing any existing API keys, endpoints, or backup behavior.

## Part 1 — Duplicate source

**UI (`src/components/SourcesManager.tsx`)**
- Add a Copy icon button next to the existing rename/delete controls on each source row.
- Opens a dialog prompting for the new source name (pre-filled as `"<original> (copy)"`).
- On submit:
  1. Generate a new API key via the existing `generate_unique_api_key` RPC.
  2. Insert a new row into `sources` with the new name + new key, `active = true`, same `user_id`.
  3. Read the original's `schema_configs` row (if any) and insert a new `schema_configs` row for the new API key with identical `field_types` and `required_fields`.
  4. Also copy the legacy `sources.schema` JSON for backward compatibility.
  5. Toast success, refresh list.

Nothing else is copied (no scheduled exports, alerts, or data entries).

## Part 2 — Optional parent grouping (non-breaking)

**Schema change (migration)**
- Add nullable `parent_id uuid` to `public.sources`, referencing `public.sources(id) ON DELETE SET NULL`.
- Add index on `parent_id`.
- No changes to `api_key`, RLS, grants, or any existing rows. Every current source stays exactly as it is.

**UI**
- In `SourcesManager.tsx`, add an optional "Parent source" selector in the source edit/rename dialog (dropdown of the user's other sources, plus "None").
- Display grouping in the list: parent sources render normally; sources with a `parent_id` render nested/indented under their parent. Sources without a parent still render as top-level rows exactly like today.

**What is intentionally NOT changed**
- API keys remain 1:1 with sources; every existing key keeps working unchanged.
- `data-receiver` edge function: no change. Each subsource still uses its own API key and writes to its own `source_id`.
- Backups: no change. One file per source (per API key), as today. Parent grouping is UI-only.
- Analytics RPCs, scheduled exports, alerts, schema validation: no change.

## Technical details

**Files touched**
- `supabase/migrations/<new>.sql` — `ALTER TABLE public.sources ADD COLUMN parent_id uuid REFERENCES public.sources(id) ON DELETE SET NULL;` + index.
- `src/components/SourcesManager.tsx` — duplicate button + dialog, parent selector, nested rendering.
- `src/services/SourcesService.ts` — optional helper `duplicateSource(sourceId, newName)`.
- `src/integrations/supabase/types.ts` — regenerated after migration approval.

**Duplicate flow SQL (client-side, via supabase-js)**
```
newKey  = rpc('generate_unique_api_key')
insert into sources (name, api_key, active, user_id, parent_id) values (...)
select field_types, required_fields from schema_configs where api_key = <old>
insert into schema_configs (name, description, api_key, field_types, required_fields, user_id)
```

**Nesting rendering**
- Group in-memory: `parents = sources.filter(s => !s.parent_id)`, `childrenByParent = groupBy(sources.filter(s => s.parent_id), 'parent_id')`.
- Render children indented under their parent; orphaned children (parent deleted) fall back to top-level.
