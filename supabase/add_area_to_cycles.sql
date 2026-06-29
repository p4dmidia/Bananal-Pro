-- Alter table production_cycles to link to producer_areas
ALTER TABLE public.production_cycles 
ADD COLUMN IF NOT EXISTS area_id BIGINT REFERENCES public.producer_areas(id) ON DELETE SET NULL;

-- Notify postgrest to reload the schema
NOTIFY pgrst, 'reload schema';
