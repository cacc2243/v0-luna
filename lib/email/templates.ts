/**
 * Definicao central dos templates de e-mail do Luna Privé.
 *
 * Cada template tem:
 * - metadados (nome, descricao, gatilho) para exibir no painel admin
 * - subject(vars): gera o assunto
 * - html(vars): gera o corpo HTML
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
/*  Layout base                                                                */
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

/** Versao em texto puro do resumo da conta. */
function accountInfoText(vars: EmailTemplateVars): string[] {
  const lines: string[] = []
  if (vars.username) lines.push(`Usuária: ${vars.username}`)
  if (vars.email) lines.push(`E-mail: ${vars.email}`)
  if (lines.length === 0) return []
  return ['Dados da sua conta:', ...lines]
}

/* -------------------------------------------------------------------------- */
/*  Layout claro (white) — usado no e-mail de reforço de acesso               */
/*  Fundo branco, tipografia sóbria e sem emojis: um visual "transacional"     */
/*  simples reduz a chance de cair em spam/promoções.                          */
/* -------------------------------------------------------------------------- */

const LIGHT = {
  bg: '#f4f4f5',
  card: '#ffffff',
  border: '#e4e4e7',
  text: '#18181b',
  muted: '#52525b',
  primary: '#c23a64',
}

function lightLayout(opts: { previewText: string; body: string }): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>Luna Privé</title>
  </head>
  <body style="margin:0;padding:0;background-color:${LIGHT.bg};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${opts.previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${LIGHT.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
            <tr>
              <td align="center" style="padding-bottom:20px;">
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;letter-spacing:2px;color:${LIGHT.text};">
                  LUNA <span style="color:${LIGHT.primary};">PRIVÉ</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="background-color:${LIGHT.card};border:1px solid ${LIGHT.border};border-radius:16px;padding:32px 28px;">
                ${opts.body}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:20px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:#a1a1aa;">
                  Você recebeu este e-mail porque tem uma conta no Luna Privé.<br />
                  © ${new Date().getFullYear()} Luna Privé.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function lightHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:21px;line-height:1.3;font-weight:700;color:${LIGHT.text};">${text}</h1>`
}

function lightParagraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${LIGHT.muted};">${html}</p>`
}

function lightButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr>
      <td align="center" style="background-color:${LIGHT.primary};border-radius:12px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function lightLink(href: string, label?: string): string {
  return `<a href="${href}" target="_blank" style="color:${LIGHT.primary};font-weight:700;text-decoration:underline;word-break:break-all;">${label || href}</a>`
}

/** Caixa do PIX copia e cola no tema claro. */
function lightPixBox(code: string): string {
  return `<div style="margin:8px 0 16px;padding:14px 16px;background-color:${LIGHT.bg};border:1px solid ${LIGHT.border};border-radius:12px;">
    <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${LIGHT.muted};">PIX copia e cola</p>
    <p style="margin:0;font-family:'Courier New',monospace;font-size:12px;line-height:1.5;word-break:break-all;color:${LIGHT.text};">${code}</p>
  </div>`
}

