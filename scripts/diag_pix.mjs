import pg from 'pg'

const c = new pg.Client({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false },
})
await c.connect()

const agg = await c.query(
  `select status, gateway, count(*) as n, max(created_at) as ultima
   from invites
   where created_at > now() - interval '6 hours'
   group by status, gateway
   order by ultima desc`,
)
console.log('=== ULTIMAS 6 HORAS (status x gateway) ===')
console.table(
  agg.rows.map((x) => ({
    status: x.status,
    gateway: x.gateway,
    n: Number(x.n),
    ultima: x.ultima?.toISOString?.().slice(5, 19),
  })),
)

const d = await c.query(
  `select id, status, gateway, amount, transaction_id, created_at, paid_at
   from invites order by created_at desc limit 12`,
)
console.log('=== ULTIMAS 12 TRANSACOES ===')
console.table(
  d.rows.map((x) => ({
    id: String(x.id).slice(0, 8),
    status: x.status,
    gw: x.gateway,
    amount: x.amount,
    tx: String(x.transaction_id || '(vazio)').slice(0, 18),
    created: x.created_at?.toISOString?.().slice(5, 19),
    paid: x.paid_at ? String(x.paid_at.toISOString?.()).slice(5, 19) : '-',
  })),
)

await c.end()
