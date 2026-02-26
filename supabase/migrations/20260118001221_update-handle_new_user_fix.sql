-- Function to automatically create profile on signup
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.profiles (id, display_name)
values (
        new.id,
        new.raw_user_meta_data->>'display_name'
    );
return new;
end;
$$ language plpgsql security definer;
