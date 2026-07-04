import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('[diag] Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no ambiente.')
  process.exit(1)
}

const email = process.argv[2] || 'priscilaramosplacstar@gmail.com'
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data, error } = await supabase
  .from('invites')
  .select('id, email, type, status, gateway, transaction_id, amount, created_at, paid_at, pix_expiration')
  .eq('email', email)
  .order('created_at', { ascending: false })

if (error) {
  console.error('[diag] Erro ao buscar:', error.message)
  process.exit(1)
}

console.log(`[diag] ${data?.length || 0} registro(s) para ${email}:`)
for (const inv of data || []) {
  console.log(
    JSON.stringify(
      {
        id: inv.id,
        type: inv.type,
        status: inv.status,
        gateway: inv.gateway,
        transaction_id: inv.transaction_id,
        amount: inv.amount,
        created_at: inv.created_at,
        paid_at: inv.paid_at,
        pix_expiration: inv.pix_expiration,
      },
      null,
      2,
    ),
  )
}
