-- Facebook Pixels: armazena multiplos pixels com Conversions API.
create table if not exists fb_pixels (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  pixel_id text not null,
  access_token text not null,
  test_event_code text,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Sinais de atribuicao do Facebook persistidos por transacao (invite),
-- usados para enviar o evento Purchase via Conversions API server-side.
alter table invites add column if not exists fbp text;
alter table invites add column if not exists fbc text;
alter table invites add column if not exists client_ip text;
alter table invites add column if not exists client_ua text;
alter table invites add column if not exists event_source_url text;
alter table invites add column if not exists fb_event_id text;
-- Idempotencia do Purchase: garante envio unico mesmo com webhook + polling.
alter table invites add column if not exists fb_purchase_sent boolean not null default false;
