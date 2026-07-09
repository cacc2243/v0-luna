import pg from 'pg'

const { Client } = pg

const sql = `
-- Flag para evitar e-mail "Bem-vinda ao Luna" (invite_paid) duplicado.
-- O webhook e o polling de /api/pix/status (alem de retries do gateway) podem
-- confirmar o pagamento quase ao mesmo tempo. Sem um claim atomico, ambos
-- passam pela verificacao e enviam o e-mail duas vezes. Esta coluna permite
-- reservar o envio de forma atomica (update ... where flag = false).
alter table public.invites
  add column if not exists invite_paid_email_sent boolean not null default false;
`

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
await client.query(sql)
console.log('Coluna invite_paid_email_sent criada com sucesso.')
await client.end()
