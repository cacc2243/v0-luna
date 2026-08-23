/**
 * Gerador de @usernames de fas para a atividade simulada do /minha-conta.
 *
 * Objetivo: nunca usar nome de pessoa real (tipo "Carlos Mendes"). Os fas da
 * plataforma sao anonimos, entao aparecem como handles no mesmo estilo do que
 * o app ja mostra na demo (@fan_secreto, @serg10.tp, @lobo_solitario).
 *
 * Espaco combinatorio: os padroes que usam digitos sozinhos ja passam de
 * 3 milhoes de combinacoes ((ROOTS + NICKS) x separadores x 2-4 digitos), o
 * que torna repeticao improvavel mesmo depois de horas de atividade.
 */

/** Palavras de "fa anonimo" — a maior parte do sabor vem daqui. */
const ROOTS = [
  'fan', 'anon', 'secreto', 'oculto', 'discreto', 'misterio', 'sombra', 'noturno',
  'silencioso', 'invisivel', 'escondido', 'reservado', 'incognito', 'sigiloso',
  'velado', 'obscuro', 'furtivo', 'solitario', 'distante', 'ausente',
  'lobo', 'tigre', 'leao', 'urso', 'touro', 'corvo', 'falcao', 'aguia',
  'dragao', 'fenix', 'pantera', 'jaguar', 'predador', 'cacador', 'raposa', 'coruja',
  'guerreiro', 'samurai', 'ninja', 'pirata', 'viking', 'capitao', 'comandante',
  'sargento', 'chefe', 'patrao', 'rei', 'principe', 'barao', 'conde', 'duque',
  'mestre', 'sensei', 'guru', 'doutor', 'professor', 'aprendiz', 'novato',
  'colecionador', 'admirador', 'apaixonado', 'encantado', 'viciado', 'insaciavel',
  'faminto', 'curioso', 'observador', 'espectador', 'devoto', 'fiel', 'leal',
  'servo', 'refem', 'cativo', 'carente', 'saudoso', 'sonhador',
  'magnata', 'investidor', 'empresario', 'executivo', 'piloto', 'marinheiro',
  'viajante', 'andarilho', 'nomade', 'forasteiro', 'estranho', 'desconhecido',
  'fantasma', 'espirito', 'demonio', 'anjo', 'santo', 'pecador', 'proibido',
  'insonia', 'madrugada', 'meianoite', 'eclipse', 'cometa', 'meteoro', 'trovao',
] as const

/** Apelidos curtos, estilo handle de rede social. */
const NICKS = [
  'jp', 'zeca', 'tuka', 'digo', 'leo', 'gui', 'thi', 'rafa', 'lucas', 'mateus',
  'edu', 'fer', 'cau', 'vini', 'well', 'bruninho', 'pedrin', 'juninho', 'netinho',
  'kaka', 'dede', 'nando', 'tato', 'binho', 'lipe', 'gabs', 'matt', 'rick',
  'dan', 'du', 'gu', 'th', 'vic', 'ded', 'rod', 'ale', 'marcin', 'cacau',
  'alemao', 'russo', 'japa', 'turco', 'grego', 'careca', 'barba', 'bigode',
  'tio', 'primo', 'mano', 'parca', 'brother', 'chapa', 'veio', 'coroa',
  'gordinho', 'magrinho', 'baixinho', 'grandao', 'seunome', 'meuchapa',
] as const

/** Sufixos: UFs, selos e palavrinhas de handle. */
const SUFFIXES = [
  'br', 'sp', 'rj', 'mg', 'ba', 'ce', 'pr', 'rs', 'sc', 'go', 'pe', 'df',
  'mt', 'ms', 'pa', 'am', 'es', 'rn', 'pb', 'al', 'se', 'pi', 'ma', 'to',
  'oficial', 'real', 'vip', 'prime', 'gold', 'black', 'plus', 'top', 'king',
  'boss', 'mvp', 'alfa', 'zero', 'uno', 'max', 'pro', 'tp', 'jr', 'neto',
  'x', 'xx', 'xyz', 'off', 'on', 'live', 'now', 'only', 'here',
] as const

const SEPS = ['.', '_', ''] as const

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** String de 2 a 4 digitos (ex.: "07", "2201", "993"). */
function digits(): string {
  const len = randInt(2, 4)
  let out = ''
  for (let i = 0; i < len; i++) out += randInt(0, 9)
  return out
}

/** Monta um handle (sem o "@") sorteando entre varios formatos. */
function buildHandle(): string {
  const sep = pick(SEPS)
  switch (randInt(1, 7)) {
    case 1:
      return `${pick(ROOTS)}${sep}${pick(SUFFIXES)}`
    case 2:
      return `${pick(ROOTS)}${sep}${digits()}`
    case 3:
      return `${pick(NICKS)}${sep}${pick(SUFFIXES)}`
    case 4:
      return `${pick(NICKS)}${sep}${digits()}`
    case 5:
      return `${pick(ROOTS)}${sep}${pick(NICKS)}`
    case 6:
      return `${pick(NICKS)}${sep}${pick(ROOTS)}`
    default:
      return `${pick(ROOTS)}${digits()}${sep}${pick(SUFFIXES)}`
  }
}

/**
 * Gera um @username unico de fa. Quando `used` e informado, evita handles que
 * ja apareceram (e registra o novo), para nao repetir nome na mesma tela.
 */
export function generateFanUsername(used?: Set<string>): string {
  for (let attempt = 0; attempt < 60; attempt++) {
    const handle = `@${buildHandle()}`
    if (!used || !used.has(handle)) {
      used?.add(handle)
      return handle
    }
  }
  // Fallback improvavel: acrescenta digitos para garantir unicidade.
  const handle = `@${buildHandle()}${randInt(100, 999)}`
  used?.add(handle)
  return handle
}
