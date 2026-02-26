-- Trigger function to call Edge Function when a new city is inserted
-- Uses pg_net for async HTTP POST after transaction commit
CREATE OR REPLACE FUNCTION public.trigger_enrich_city_dish_types() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN -- Use net.http_post from pg_net extension
    PERFORM net.http_post(
        url := 'https://bqxhinoabxmpsvzntrlq.supabase.co/functions/v1/enrich-city-dish-types',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
            'city_id',
            NEW.id::text,
            'city_name',
            NEW.name,
            'state',
            NEW.state,
            'country',
            COALESCE(NEW.country, 'USA')
        )
    );
RETURN NEW;
EXCEPTION
WHEN OTHERS THEN RAISE WARNING 'Failed to trigger enrich for city %: %',
NEW.name,
SQLERRM;
RETURN NEW;
END;
$$;
-- Create trigger on cities table
CREATE TRIGGER on_city_created_enrich_dish_types
AFTER
INSERT ON public.cities FOR EACH ROW EXECUTE FUNCTION public.trigger_enrich_city_dish_types();
COMMENT ON FUNCTION public.trigger_enrich_city_dish_types() IS 'Calls Edge Function to enrich city with signature dish types via Gemini using pg_net';
