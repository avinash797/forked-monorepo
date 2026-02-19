-- Add unique constraint to cities table to support ON CONFLICT (name, state)
ALTER TABLE public.cities
ADD CONSTRAINT cities_name_state_key UNIQUE (name, state);