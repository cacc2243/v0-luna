/**
 * Definicao central dos templates de e-mail do Luna Privé.
 *
 * Cada template tem:
 * - metadados (nome, descricao, gatilho) para exibir no painel admin
 * - subject(vars): gera o assunto
 * - html(vars): gera o corpo HTML (layout simples, sem cartao/estilizacao pesada)
 * - text(vars): versao em texto puro (importante para deliverability)
 * - sampleVars: dados de exemplo para o preview no painel
 *
 * Para enviar de verdade, use lib/email/send.ts (Resend).
 */

export type EmailTemplateId =
  | 'account_created'
  | 'invite_pix'
  | 'invite_paid'
  | 'invite_access_reminder'
  | 'password_reset'

export interface EmailTemplateVars {
  /** Nome de usuaria / display name */
  name?: string
  /** E-mail do destinatario (usado em alguns corpos) */
  email?: string
  /** Codigo PIX copia e cola (template invite_pix) */
  pixCode?: string
  /** Valor formatado, ex: "R$ 24,80" */
  amount?: string
  /** URL de acesso a conta (template invite_paid) */
  accessUrl?: string
  /** URL para redefinir a senha (template password_reset) */
  resetUrl?: string
  /** Nome de usuaria cadastrado (aparece no resumo da conta) */
  username?: string
  /** Tipo da chave PIX cadastrada, ex: "CPF", "Email", "Telefone" */
  pixType?: string
  /** Chave PIX cadastrada */
  pixKey?: string
}

export interface EmailTemplate {
  id: EmailTemplateId
  /** Nome amigavel exibido no painel */
  name: string
  /** Explicacao do que o e-mail faz */
  description: string
  /** Quando este e-mail e disparado */
  trigger: string
  subject: (vars: EmailTemplateVars) => string
  html: (vars: EmailTemplateVars) => string
  /**
   * Versao em texto puro. Fundamental para deliverability: e-mails sem uma
   * alternativa text/plain sao um forte sinal de spam para a maioria dos
   * filtros. Toda mensagem passa a incluir esta versao.
   */
  text: (vars: EmailTemplateVars) => string
  /** Dados de exemplo para preview */
  sampleVars: EmailTemplateVars
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Monta a URL de /convite ja com os dados da conta pre-preenchidos via query
 * string. Ao abrir esse link pelo e-mail, a pagina /convite le esses params e
 * preenche e-mail, usuario e chave PIX automaticamente.
 */
function buildConviteUrl(vars: EmailTemplateVars): string {
  const base = 'https://lunaprive.live/convite'
  const params = new URLSearchParams()
  if (vars.email) params.set('email', vars.email)
  if (vars.username) params.set('username', vars.username)
  if (vars.pixType) params.set('pixType', vars.pixType)
  if (vars.pixKey) params.set('pixKey', vars.pixKey)
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

/* -------------------------------------------------------------------------- */
/*  Layout simples                                                             */
/*  Sem cartao, sem cores de fundo, sem badges. Apenas texto, um botao e um    */
/*  link — um e-mail "normal", que tambem ajuda na entrega (menos cara de      */
/*  marketing).                                                                */
/* -------------------------------------------------------------------------- */

const TEXT = '#111111'
const MUTED = '#555555'
const LINK = '#c23a64'
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif"

function layout(opts: { previewText: string; body: string }): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>Luna Privé</title>
  </head>
  <body style="margin:0;padding:0;background-color:#ffffff;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${opts.previewText}</span>
    <div style="max-width:520px;margin:0 auto;padding:32px 24px;font-family:${FONT};color:${TEXT};font-size:16px;line-height:1.6;">
      ${opts.body}
      <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#999999;">— Luna Privé</p>
    </div>
  </body>
</html>`
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.6;color:${TEXT};">${html}</p>`
}

function mutedParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:1.6;color:${MUTED};">${html}</p>`
}

function button(label: string, href: string): string {
  return `<p style="margin:0 0 16px;">
    <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;background-color:${LINK};color:#ffffff;font-family:${FONT};font-size:16px;font-weight:700;text-decoration:none;border-radius:8px;">${label}</a>
  </p>`
}

function link(href: string, label?: string): string {
  return `<a href="${href}" target="_blank" style="color:${LINK};text-decoration:underline;word-break:break-all;">${label || href}</a>`
}

