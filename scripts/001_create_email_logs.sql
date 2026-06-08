-- Tabela de log de e-mails enviados pelo Luna Privé.
-- Registra cada tentativa de envio (sent / skipped / error) para auditoria no painel.

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  template_id text not null,
  recipient text not null,
  subject text not null,
  status text not null default 'sent', -- sent | skipped | error
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists email_logs_created_at_idx on public.email_logs (created_at desc);
create index if not exists email_logs_template_idx on public.email_logs (template_id);
create index if not exists email_logs_status_idx on public.email_logs (status);

-- RLS: somente o service role (admin) acessa. Nenhuma policy publica.
alter table public.email_logs enable row level security;
