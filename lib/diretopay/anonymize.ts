import { createHash } from 'crypto'

/**
 * Identidade sintetica enviada a DiretoPay no lugar dos dados do pagador.
 *
 * REGRA EXCLUSIVA DA DIRETOPAY: nenhum dado real do cliente (nome, e-mail,
 * telefone ou CPF) e enviado para a DiretoPay. Os dados reais continuam
 * gravados normalmente no nosso banco (tabela `invites`) e sao usados no
 * restante do sistema (e-mails, painel, CAPI do Facebook, suporte).
 *
 * A identidade e derivada de forma DETERMINISTICA do identificador interno da
 * transacao. Isso garante que:
 *  - a mesma cobranca sempre gera a mesma identidade (retentativas nao criam
 *    pagadores diferentes para a mesma venda);
 *  - nada do cliente real pode ser reconstruido a partir do que foi enviado,
 *    porque o seed e um id interno nosso e a derivacao e um hash de mao unica.
 */
export interface AnonymousPayer {
  name: string
  email: string
  phone: string
  /** CPF sintetico com digitos verificadores validos (so digitos). */
  document: string
}

/** Nomes ficticios genericos. Nenhum vinculo com clientes reais. */
const FAKE_FIRST = [
  'Ana',
  'Bruno',
  'Carla',
  'Daniel',
  'Elisa',
  'Felipe',
  'Gabriela',
  'Henrique',
  'Isabela',
  'Joao',
  'Larissa',
  'Marcelo',
  'Natalia',
  'Otavio',
  'Paula',
  'Rafael',
]

const FAKE_LAST = [
  'Almeida',
  'Barbosa',
  'Cardoso',
  'Duarte',
  'Esteves',
  'Ferreira',
  'Gomes',
  'Henriques',
  'Imperato',
  'Jardim',
  'Klein',
  'Lopes',
  'Machado',
  'Nogueira',
  'Oliveira',
  'Pinheiro',
]

/**
 * Dominio usado nos e-mails sinteticos. O padrao `example.com` e reservado
 * pela IANA justamente para este fim: tem formato valido, mas nunca entrega
 * mensagem a uma pessoa real. Pode ser trocado por um dominio proprio via
 * DIRETOPAY_ANON_EMAIL_DOMAIN caso a DiretoPay rejeite `example.com`.
 */
function anonEmailDomain(): string {
  const custom = (process.env.DIRETOPAY_ANON_EMAIL_DOMAIN || '').trim()
  return custom || 'example.com'
}

/** Bytes deterministicos a partir do seed. */
function seedBytes(seed: string): number[] {
  // O prefixo isola este uso de qualquer outro hash do sistema.
  const digest = createHash('sha256').update(`diretopay-anon:${seed}`).digest()
  return Array.from(digest)
}

/** Monta um CPF valido (11 digitos) de forma deterministica a partir dos bytes. */
function buildValidCPF(bytes: number[]): string {
  const digits: number[] = []
  for (let i = 0; i < 9; i++) digits.push(bytes[i] % 10)

  // Evita sequencias invalidas do tipo 000.000.000-00 / 111.111.111-11.
  if (digits.every((d) => d === digits[0])) digits[8] = (digits[8] + 1) % 10

  let sum = 0
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i)
  let check = (sum * 10) % 11
  if (check === 10) check = 0
  digits.push(check)

  sum = 0
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i)
  check = (sum * 10) % 11
  if (check === 10) check = 0
  digits.push(check)

  return digits.join('')
}

/**
 * Gera a identidade sintetica de um pagador para a DiretoPay.
 *
 * @param seed Identificador interno da transacao. Nunca use aqui um dado do
 *             cliente (e-mail, CPF, telefone): o seed nao e enviado, mas
 *             manter apenas ids internos evita qualquer acoplamento acidental.
 */
export function buildAnonymousPayer(seed: string): AnonymousPayer {
  const bytes = seedBytes(seed || 'sem-identificador')

  const first = FAKE_FIRST[bytes[20] % FAKE_FIRST.length]
  const last = FAKE_LAST[bytes[21] % FAKE_LAST.length]

  // Sufixo numerico para reduzir colisao de e-mails entre transacoes.
  const suffix = ((bytes[22] << 8) | bytes[23]) % 10000
  const email = `${first.toLowerCase()}.${last.toLowerCase()}${suffix}@${anonEmailDomain()}`

  // Celular ficticio: DDD 11 + 9 + 8 digitos derivados do hash.
  const mobile = Array.from({ length: 8 }, (_, i) => bytes[24 + i] % 10).join('')
  const phone = `119${mobile}`

  return {
    name: `${first} ${last}`,
    email,
    phone,
    document: buildValidCPF(bytes),
  }
}