/** Codigo PIX em bloco pequeno e legivel, copia e cola. */
function pixCodeBlock(code: string): string {
  return `<p style="margin:0 0 8px;font-family:${FONT};font-size:13px;font-weight:700;color:${MUTED};">Código PIX (copia e cola):</p>
  <p style="margin:0 0 16px;padding:12px 14px;background-color:#f5f5f5;border:1px solid #e5e5e5;border-radius:8px;font-family:'Courier New',monospace;font-size:12px;line-height:1.5;word-break:break-all;color:${TEXT};">${code}</p>`
}

/* -------------------------------------------------------------------------- */
/*  Templates                                                                  */
/* -------------------------------------------------------------------------- */

export const EMAIL_TEMPLATES: Record<EmailTemplateId, EmailTemplate> = {
  account_created: {
    id: 'account_created',
    name: 'Conta criada',
    description:
      'Enviado logo após a usuária concluir o cadastro, informando que a conta foi criada e com o link para resgatar o convite.',
    trigger: 'Disparado quando uma nova conta é criada (cadastro concluído).',
    subject: () => 'Sua conta no Luna Privé foi criada',
    html: (v) => {
      const conviteUrl = buildConviteUrl(v)
      return layout({
        previewText: 'Sua conta foi criada. Resgate o seu convite de acesso.',
        body: `
          ${paragraph(`Olá${v.name ? `, ${v.name}` : ''}!`)}
          ${paragraph('Sua conta no Luna Privé foi criada com sucesso.')}
          ${paragraph('Para concluir o acesso, resgate o seu convite:')}
          ${button('Resgatar meu convite', conviteUrl)}
          ${mutedParagraph(`Ou acesse pelo link: ${link(conviteUrl, 'lunaprive.live/convite')}`)}
        `,
      })
    },
    text: (v) =>
      [
        `Olá${v.name ? `, ${v.name}` : ''}!`,
        '',
        'Sua conta no Luna Privé foi criada com sucesso.',
        '',
        'Para concluir o acesso, resgate o seu convite:',
        buildConviteUrl(v),
        '',
        '— Luna Privé',
      ].join('\n'),
    sampleVars: {
      name: 'Mariana',
      email: 'mariana@email.com',
      username: 'mariana.luna',
      pixType: 'Email',
      pixKey: 'mariana@email.com',
    },
  },

  invite_pix: {
    id: 'invite_pix',
    name: 'PIX do convite gerado',
    description:
      'Enviado quando o PIX do convite é gerado, informando o código PIX completo e o link para gerar o código novamente.',
    trigger: 'Disparado quando o PIX do convite é gerado na página /convite.',
    subject: () => 'O PIX do seu convite foi gerado',
    html: (v) =>
      layout({
        previewText: 'O código PIX do seu convite está pronto.',
        body: `
          ${paragraph(`Olá${v.name ? `, ${v.name}` : ''}!`)}
          ${paragraph('O PIX do seu convite foi gerado. Use o código abaixo no aplicativo do seu banco para pagar:')}
          ${v.pixCode ? pixCodeBlock(v.pixCode) : ''}
          ${paragraph('Precisa gerar o código novamente?')}
          ${button('Gerar novo código PIX', buildConviteUrl(v))}
          ${mutedParagraph(`Ou acesse pelo link: ${link(buildConviteUrl(v), 'lunaprive.live/convite')}`)}
        `,
      }),
    text: (v) =>
      [
        `Olá${v.name ? `, ${v.name}` : ''}!`,
        '',
        'O PIX do seu convite foi gerado. Use o código abaixo no aplicativo do seu banco para pagar:',
        '',
        'Código PIX (copia e cola):',
        v.pixCode || '',
        '',
        'Precisa gerar o código novamente? Acesse:',
        buildConviteUrl(v),
        '',
        '— Luna Privé',
      ].join('\n'),
    sampleVars: {
      name: 'Mariana',
      amount: 'R$ 24,80',
      username: 'mariana.luna',
      email: 'mariana@email.com',
      pixType: 'Email',
      pixKey: 'mariana@email.com',
      pixCode:
        '00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540524.805802BR5909Luna Prive6009Sao Paulo62070503***6304A1B2',
    },
  },

  invite_paid: {
    id: 'invite_paid',
    name: 'Acesso liberado (pagamento confirmado)',
    description:
      'Enviado após o convite ser pago, dando as boas-vindas e o link para entrar na conta.',
    trigger: 'Disparado quando o pagamento do convite é confirmado (webhook PIX).',
    subject: () => 'Seja bem-vinda ao Luna Privé',
    html: (v) =>
      layout({
        previewText: 'Seja bem-vinda ao Luna Privé. Sua conta já está liberada.',
        body: `
          ${paragraph(`Seja bem-vinda ao Luna Privé${v.name ? `, ${v.name}` : ''}!`)}
          ${paragraph('Seu acesso já está liberado. Toque no botão abaixo para entrar:')}
          ${button('Entrar na minha conta', v.accessUrl || 'https://lunaprive.live/minha-conta')}
          ${mutedParagraph(`Ou acesse pelo link: ${link(v.accessUrl || 'https://lunaprive.live/minha-conta')}`)}
        `,
      }),
    text: (v) =>
      [
        `Seja bem-vinda ao Luna Privé${v.name ? `, ${v.name}` : ''}!`,
        '',
        'Seu acesso já está liberado. Entre pelo link abaixo:',
        v.accessUrl || 'https://lunaprive.live/minha-conta',
        '',
        '— Luna Privé',
      ].join('\n'),
    sampleVars: {
      name: 'Mariana',
      accessUrl: 'https://lunaprive.live/minha-conta',
    },
  },

  invite_access_reminder: {
    id: 'invite_access_reminder',
    name: 'Lembrete de acesso (não logou)',
    description:
      'Reforço enviado quando a usuária pagou o convite mas ainda não acessou a plataforma após 1 hora.',
    trigger:
      'Disparado por rotina (cron) ~1h após o pagamento, se a usuária ainda não fez login.',
    subject: () => 'Vi que você ainda não entrou na sua conta',
    html: (v) =>
      layout({
        previewText: 'Seu acesso ao Luna Privé já está pronto — é só entrar.',
        body: `
          ${paragraph(`Olá${v.name ? `, ${v.name}` : ''}!`)}
          ${paragraph('Seu pagamento foi confirmado e sua conta no Luna Privé já está ativa, mas você ainda não entrou.')}
          ${paragraph('É só tocar no botão abaixo para fazer login:')}
          ${button('Entrar na minha conta', v.accessUrl || 'https://lunaprive.live/minha-conta')}
          ${mutedParagraph(`Ou acesse pelo link: ${link(v.accessUrl || 'https://lunaprive.live/minha-conta')}`)}
        `,
      }),
    text: (v) =>
      [
        `Olá${v.name ? `, ${v.name}` : ''}!`,
        '',
        'Seu pagamento foi confirmado e sua conta no Luna Privé já está ativa, mas você ainda não entrou.',
        '',
        'Faça login pelo link abaixo:',
        v.accessUrl || 'https://lunaprive.live/minha-conta',
        '',
        '— Luna Privé',
      ].join('\n'),
    sampleVars: {
      name: 'Mariana',
      accessUrl: 'https://lunaprive.live/minha-conta',
    },
  },

  password_reset: {
    id: 'password_reset',
    name: 'Recuperação de senha',
    description:
      'Enviado quando a usuária solicita recuperação de senha. Contém um link seguro e temporário para criar uma nova senha.',
    trigger:
      'Disparado ao solicitar "Esqueceu sua senha?" — somente para contas com convite pago.',
    subject: () => 'Redefinição de senha da sua conta Luna Privé',
    html: (v) =>
      layout({
        previewText: 'Use o link para criar uma nova senha da sua conta.',
        body: `
          ${paragraph(`Olá${v.name ? `, ${v.name}` : ''}!`)}
          ${paragraph('Recebemos um pedido para redefinir a senha da sua conta no Luna Privé. Toque no botão abaixo para criar uma nova senha:')}
          ${button('Criar nova senha', v.resetUrl || 'https://lunaprive.live/minha-conta')}
          ${mutedParagraph(`Ou acesse pelo link: ${link(v.resetUrl || 'https://lunaprive.live/minha-conta')}`)}
          ${mutedParagraph('Por segurança, este link expira em breve e só pode ser usado uma vez. Se você não solicitou esta alteração, ignore este e-mail — sua senha atual continua a mesma.')}
        `,
      }),
    text: (v) =>
      [
        `Olá${v.name ? `, ${v.name}` : ''}!`,
        '',
        'Recebemos um pedido para redefinir a senha da sua conta no Luna Privé. Use o link abaixo para criar uma nova senha:',
        v.resetUrl || 'https://lunaprive.live/minha-conta',
        '',
        'Por segurança, este link expira em breve e só pode ser usado uma vez. Se você não solicitou esta alteração, ignore este e-mail — sua senha atual continua a mesma.',
        '',
        '— Luna Privé',
      ].join('\n'),
    sampleVars: {
      name: 'Mariana',
      resetUrl: 'https://lunaprive.live/minha-conta/redefinir-senha',
    },
  },
}

export function getEmailTemplate(id: EmailTemplateId): EmailTemplate {
  return EMAIL_TEMPLATES[id]
}

export function listEmailTemplates(): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES)
}
