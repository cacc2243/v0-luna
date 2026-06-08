-- ============================================================================
-- Migracao: troca de gateway de cashout (Bynet -> PixUp) e valor R$ 0,90
-- ----------------------------------------------------------------------------
-- Adiciona colunas necessarias para a PixUp:
--   * external_id    -> idempotencia no lado da PixUp (UNIQUE)
--   * provider       -> qual gateway processou (default 'pixup')
--   * end_to_end_id  -> e2e_id (hash PIX) retornado no webhook cashout.confirmed
--
-- Observacao sobre valor: o nome da coluna amount_cents e mantido por
-- compatibilidade, mas passa a guardar o valor em CENTAVOS de R$ 0,90 (= 90).
-- A PixUp usa reais decimais (0.90); a conversao e feita no backend.
-- ============================================================================

alter table public.pix_verifications
  add column if not exists external_id text;

alter table public.pix_verifications
  add column if not exists provider text not null default 'pixup';

alter table public.pix_verifications
  add column if not exists end_to_end_id text;

-- Idempotencia: cada external_id e unico (quando preenchido).
create unique index if not exists pix_verifications_external_id_uidx
  on public.pix_verifications (external_id)
  where external_id is not null;