/** Linha (rotulo + valor) do resumo da conta no tema claro. */
function lightInfoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid ${LIGHT.border};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${LIGHT.muted};white-space:nowrap;vertical-align:top;">${label}</td>
    <td style="padding:8px 0 8px 16px;border-bottom:1px solid ${LIGHT.border};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:600;color:${LIGHT.text};word-break:break-word;text-align:right;">${value}</td>
  </tr>`
}

/** Resumo dos dados da conta (usuaria + e-mail) no tema claro. */
function lightAccountInfoBox(vars: EmailTemplateVars): string {
  const rows = [
    vars.username ? lightInfoRow('Usuária', vars.username) : '',
    vars.email ? lightInfoRow('E-mail', vars.email) : '',
  ]
    .filter(Boolean)
    .join('')
  if (!rows) return ''
  return `<div style="margin:8px 0 20px;padding:4px 16px;background-color:${LIGHT.bg};border:1px solid ${LIGHT.border};border-radius:12px;">
    <p style="margin:12px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${LIGHT.muted};">Dados da sua conta</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;">
      ${rows}
    </table>
  </div>`
}

/* -------------------------------------------------------------------------- */
/*  Templates                                                                  */
/* -------------------------------------------------------------------------- */

export const EMAIL_TEMPLATES: Record<EmailTemplateId, EmailTemplate> = {
  account_created: {
    id: 'account_created',
    name: 'Conta criada',
    description:
      'Boas-vindas enviadas logo após a usuária concluir o cadastro na plataforma.',
    trigger: 'Disparado quando uma nova conta é criada (cadastro concluído).',
    subject: () => 'Confirmação de cadastro no Luna Privé',
    html: (v) => {
      const conviteUrl = buildConviteUrl(v)
      return lightLayout({
        previewText: 'Confirmamos a criação da sua conta. Veja os próximos passos.',
        body: `
          ${lightHeading('Sua conta foi criada')}
          ${lightParagraph(`Olá${v.name ? `, <strong style="color:${LIGHT.text};">${v.name}</strong>` : ''}. Confirmamos que sua conta no Luna Privé foi criada.`)}
          ${lightAccountInfoBox(v)}
          ${lightParagraph('Para concluir o acesso à plataforma, o próximo passo é o seu Convite de Acesso. Você pode continuar pelo botão abaixo:')}
          ${lightButton('Continuar meu cadastro', conviteUrl)}
          ${lightParagraph(`Se o botão não funcionar, copie e cole este endereço no navegador:<br />${lightLink(conviteUrl, 'lunaprive.live/convite')}`)}
        `,
      })
    },
    text: (v) =>
      [
        'Sua conta foi criada',
        '',
        `Olá${v.name ? `, ${v.name}` : ''}. Confirmamos que sua conta no Luna Privé foi criada.`,
        ...(accountInfoText(v).length ? ['', ...accountInfoText(v)] : []),
        '',
        'Para concluir o acesso à plataforma, o próximo passo é o seu Convite de Acesso. Continue pelo link abaixo:',
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
      'Enviado quando o PIX do Convite de Acesso é gerado, com o código copia e cola.',
    trigger: 'Disparado quando o PIX do convite é gerado na página /convite.',
    subject: () => 'Seu código PIX do Convite de Acesso',
    html: (v) =>
      lightLayout({
        previewText: 'O código PIX do seu Convite de Acesso está disponível.',
        body: `
          ${lightHeading('Código PIX do seu convite')}
          ${lightParagraph(`Geramos o código PIX do seu Convite de Acesso${v.amount ? ` no valor de <strong style="color:${LIGHT.text};">${v.amount}</strong>` : ''}. Use o código abaixo no aplicativo do seu banco para concluir o pagamento.`)}
          ${v.pixCode ? lightPixBox(v.pixCode) : ''}
          ${lightAccountInfoBox(v)}
          ${lightParagraph('Após a confirmação do pagamento, você receberá um e-mail com o link de acesso à sua conta.')}
          ${lightParagraph('Se o código já não estiver mais válido, você pode gerar um novo:')}
          ${lightButton('Gerar novo código PIX', buildConviteUrl(v))}
        `,
      }),
    text: (v) =>
      [
        'Código PIX do seu convite',
        '',
        `Geramos o código PIX do seu Convite de Acesso${v.amount ? ` no valor de ${v.amount}` : ''}. Use o código abaixo no aplicativo do seu banco para concluir o pagamento.`,
        '',
        'PIX copia e cola:',
        v.pixCode || '',
        ...(accountInfoText(v).length ? ['', ...accountInfoText(v)] : []),
        '',
        'Após a confirmação do pagamento, você receberá um e-mail com o link de acesso à sua conta.',
        '',
        'Se o código já não estiver mais válido, gere um novo:',
        buildConviteUrl(v),
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
      'Confirmação de pagamento com o link de acesso à conta. Enviado após o convite ser pago.',
    trigger: 'Disparado quando o pagamento do convite é confirmado (webhook PIX).',
    subject: () => 'Pagamento confirmado — acesso liberado',
    html: (v) =>
      lightLayout({
        previewText: 'Recebemos seu pagamento e sua conta já está liberada.',
        body: `
          ${lightHeading('Pagamento confirmado')}
          ${lightParagraph(`Tudo certo${v.name ? `, <strong style="color:${LIGHT.text};">${v.name}</strong>` : ''}. Recebemos o pagamento do seu Convite de Acesso e sua conta no Luna Privé já está liberada.`)}
          ${lightParagraph('Use o botão abaixo para entrar e começar a usar a plataforma:')}
          ${lightButton('Acessar minha conta', v.accessUrl || 'https://lunaprive.live/minha-conta')}
          ${lightParagraph(`Se o botão não funcionar, copie e cole este endereço no navegador:<br />${lightLink(v.accessUrl || 'https://lunaprive.live/minha-conta')}`)}
        `,
      }),
    text: (v) =>
      [
        'Pagamento confirmado!',
        '',
        `Tudo certo${v.name ? `, ${v.name}` : ''}! Recebemos o pagamento do seu Convite de Acesso e sua conta no Luna Privé está liberada.`,
        '',
        'Para entrar e começar a usar a plataforma, acesse:',
        v.accessUrl || 'https://lunaprive.live/minha-conta',
      ].join('\n'),
    sampleVars: {
      name: 'Mariana',
      accessUrl: 'https://lunaprive.com/minha-conta',
    },
  },

  invite_access_reminder: {
    id: 'invite_access_reminder',
    name: 'Lembrete de acesso (não logou)',
    description:
      'Reforço enviado quando a usuária pagou o convite mas ainda não acessou a plataforma após 1 hora. Visual claro e assunto pessoal para melhorar a entrega.',
    trigger:
      'Disparado por rotina (cron) ~1h após o pagamento, se a usuária ainda não fez login.',
    subject: () => 'Vi que você ainda não entrou na sua conta',
    html: (v) =>
      lightLayout({
        previewText: 'Seu acesso ao Luna Privé já está pronto — é só entrar.',
        body: `
          ${lightHeading(`Falta só você entrar${v.name ? `, ${v.name}` : ''}`)}
          ${lightParagraph('Seu pagamento foi confirmado e a sua conta no Luna Privé já está ativa, mas notamos que você ainda não entrou na plataforma.')}
          ${lightParagraph('É só tocar no botão abaixo para fazer login e começar a usar tudo o que preparamos para você:')}
          ${lightButton('Entrar na minha conta', v.accessUrl || 'https://lunaprive.live/minha-conta')}
          ${lightParagraph(`Se o botão não funcionar, use este link:<br />${lightLink(v.accessUrl || 'https://lunaprive.live/minha-conta')}`)}
        `,
      }),
    text: (v) =>
      [
        `Falta só você entrar${v.name ? `, ${v.name}` : ''}`,
        '',
        'Seu pagamento foi confirmado e a sua conta no Luna Privé já está ativa, mas notamos que você ainda não entrou na plataforma.',
        '',
        'Faça login para começar a usar:',
        v.accessUrl || 'https://lunaprive.live/minha-conta',
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
      'Enviado quando a usuária solicita recuperação de senha. Contém um link seguro e temporário para criar uma nova senha. Enviado pela nossa marca via Resend.',
    trigger:
      'Disparado ao solicitar "Esqueceu sua senha?" — somente para contas com convite pago.',
    subject: () => 'Redefinição de senha da sua conta Luna Privé',
    html: (v) =>
      lightLayout({
        previewText: 'Use o link para criar uma nova senha da sua conta.',
        body: `
          ${lightHeading('Redefinir sua senha')}
          ${lightParagraph(`Olá${v.name ? `, ${v.name}` : ''}! Recebemos um pedido para redefinir a senha da sua conta no Luna Privé.`)}
          ${lightParagraph('Toque no botão abaixo para criar uma nova senha:')}
          ${lightButton('Criar nova senha', v.resetUrl || 'https://lunaprive.live/minha-conta')}
          ${lightParagraph(`Se o botão não funcionar, copie e cole este link no navegador:<br />${lightLink(v.resetUrl || 'https://lunaprive.live/minha-conta')}`)}
          ${lightParagraph('Por segurança, este link expira em breve e só pode ser usado uma vez. Se você não solicitou esta alteração, ignore este e-mail — sua senha atual continua a mesma.')}
        `,
      }),
    text: (v) =>
      [
        'Redefinir sua senha',
        '',
        `Olá${v.name ? `, ${v.name}` : ''}! Recebemos um pedido para redefinir a senha da sua conta no Luna Privé.`,
        '',
        'Use o link abaixo para criar uma nova senha:',
        v.resetUrl || 'https://lunaprive.live/minha-conta',
        '',
        'Por segurança, este link expira em breve e só pode ser usado uma vez. Se você não solicitou esta alteração, ignore este e-mail — sua senha atual continua a mesma.',
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
