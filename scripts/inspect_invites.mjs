import pg from 'pg'

const EMAILS = [
  'gleycianealmeida1990@icloud.com',
  'pedelicado@hotmail.com',
  'juliatpaixaao@gmail.com',
  'estuda.ca.estuda@gmail.com',
  'tatianamatos25@gmail.com',
  'torresvencer@gmail.com',
  'marliany164@gmail.com',
  'aurorablythewriter@gmail.com',
  'fernandes0790@outlook.com',
  'suellenlyrio@hotmail.com',
]

const c = new pg.Client({ connectionString: process.env.POSTGRES_URL, ssl: { rejectUnauthorized: false } })
await c.connect()

const lower = EMAILS.map((e) => e.toLowerCase())

const { rows } = await c.query(
  `select id, email, type, status, amount, gateway, transaction_id,
          invite_paid_email_sent, created_at, paid_at
     from invites
    where lower(email) = any($1)
    order by email, created_at desc`,
  [lower],
)

console.log('=== CONVITES ENCONTRADOS ===')
for (const e of lower) {
  const matches = rows.filter((r) => (r.email || '').toLowerCase() === e)
  if (matches.length === 0) {
    console.log(`\n[SEM REGISTRO] ${e}`)
    continue
  }
  console.log(`\n${e}  (${matches.length} registro(s))`)
  for (const m of matches) {
    console.log(
      `  - id=${String(m.id).slice(0, 8)} type=${m.type} status=${m.status} ` +
        `email_sent=${m.invite_paid_email_sent} amount=${m.amount} ` +
        `gw=${m.gateway || '-'} created=${m.created_at?.toISOString?.().slice(0, 16)} ` +
        `paid=${m.paid_at ? m.paid_at.toISOString().slice(0, 16) : '-'}`,
    )
  }
}

console.log('\n=== RESUMO ===')
console.log('Total de registros:', rows.length)
console.log('Emails sem registro:', lower.filter((e) => !rows.some((r) => (r.email || '').toLowerCase() === e)).length)

await c.end()
