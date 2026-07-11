'use client'

import { useState } from 'react'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'O que exatamente eu recebo ao adquirir o convite?',
    a: 'Você recebe seu Código de Convite Luna, que garante acesso completo e verificado à plataforma Luna Privé, além de todos os bônus inclusos: guias, comunidade VIP e materiais profissionais.',
  },
  {
    q: 'O pagamento é único ou tem mensalidade?',
    a: 'É um pagamento único via PIX. Não existe mensalidade nem cobrança recorrente — você paga uma vez e mantém seu acesso ativo à plataforma.',
  },
  {
    q: 'Em quanto tempo recebo meu acesso após pagar?',
    a: 'O acesso é liberado automaticamente assim que o pagamento via PIX é confirmado, normalmente em poucos minutos. Tudo é enviado para o e-mail cadastrado.',
  },
  {
    q: 'Meus dados ficam anônimos e seguros?',
    a: 'Sim. A plataforma é 100% anônima e sigilosa. Seus dados são protegidos e nunca compartilhados, garantindo total privacidade em cada etapa.',
  },
  {
    q: 'Existe alguma taxa além do valor do convite?',
    a: 'O convite é um valor único. Apenas nas movimentações futuras há taxas simbólicas: R$ 2,99 por solicitação de saque e R$ 0,90 por venda realizada.',
  },
  {
    q: 'E se eu tiver dúvidas depois de entrar?',
    a: 'Você conta com suporte exclusivo em todos os canais: WhatsApp, chat no site, e-mail e abertura de ticket, sempre com atendimento discreto e resposta rápida.',
  },
  {
    q: 'Existe garantia? Posso solicitar reembolso?',
    a: 'Você poderá solicitar o reembolso em até 30 dias, conforme previsto na legislação, desde que não tenha realizado nenhum saque na plataforma. Caso não efetue nenhuma venda nesse período, será possível solicitar a devolução integral do seu investimento.',
  },
] as const

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section aria-labelledby="faq" className="relative isolate">
      <div className="luna-border relative z-10 overflow-hidden rounded-3xl border border-border/50 bg-card px-5 py-5 shadow-2xl shadow-black/40">
        {/* Cabeçalho */}
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
            <HelpCircle className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id="faq"
              className="text-balance text-base font-bold leading-tight text-foreground"
            >
              Perguntas frequentes
            </h2>
            <p className="text-pretty text-xs leading-snug text-muted-foreground">
              Tudo o que você precisa saber antes de resgatar.
            </p>
          </div>
        </div>

        {/* Lista de perguntas */}
        <ul className="mt-4 flex flex-col gap-2">
          {FAQS.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <li
                key={item.q}
                className="overflow-hidden rounded-2xl border border-border/40 bg-background/40"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="text-sm font-semibold text-foreground">{item.q}</span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-primary transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-4 pb-3.5 text-pretty text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
