import pg from 'pg'

const { Client } = pg

const sql = `
-- Inscricoes Web Push dos dispositivos do admin (PWA instalado).
create table if not exists public.admin_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_success_at timestamptz
);

create index if not exists idx_admin_push_endpoint
  on public.admin_push_subscriptions (endpoint);

-- Flag para evitar notificacao duplicada (webhook + polling) por venda.
alter table public.invites
  add column if not exists admin_push_sent boolean not null default false;
`

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)
console.log('Schema de push do admin criado com sucesso.')
await client.end()
