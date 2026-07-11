// Cria a tabela user_push_subscriptions: inscricoes Web Push por CRIADORA.
// Cada usuaria (dona de /minha-conta) pode registrar um ou mais dispositivos
// para receber notificacoes das PROPRIAS vendas, mesmo com o app fechado.
//
// Rode com:
//   node --env-file-if-exists=/vercel/share/.env.project scripts/2026-user-push-subscriptions.mjs

import pg from 'pg'

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL

if (!connectionString) {
  console.error('Sem POSTGRES_URL/DATABASE_URL no ambiente.')
  process.exit(1)
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

const SQL = `
create table if not exists public.user_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_push_subscriptions_user_id
  on public.user_push_subscriptions (user_id);

alter table public.user_push_subscriptions enable row level security;

-- A dona da inscricao pode ver/gerenciar apenas as proprias linhas.
-- (O servidor usa a service role e ignora estas policies.)
drop policy if exists "own subscriptions select" on public.user_push_subscriptions;
create policy "own subscriptions select" on public.user_push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "own subscriptions insert" on public.user_push_subscriptions;
create policy "own subscriptions insert" on public.user_push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "own subscriptions delete" on public.user_push_subscriptions;
create policy "own subscriptions delete" on public.user_push_subscriptions
  for delete using (auth.uid() = user_id);
`

try {
  await client.connect()
  await client.query(SQL)
  console.log('OK: tabela user_push_subscriptions criada/atualizada.')
} catch (e) {
  console.error('Falha na migracao:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
