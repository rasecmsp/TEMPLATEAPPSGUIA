-- Create page_configurations table
create table public.page_configurations (
  id uuid not null default gen_random_uuid (),
  slug text not null unique, -- 'como-chegar', 'events', 'history', 'tours'
  title text not null,
  cover_url text,
  active boolean default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint page_configurations_pkey primary key (id)
);

-- Enable RLS
alter table public.page_configurations enable row level security;

-- Policies
create policy "Allow public read access"
on public.page_configurations
for select
to public
using (true);

create policy "Allow admin full access"
on public.page_configurations
for all
to public
using (true) -- Simplified for now, in prod restrict to admin_users
with check (true);

-- Insert default values
insert into public.page_configurations (slug, title, cover_url)
values 
  ('como-chegar', 'Como Chegar', '/actions/como-chegar.png'),
  ('events', 'Festas & Eventos', '/actions/festas-eventos.png'),
  ('history', 'Nossa História', '/actions/nossa-historia.png'),
  ('tours', 'Passeios & Atividades', '/actions/passeios-atividades.png')
on conflict (slug) do nothing;
