import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(url, key, { auth: { persistSession: false } })

// Marca invite_paid_email_sent=true para convites que ja receberam o e-mail
// invite_paid com sucesso, evitando reenvio caso sejam reprocessados.
const { data: logs, error } = await supabase
  .from('email_logs')
  .select('recipient')
  .eq('template_id', 'invite_paid')
  .eq('status', 'sent')

if (error) {
  console.error('Erro ao ler email_logs:', error.message)
  process.exit(1)
}

const recipients = [...new Set((logs || []).map((l) => l.recipient).filter(Boolean))]
console.log(`Destinatarios ja notificados: ${recipients.length}`)

let updated = 0
for (const email of recipients) {
  const { data, error: upErr } = await supabase
    .from('invites')
    .update({ invite_paid_email_sent: true })
    .eq('email', email)
    .eq('type', 'invite')
    .eq('invite_paid_email_sent', false)
    .select('id')
  if (upErr) {
    console.error(`Erro em ${email}:`, upErr.message)
    continue
  }
  updated += data?.length || 0
}

console.log(`Convites marcados como ja notificados: ${updated}`)
