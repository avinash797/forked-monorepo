-- Function to automatically create profile on signup
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.profiles (id, email, display_name, email_verified)
values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'display_name',
        new.email_confirmed_at is not null
    );
return new;
end;
$$ language plpgsql security definer;
