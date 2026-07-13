ALTER TABLE public.sources ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.sources(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sources_parent_id ON public.sources(parent_id);