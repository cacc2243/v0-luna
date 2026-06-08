-- Registra qual gateway de cash-in gerou cada cobranca PIX.
-- Permite o resumo do painel detalhar transacoes geradas/pagas por gateway.
alter table invites add column if not exists gateway text;
create index if not exists invites_gateway_idx on invites (gateway);
