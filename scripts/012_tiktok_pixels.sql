-- TikTok Pixels: armazena multiplos pixels com Events API 2.0 (server-side).
-- O access_token e opcional: sem ele, o pixel funciona apenas no navegador
-- (snippet ttq) e o Purchase server-side nao e enviado para aquele pixel.
create table if not exists tiktok_pixels (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  pixel_id text not null,
  access_token text,
  test_event_code text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Todo acesso a esta tabela acontece pelo service role (rotas /api/admin e os
-- helpers server-side), que ignora RLS. Habilitar RLS sem nenhuma policy faz
-- com que a chave anon do navegador nao consiga ler o access_token.
alter table tiktok_pixels enable row level security;

-- Sinais de atribuicao do TikTok persistidos por transacao (invite), usados
-- para enviar o evento CompletePayment via Events API server-side.
--   ttclid -> click id que o TikTok injeta na URL do anuncio
--   ttp    -> valor do cookie first-party _ttp criado pelo pixel no navegador
alter table invites add column if not exists ttclid text;
alter table invites add column if not exists ttp text;
-- event_id compartilhado entre navegador e Events API (deduplicacao no TikTok).
alter table invites add column if not exists tt_event_id text;
-- Idempotencia do CompletePayment: garante envio unico com webhook + polling.
alter table invites add column if not exists tt_purchase_sent boolean not null default false;

-- Snapshot de atribuicao do TikTok no perfil, para recuperar o ttclid quando
-- o checkout acontece em outra sessao/aba (mesmo padrao usado no Facebook).
alter table profiles add column if not exists ttclid text;
alter table profiles add column if not exists ttp text;
