import pg from 'pg'

const { Client } = pg

const sql = `
-- Controle do e-mail de REFORCO de acesso (lembrete de login).
-- Enviado ~1h apos o pagamento do convite quando a usuaria ainda nao logou.
-- Flag para claim atomico e evitar reenvio (mesmo padrao de invite_paid_email_sent).
alter table public.invites
  add column if not exists invite_access_reminder_sent boolean not null default false;

-- Marca o horario em que o reforco foi enviado (observabilidade).
alter table public.invites
  add column if not exists invite_access_reminder_at timestamptz;
`

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)
console.log('Colunas invite_access_reminder_sent / invite_access_reminder_at criadas com sucesso.')
await client.end()
