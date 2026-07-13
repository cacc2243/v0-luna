import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const TARGET_PIXEL = '1753197515870888'

if (!url || !key) {
  console.error('Faltam envs NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 1) Pixel cadastrado?
const { data: pixels, error: pixErr } = await supabase
  .from('fb_pixels')
  .select('id,label,pixel_id,enabled,test_event_code,access_token')

if (pixErr) {
  console.error('Erro ao ler fb_pixels:', pixErr.message)
} else {
  console.log('=== fb_pixels ===')
  for (const p of pixels) {
    console.log(
      `- ${p.pixel_id} | label=${p.label} | enabled=${p.enabled} | token=${
        p.access_token ? 'SIM(' + String(p.access_token).length + ' chars)' : 'NAO'
      } | test_code=${p.test_event_code || '-'}`,
    )
  }
  const target = pixels.find((p) => String(p.pixel_id) === TARGET_PIXEL)
  console.log(`\nPixel alvo ${TARGET_PIXEL} encontrado: ${target ? 'SIM' : 'NAO'}`)
}

// 2) Vendas pagas
const { count, error: cntErr } = await supabase
  .from('invites')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'paid')

if (cntErr) {
  console.error('Erro ao contar invites pagos:', cntErr.message)
} else {
  console.log(`\n=== invites status=paid: ${count} ===`)
}

// 3) Amostra de campos de atribuicao
const { data: sample, error: sErr } = await supabase
  .from('invites')
  .select(
    'id,type,status,amount,email,user_id,fbp,fbc,fbclid,client_ip,client_ua,event_source_url,utm_source,utm_campaign,utm_medium,utm_content,utm_term,created_at,paid_at',
  )
  .eq('status', 'paid')
  .order('created_at', { ascending: false })
  .limit(3)

if (sErr) {
  console.error('Erro na amostra (pode ser coluna inexistente):', sErr.message)
} else {
  console.log('\n=== Amostra (3 mais recentes) ===')
  for (const r of sample) {
    console.log(
      JSON.stringify(
        {
          id: r.id,
          type: r.type,
          amount: r.amount,
          email: r.email ? 'sim' : 'nao',
          fbp: r.fbp ? 'sim' : 'nao',
          fbc: r.fbc ? 'sim' : 'nao',
          fbclid: r.fbclid ? 'sim' : 'nao',
          ip: r.client_ip ? 'sim' : 'nao',
          ua: r.client_ua ? 'sim' : 'nao',
          utm_source: r.utm_source || '-',
          utm_campaign: r.utm_campaign || '-',
          created_at: r.created_at,
          paid_at: r.paid_at,
        },
        null,
        0,
      ),
    )
  }
}
