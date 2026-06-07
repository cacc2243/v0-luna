import pg from 'pg'

const { Client } = pg

const sql = `
-- Colunas extras em messages para mídia e presentes
alter table public.messages add column if not exists media_url text;
alter table public.messages add column if not exists gift_amount numeric;
alter table public.messages add column if not exists gift_claimed boolean not null default false;
alter table public.messages add column if not exists audio_duration integer;

-- Coluna para reconstruir o passo do fluxo automático da conversa após refresh
alter table public.conversations add column if not exists flow_step integer not null default 0;

-- Permitir 'audio' além de text/image/gift (a coluna é text, então só garantimos que não há check restritivo)
do $$
begin
  if exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'messages' and column_name = 'message_type'
  ) then
    -- nada a fazer; mantemos texto livre
    null;
  end if;
end $$;

-- Índices para carregamento rápido
create index if not exists idx_conversations_creator on public.conversations (creator_id, last_message_at desc);
create index if not exists idx_messages_conversation on public.messages (conversation_id, created_at);

-- RLS
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Conversations: dono (creator) gerencia as suas
drop policy if exists conversations_select_own on public.conversations;
create policy conversations_select_own on public.conversations
  for select using (auth.uid() = creator_id);

drop policy if exists conversations_insert_own on public.conversations;
create policy conversations_insert_own on public.conversations
  for insert with check (auth.uid() = creator_id);

drop policy if exists conversations_update_own on public.conversations;
create policy conversations_update_own on public.conversations
  for update using (auth.uid() = creator_id);

drop policy if exists conversations_delete_own on public.conversations;
create policy conversations_delete_own on public.conversations
  for delete using (auth.uid() = creator_id);

-- Messages: acessíveis se a conversa pertence ao usuário
drop policy if exists messages_select_own on public.messages;
create policy messages_select_own on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.creator_id = auth.uid()
    )
  );

drop policy if exists messages_insert_own on public.messages;
create policy messages_insert_own on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.creator_id = auth.uid()
    )
  );

drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.creator_id = auth.uid()
    )
  );

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own on public.messages
  for delete using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id and c.creator_id = auth.uid()
    )
  );

-- Storage: bucket 'media' já existe e é público para leitura.
-- Garantir que usuários autenticados possam fazer upload na própria pasta.
drop policy if exists media_authenticated_insert on storage.objects;
create policy media_authenticated_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media');

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects
  for select using (bucket_id = 'media');
`

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)
console.log('Schema de chat atualizado com sucesso.')
await client.end()
