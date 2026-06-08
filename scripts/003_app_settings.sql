-- Configuracoes globais do app (chave-valor server-side, fonte unica da verdade)
-- Controla a etapa de verificacao de chave PIX no cadastro e o gateway de cashout ativo.

create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Valores padrao
insert into app_settings (key, value) values
  ('verification_enabled', 'true'::jsonb),         -- liga/desliga a etapa de verificacao no cadastro
  ('active_cashout_gateway', '"pixup"'::jsonb),    -- qual gateway envia o PIX de confirmacao
  ('verification_amount_cents', '90'::jsonb)       -- valor do PIX de confirmacao em centavos (R$ 0,90)
on conflict (key) do nothing;
