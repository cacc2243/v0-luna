import pg from 'pg'

const { Client } = pg

// Marca todos os convites JA pagos como "reforco tratado", para que a rotina de
// lembrete de login valha apenas para pagamentos NOVOS (dali em diante) e nao
// dispare um envio retroativo em massa para a base historica.
const sql = `
  update public.invites
     set invite_access_reminder_sent = true
   where status = 'paid'
     and invite_access_reminder_sent = false;
`

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
})

await client.connect()
const res = await client.query(sql)
console.log(`Backfill concluído. Convites marcados: ${res.rowCount}`)
await client.end()
