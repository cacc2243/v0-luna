-- Histórico de mensagens enviadas pelo WhatsApp (Z-API)
create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  message text not null,
  status text not null default 'sent', -- sent | failed
  zaap_id text,
  message_id text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_created_at_idx
  on public.whatsapp_messages (created_at desc);

-- A tabela é acessada exclusivamente pelo backend admin (service role).
alter table public.whatsapp_messages enable row level security;
