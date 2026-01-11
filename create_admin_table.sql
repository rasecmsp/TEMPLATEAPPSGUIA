-- Create admin_users table
create table public.admin_users (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint admin_users_pkey primary key (id),
  constraint admin_users_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS
alter table public.admin_users enable row level security;

-- Create policy to allow public read (or restrict as needed)
create policy "Allow read access to all users"
on public.admin_users
for select
to public
using (true);

-- Insert the user from the error log as the first admin
insert into public.admin_users (user_id)
values ('37580de0-99b6-48a9-a02a-47d383243379');
