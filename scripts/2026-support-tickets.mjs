import pg from 'pg'

const { Client } = pg

const sql = `
-- Tickets de suporte abertos pelo usuário
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null,
  status text not null default 'open', -- open | answered | closed
  last_message text,
  last_message_at timestamptz not null default now(),
  unread_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Mensagens de cada ticket
create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  is_from_support boolean not null default false,
  content text not null,
  created_at timestamptz not null default now()
);

-- Índices para carregamento rápido
create index if not exists idx_support_tickets_user on public.support_tickets (user_id, last_message_at desc);
create index if not exists idx_support_messages_ticket on public.support_messages (ticket_id, created_at);

-- RLS
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

-- Tickets: dono gerencia os seus
drop policy if exists support_tickets_select_own on public.support_tickets;
create policy support_tickets_select_own on public.support_tickets
  for select using (auth.uid() = user_id);

drop policy if exists support_tickets_insert_own on public.support_tickets;
create policy support_tickets_insert_own on public.support_tickets
  for insert with check (auth.uid() = user_id);

drop policy if exists support_tickets_update_own on public.support_tickets;
create policy support_tickets_update_own on public.support_tickets
  for update using (auth.uid() = user_id);

drop policy if exists support_tickets_delete_own on public.support_tickets;
create policy support_tickets_delete_own on public.support_tickets
  for delete using (auth.uid() = user_id);

-- Mensagens: acessíveis se o ticket pertence ao usuário
drop policy if exists support_messages_select_own on public.support_messages;
create policy support_messages_select_own on public.support_messages
  for select using (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_messages.ticket_id and t.user_id = auth.uid()
    )
  );

drop policy if exists support_messages_insert_own on public.support_messages;
create policy support_messages_insert_own on public.support_messages
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from public.support_tickets t
      where t.id = support_messages.ticket_id and t.user_id = auth.uid()
    )
  );
`

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)
console.log('Schema de suporte criado com sucesso.')
await client.end()
