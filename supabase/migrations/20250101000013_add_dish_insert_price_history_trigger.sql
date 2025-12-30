-- Trigger to automatically create price_history entry when a new dish is added with a price
-- This ensures all dish prices are tracked from creation, maintaining complete price history

-- Function to create initial price_history entry when dish is created
create or replace function public.create_initial_price_history()
returns trigger as $$
begin
  -- Only create price history entry if the dish has a price
  if new.current_price is not null then
    insert into public.price_history (
      dish_id,
      price,
      currency,
      source,
      reported_by_user_id,
      is_verified,
      notes,
      recorded_at
    ) values (
      new.id,
      new.current_price,
      new.currency,
      -- Use 'restaurant-updated' as default source for initial prices
      'restaurant-updated',
      new.added_by_user_id,
      -- Mark as unverified by default (can be verified later)
      false,
      'Initial price at dish creation',
      new.date_added
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to create price history on dish insert
create trigger on_dish_insert_create_price_history
  after insert on public.dishes
  for each row
  when (new.current_price is not null)
  execute procedure public.create_initial_price_history();

-- Add comment for documentation
comment on function public.create_initial_price_history() is 'Automatically creates price_history entry when a dish is inserted with a price';
