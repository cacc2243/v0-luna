-- Marca quando o cliente realmente copiou o código PIX do convite.
-- Antes, o resumo contava como "copiou" todo convite que apenas teve o código gerado.
-- Esta coluna registra o instante real da cópia (toque no botão "Copiar código PIX").
alter table invites add column if not exists pix_copied_at timestamptz;

-- Índice para acelerar a contagem de quem copiou no painel.
create index if not exists invites_pix_copied_at_idx on invites (pix_copied_at);
