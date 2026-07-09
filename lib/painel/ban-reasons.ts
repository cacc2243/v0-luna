// Motivos de banimento pre-definidos, compartilhados entre o painel admin
// (modal de banir) e a tela de login (mensagem exibida a conta desabilitada).

export const BAN_REASONS = [
  'Fotos com conteúdo explícito',
  'Imagens geradas por inteligência artificial',
  'Conteúdo que viola os termos de uso',
  'Comportamento fraudulento ou golpe',
  'Uso indevido da plataforma',
  'Violação de direitos autorais',
] as const

export type BanReason = (typeof BAN_REASONS)[number]

// Mensagem padrao caso a conta esteja banida sem um motivo registrado.
export const DEFAULT_BAN_REASON = 'Violação dos termos de uso da plataforma'
