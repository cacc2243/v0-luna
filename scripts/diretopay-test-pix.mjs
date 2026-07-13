// Gera um PIX de teste diretamente na DiretoPay para validar a integracao.
// Uso: node --env-file-if-exists=/vercel/share/.env.project scripts/diretopay-test-pix.mjs

const API_URL = 'https://api.diretopay.com.br/payment/v1'
const apiKey = process.env.DIRETOPAY_API_KEY

if (!apiKey) {
  console.error('ERRO: DIRETOPAY_API_KEY nao configurada.')
  process.exit(1)
}

// Gera um CPF valido (algoritmo dos digitos verificadores).
function generateValidCPF() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const calc = (base) => {
    let total = 0
    for (let i = 0; i < base.length; i++) total += base[i] * (base.length + 1 - i)
    const rest = (total * 10) % 11
    return rest === 10 ? 0 : rest
  }
  const d1 = calc(n)
  const d2 = calc([...n, d1])
  return [...n, d1, d2].join('')
}

const identifier = `test-${Date.now()}`
const amount = 24.8

const body = {
  amount,
  currency: 'BRL',
  paymentMethod: 'pix',
  paymentDetails: {
    firstName: 'Teste',
    lastName: 'Luna Prive',
    email: 'teste@lunaprive.live',
    phoneNumber: '11999999999',
    document: generateValidCPF(),
    documentType: 'cpf',
  },
  items: [{ title: 'Convite Luna Prive (teste)', unitPrice: amount, quantity: 1, tangible: false }],
}

console.log('== DiretoPay :: Gerando PIX de teste ==')
console.log('Endpoint :', `${API_URL}/create`)
console.log('Identifier:', identifier)
console.log('Amount   : R$', amount.toFixed(2))
console.log('Document :', body.paymentDetails.document)
console.log('---')

const res = await fetch(`${API_URL}/create`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

let data
try {
  data = await res.json()
} catch {
  data = await res.text()
}

console.log('HTTP status:', res.status, res.ok ? '(OK)' : '(ERRO)')

if (!res.ok) {
  console.error('Resposta de erro:', JSON.stringify(data, null, 2))
  process.exit(1)
}

const payload = data?.data || data
console.log('---')
console.log('Transaction ID:', payload?.id)
console.log('Status        :', payload?.status)
console.log('Valor         : R$', payload?.amount)
console.log('Criado em     :', payload?.createdAt)
if (payload?.fee) {
  console.log('Taxa (net)    : R$', payload.fee.netAmount, '| flat:', payload.fee.flatFee, '| %:', payload.fee.percentageFee)
}
console.log('---')
console.log('PIX copia e cola:')
console.log(payload?.pix || '(nao retornado)')
console.log('---')
console.log('OK: PIX de teste gerado com sucesso pela DiretoPay.')
