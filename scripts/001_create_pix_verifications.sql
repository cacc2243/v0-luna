-- ============================================================================
-- Tabela de controle de verificacoes de chave PIX (cashout de R$ 0,01)
-- ----------------------------------------------------------------------------
-- Objetivo de seguranca:
--   * Garantir, no nivel do banco, que NUNCA seja enviado mais de 1 cashout
--     bem-sucedido / em andamento para a mesma chave PIX.
--   * Registrar auditoria completa: chave, tipo, valor, status, numero de
--     tentativas, id da transacao na Bynet, erros e timestamps.
--   * Vincular cada verificacao a conta criada (user_id / email).
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.pix_verifications (
  id uuid primary key default gen_random_uuid(),

  -- Vinculo com a conta criada
  user_id uuid references auth.users (id) on delete set null,
  email text,

  -- Dados da chave (pix_key_normalized e a chave de unicidade)
  pix_key text not null,
  pix_key_normalized text not null,
  pix_type text not null,

  -- Valor SEMPRE fixo em 1 centavo (R$ 0,01). Imutavel pelo cliente.
  amount_cents integer not null default 1,

  -- Estado do cashout:
  --   processing -> chamada a Bynet em andamento
  --   pending    -> Bynet aceitou (transferencia criada)
  --   completed  -> postback confirmou liquidacao
  --   failed     -> falhou de verdade (permite retry)
  status text not null default 'processing'
    check (status in ('processing', 'pending', 'completed', 'failed')),

  -- Auditoria de tentativas
  attempts integer not null default 1,
  transaction_id text,
  last_error text,

  -- Metadados de requisicao para rastreio
  request_ip text,
  user_agent text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- UNICIDADE NO BANCO: impede 2o envio para a mesma chave normalizada,
-- exceto quando a ultima tentativa falhou (status = 'failed').
-- Isso barra ataques de corrida (duas requisicoes simultaneas) porque o
-- indice unico e avaliado de forma atomica pelo Postgres.
-- ----------------------------------------------------------------------------
create unique index if not exists pix_verifications_active_key_uidx
  on public.pix_verifications (pix_key_normalized)
  where status in ('processing', 'pending', 'completed');

-- Indices auxiliares para o painel
create index if not exists pix_verifications_user_idx on public.pix_verifications (user_id);
create index if not exists pix_verifications_status_idx on public.pix_verifications (status);
create index if not exists pix_verifications_created_idx on public.pix_verifications (created_at desc);

-- ----------------------------------------------------------------------------
-- Trigger para manter updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_pix_verifications_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_pix_verifications_updated_at on public.pix_verifications;
create trigger trg_pix_verifications_updated_at
  before update on public.pix_verifications
  for each row execute function public.set_pix_verifications_updated_at();

-- ----------------------------------------------------------------------------
-- RLS: a tabela so e acessada pelo backend (service role). Nenhum acesso
-- direto do cliente. Habilitamos RLS sem policies publicas para bloquear
-- qualquer leitura/escrita anonima ou autenticada via client.
-- ----------------------------------------------------------------------------
alter table public.pix_verifications enable row level security;

-- (Sem policies = somente service_role bypassa RLS. Cliente nao acessa.)
