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

export type EmailTemplateId = 'account_created' | 'invite_pix' | 'invite_paid'

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
  /** Dados de exemplo para preview */
  sampleVars: EmailTemplateVars
}

/* -------------------------------------------------------------------------- */
/*  Layout base                                                                */
/* -------------------------------------------------------------------------- */

const BRAND = {
  bg: '#0a090c',
  card: '#161318',
  border: '#2a2630',
  text: '#f5f3f7',
  muted: '#9b95a3',
  primary: '#e84f7c',
  primaryDark: '#c23a64',
  positive: '#34d399',
}

function layout(opts: { previewText: string; body: string }): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <title>Luna Privé</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.bg};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${opts.previewText}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
            <!-- Header -->
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:700;letter-spacing:2px;color:${BRAND.text};">
                  LUNA <span style="color:${BRAND.primary};">PRIVÉ</span>
                </span>
              </td>
            </tr>
            <!-- Card -->
            <tr>
              <td style="background-color:${BRAND.card};border:1px solid ${BRAND.border};border-radius:20px;padding:32px 28px;">
                ${opts.body}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top:24px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.6;color:${BRAND.muted};">
                  Você recebeu este e-mail porque criou uma conta no Luna Privé.<br />
                  © ${new Date().getFullYear()} Luna Privé. Todos os direitos reservados.
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

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;font-weight:700;color:${BRAND.text};">${text}</h1>`
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND.muted};">${html}</p>`
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr>
      <td align="center" style="background-color:${BRAND.primary};border-radius:14px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`
}

function link(href: string, label?: string): string {
  return `<a href="${href}" target="_blank" style="color:${BRAND.primary};font-weight:700;text-decoration:underline;word-break:break-all;">${label || href}</a>`
}

function pixBox(code: string): string {
  return `<div style="margin:8px 0 16px;padding:14px 16px;background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:12px;">
    <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${BRAND.muted};">PIX copia e cola</p>
    <p style="margin:0;font-family:'Courier New',monospace;font-size:12px;line-height:1.5;word-break:break-all;color:${BRAND.text};">${code}</p>
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
    subject: () => 'Sua conta no Luna Privé foi criada 🎉',
    html: (v) =>
      layout({
        previewText: 'Bem-vinda ao Luna Privé! Sua conta foi criada com sucesso.',
        body: `
          ${heading('Bem-vinda ao Luna Privé!')}
          ${paragraph(`Olá${v.name ? `, <strong style="color:${BRAND.text};">${v.name}</strong>` : ''}! Sua conta foi criada com sucesso.`)}
          ${paragraph('Você está a um passo de fazer parte da plataforma. O próximo passo é garantir o seu <strong style="color:' + BRAND.text + ';">Convite de Acesso</strong>, que confirma que você é uma usuária real e comprometida.')}
          ${paragraph('Qualquer dúvida, é só responder este e-mail. Estamos com você. 💖')}
        `,
      }),
    sampleVars: { name: 'Mariana', email: 'mariana@email.com' },
  },

  invite_pix: {
    id: 'invite_pix',
    name: 'PIX do convite gerado',
    description:
      'Enviado quando o PIX do Convite de Acesso é gerado, com o código copia e cola.',
    trigger: 'Disparado quando o PIX do convite é gerado na página /convite.',
    subject: () => 'Seu PIX do Convite Luna está pronto!',
    html: (v) =>
      layout({
        previewText: 'Pague o PIX para liberar seu acesso ao Luna Privé.',
        body: `
          ${heading('Falta pouco para liberar seu acesso')}
          ${paragraph(`Geramos o PIX do seu Convite de Acesso${v.amount ? ` no valor de <strong style="color:${BRAND.text};">${v.amount}</strong>` : ''}. Use o código abaixo no app do seu banco para concluir.`)}
          ${v.pixCode ? pixBox(v.pixCode) : ''}
          ${paragraph('Assim que o pagamento for confirmado, enviamos um e-mail com o link de acesso à sua conta. O código expira em alguns minutos, então finalize o quanto antes.')}
          ${paragraph(`O seu código expirou? Toque em ${link('https://lunaprive.live/convite', 'lunaprive.live/convite')} para gerar um novo convite.`)}
        `,
      }),
    sampleVars: {
      name: 'Mariana',
      amount: 'R$ 24,80',
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
    subject: () => 'Bem-vinda ao Luna',
    html: (v) =>
      layout({
        previewText: 'Pagamento confirmado. Seu acesso ao Luna Privé está liberado!',
        body: `
          ${heading('Pagamento confirmado!')}
          ${paragraph(`Tudo certo${v.name ? `, <strong style="color:${BRAND.text};">${v.name}</strong>` : ''}! Recebemos o pagamento do seu Convite de Acesso e sua conta no Luna Privé está <strong style="color:${BRAND.positive};">liberada</strong>.`)}
          ${paragraph('Clique no botão abaixo para entrar e começar a usar a plataforma:')}
          ${button('Acessar minha conta', v.accessUrl || '#')}
          ${paragraph(`Se o botão não funcionar, toque no link abaixo para acessar:<br />${link(v.accessUrl || 'https://lunaprive.live/minha-conta')}`)}
        `,
      }),
    sampleVars: {
      name: 'Mariana',
      accessUrl: 'https://lunaprive.com/minha-conta',
    },
  },
}

export function getEmailTemplate(id: EmailTemplateId): EmailTemplate {
  return EMAIL_TEMPLATES[id]
}

export function listEmailTemplates(): EmailTemplate[] {
  return Object.values(EMAIL_TEMPLATES)
}
