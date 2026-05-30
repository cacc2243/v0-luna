'use client'

import { useMemo, useState } from 'react'
import {
  User,
  Mail,
  Lock,
  Phone,
  KeyRound,
  Eye,
  EyeOff,
  ShieldCheck,
  Lightbulb,
  ChevronDown,
  Check,
  Loader2,
} from 'lucide-react'
import { CtaButton } from '@/components/cta-button'
import { cn } from '@/lib/utils'

interface SignupFlowProps {
  onComplete: () => void
}

const TOTAL = 6

const pixOptions = ['CPF', 'CNPJ', 'Telefone', 'Email', 'Chave Aleatória']

export function SignupFlow({ onComplete }: SignupFlowProps) {
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<'form' | 'loading' | 'success' | 'invite'>('form')

  // Campos
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [pixType, setPixType] = useState('CPF')
  const [pixKey, setPixKey] = useState('')

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pixOpen, setPixOpen] = useState(false)

  const back = () => setStep((s) => Math.max(0, s - 1))
  const advance = () => setStep((s) => Math.min(TOTAL - 1, s + 1))

  const finish = () => {
    setStatus('loading')
    setTimeout(() => setStatus('success'), 2200)
  }

  // Validação por etapa
  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return username.trim().length >= 3
      case 1:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      case 2:
        return password.length >= 6
      case 3:
        return confirm.length >= 6 && confirm === password
      case 4:
        return phone.replace(/\D/g, '').length >= 10
      case 5:
        return pixKey.trim().length >= 3
      default:
        return false
    }
  }, [step, username, email, password, confirm, phone, pixKey])

  return (
    <div className="absolute inset-0 z-[60] flex flex-col">
      {/* App opaco ao fundo */}
      <div className="absolute inset-0 bg-background/88 backdrop-blur-[3px]" aria-hidden="true" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-6">
        {status === 'invite' ? (
          <InviteCard onAccept={onComplete} />
        ) : status === 'success' ? (
          <SuccessCard username={username} onContinue={() => setStatus('invite')} />
        ) : status === 'loading' ? (
          <LoadingCard />
        ) : (
          <div
            key={step}
            className="animate-pop luna-border w-full max-w-sm overflow-hidden rounded-3xl bg-card p-6 shadow-2xl shadow-primary/15"
          >
            {/* Progresso */}
            <div className="mb-6 flex items-center gap-1.5" aria-hidden="true">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-300',
                    i === step
                      ? 'luna-gradient'
                      : i < step
                        ? 'bg-primary/50'
                        : 'bg-muted',
                  )}
                />
              ))}
            </div>

            {/* NOME DE USUÁRIO */}
            {step === 0 && (
              <StepShell
                icon={User}
                eyebrow="Nome de usuário"
                title="Escolha o nome que você quiser"
                description="Este nome ficará à mostra para seus clientes."
              >
                <PrefixInput
                  prefix="@"
                  value={username}
                  onChange={(v) => setUsername(v.replace(/\s/g, '').toLowerCase())}
                  placeholder="seu_nome"
                  autoFocus
                />
                <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-primary/10 px-3.5 py-3">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-pretty text-[0.72rem] leading-relaxed text-foreground">
                    Dica: use algo mais criativo, como{' '}
                    <span className="font-semibold text-primary">@{username || 'seu_nome'}_oficial</span> ou{' '}
                    <span className="font-semibold text-primary">@{username || 'seu_nome'}_real</span>.
                  </p>
                </div>
                <CtaButton className="mt-6" disabled={!canContinue} onClick={advance}>
                  Continuar
                </CtaButton>
              </StepShell>
            )}

            {/* SEU EMAIL */}
            {step === 1 && (
              <StepShell
                icon={Mail}
                eyebrow="Seu email"
                title="Apenas para cadastro interno"
                description="Será necessário confirmar seu email posteriormente."
              >
                <SafetyNote>Sigilo total do seu email garantido</SafetyNote>
                <BaseInput
                  type="email"
                  inputMode="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="seu@email.com"
                  autoFocus
                />
                <StepFooter onBack={back} disabled={!canContinue} onNext={advance} />
              </StepShell>
            )}

            {/* CRIE UMA SENHA */}
            {step === 2 && (
              <StepShell
                icon={Lock}
                eyebrow="Crie uma senha"
                title="Proteja sua conta"
                description="Mínimo de 6 dígitos para sua segurança."
              >
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  show={showPass}
                  onToggle={() => setShowPass((s) => !s)}
                  placeholder="••••••"
                  autoFocus
                />
                <StepFooter onBack={back} disabled={!canContinue} onNext={advance} />
              </StepShell>
            )}

            {/* CONFIRME SUA SENHA */}
            {step === 3 && (
              <StepShell
                icon={Lock}
                eyebrow="Confirme sua senha"
                title="Quase lá"
                description="Digite novamente para confirmar."
              >
                <PasswordInput
                  value={confirm}
                  onChange={setConfirm}
                  show={showConfirm}
                  onToggle={() => setShowConfirm((s) => !s)}
                  placeholder="••••••"
                  autoFocus
                />
                {confirm.length > 0 && confirm !== password && (
                  <p className="mt-2 text-xs font-medium text-destructive">
                    As senhas não coincidem.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConfirm('')
                    setStep(2)
                  }}
                  className="mt-2.5 text-xs font-medium text-primary transition-opacity hover:opacity-80"
                >
                  ← Voltar e alterar senha
                </button>
                <StepFooter onBack={back} disabled={!canContinue} onNext={advance} />
              </StepShell>
            )}

            {/* SEU TELEFONE */}
            {step === 4 && (
              <StepShell
                icon={Phone}
                eyebrow="Seu telefone"
                title="Informe seu número com DDD"
                description="Usado apenas para envio de confirmações ou para você tirar dúvidas. Seu número nunca será compartilhado."
              >
                <SafetyNote>Visível apenas para nossa plataforma</SafetyNote>
                <BaseInput
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(v) => setPhone(formatPhone(v))}
                  placeholder="(00) 00000-0000"
                  autoFocus
                />
                <StepFooter onBack={back} disabled={!canContinue} onNext={advance} />
              </StepShell>
            )}

            {/* CHAVE PIX */}
            {step === 5 && (
              <StepShell
                icon={KeyRound}
                eyebrow="Chave PIX"
                title="Onde você quer receber?"
                description="Informe a chave PIX onde você irá receber as transferências do Luna Privé."
                iconPositive
              >
                {/* Dropdown tipo de chave */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setPixOpen((o) => !o)}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-secondary/60 px-4 py-3.5 text-left text-base text-foreground"
                  >
                    {pixType}
                    <ChevronDown
                      className={cn(
                        'size-4 text-muted-foreground transition-transform',
                        pixOpen && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {pixOpen && (
                    <ul className="luna-border absolute left-0 right-0 top-full z-10 mt-2 overflow-hidden rounded-2xl bg-popover py-1 shadow-2xl">
                      {pixOptions.map((opt) => (
                        <li key={opt}>
                          <button
                            type="button"
                            onClick={() => {
                              setPixType(opt)
                              setPixKey('')
                              setPixOpen(false)
                            }}
                            className={cn(
                              'flex w-full items-center justify-between px-4 py-3 text-left text-base transition-colors',
                              opt === pixType
                                ? 'bg-primary/15 font-semibold text-primary'
                                : 'text-foreground hover:bg-secondary/60',
                            )}
                          >
                            {opt}
                            {opt === pixType && <Check className="size-4" aria-hidden="true" />}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3">
                  <BaseInput
                    value={pixKey}
                    onChange={setPixKey}
                    inputMode={pixType === 'CPF' || pixType === 'CNPJ' ? 'numeric' : 'text'}
                    placeholder={pixPlaceholder(pixType)}
                  />
                </div>

                <CtaButton className="mt-6" disabled={!canContinue} onClick={finish}>
                  Finalizar cadastro
                </CtaButton>
                <button
                  type="button"
                  onClick={back}
                  className="mt-3 w-full text-center text-xs font-medium text-muted-foreground transition-opacity hover:opacity-80"
                >
                  ← Voltar para o passo anterior
                </button>
              </StepShell>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Subcomponentes ---------- */

function StepShell({
  icon: Icon,
  eyebrow,
  title,
  description,
  iconPositive,
  children,
}: {
  icon: typeof User
  eyebrow: string
  title: string
  description: string
  iconPositive?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <span
        className={cn(
          'flex size-12 items-center justify-center rounded-2xl',
          iconPositive ? 'bg-positive/15' : 'bg-primary/15',
        )}
      >
        <Icon
          className={cn('size-6', iconPositive ? 'text-positive' : 'text-primary')}
          aria-hidden="true"
        />
      </span>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-1.5 text-balance text-xl font-bold leading-tight text-foreground">
        {title}
      </h2>
      <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-5">{children}</div>
    </div>
  )
}

const inputBase =
  'w-full rounded-2xl border border-border bg-secondary/60 px-4 py-3.5 text-base text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/20'

function BaseInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  inputMode?: 'text' | 'email' | 'tel' | 'numeric'
  autoFocus?: boolean
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputBase}
    />
  )
}

function PrefixInput({
  prefix,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  prefix: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <div className="flex items-center rounded-2xl border border-border bg-secondary/60 px-4 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
      <span className="mr-1 text-base font-semibold text-primary">{prefix}</span>
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-3.5 text-base text-foreground placeholder:text-muted-foreground/70 outline-none"
      />
    </div>
  )
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
  placeholder?: string
  autoFocus?: boolean
}) {
  return (
    <div className="flex items-center rounded-2xl border border-border bg-secondary/60 px-4 transition-colors focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent py-3.5 text-base text-foreground placeholder:text-muted-foreground/70 outline-none"
      />
      <button
        type="button"
        onClick={onToggle}
        className="ml-2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>
    </div>
  )
}

function SafetyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-positive">
      <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  )
}

function StepFooter({
  onBack,
  onNext,
  disabled,
}: {
  onBack: () => void
  onNext: () => void
  disabled: boolean
}) {
  return (
    <>
      <CtaButton className="mt-6" disabled={disabled} onClick={onNext}>
        Continuar
      </CtaButton>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 w-full text-center text-xs font-medium text-muted-foreground transition-opacity hover:opacity-80"
      >
        ← Voltar para o passo anterior
      </button>
    </>
  )
}

function LoadingCard() {
  return (
    <div className="animate-pop luna-border flex w-full max-w-sm flex-col items-center rounded-3xl bg-card px-6 py-10 text-center shadow-2xl shadow-primary/15">
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden="true" />
      <p className="mt-5 text-lg font-bold text-foreground">Criando sua conta...</p>
      <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
        Estamos preparando tudo para você começar a vender.
      </p>
    </div>
  )
}

function SuccessCard({
  username,
  onContinue,
}: {
  username: string
  onContinue: () => void
}) {
  return (
    <div className="animate-pop luna-border w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/20 ring-1 ring-primary/10">
      {/* Topo com a logo da Luna */}
      <div className="flex items-center justify-center border-b border-border/60 bg-secondary/40 px-6 py-4">
        <img src="/images/luna-prive-logo.png" alt="Luna Privé" className="h-7 w-auto" />
      </div>

      {/* Mentora falando */}
      <div className="px-5 py-6">
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            <img
              src="/images/mentor.png"
              alt="Mentora do Luna Privé"
              className="size-14 rounded-full border-2 border-primary/50 object-cover"
            />
            <span
              className="absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full border-2 border-card bg-positive"
              aria-hidden="true"
            >
              <Check className="size-3 text-white" />
            </span>
          </div>
          <div className="flex-1">
            <p className="text-base font-bold leading-tight text-foreground">
              Conta criada com sucesso!
            </p>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
              Seja bem-vinda ao <span className="font-semibold text-foreground">Luna Privé</span>,{' '}
              <span className="font-semibold text-primary">@{username || 'sua_conta'}</span>! Falta
              só um último passo e você já começa a faturar.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <CtaButton onClick={onContinue}>Continuar</CtaButton>
        </div>
      </div>
    </div>
  )
}

function InviteCard({ onAccept }: { onAccept: () => void }) {
  return (
    <div className="animate-pop luna-border w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/20">
      {/* Mulher falando */}
      <div className="flex flex-col items-center px-6 pt-8">
        <div className="relative">
          <span className="absolute -inset-1.5 rounded-full luna-gradient opacity-70 blur-lg" aria-hidden="true" />
          <img
            src="/images/mentor.png"
            alt="Mentora do Luna Privé"
            className="relative size-40 rounded-full border-2 border-primary/60 object-cover"
          />
          <span className="absolute bottom-2 right-2 size-5 rounded-full border-2 border-card bg-positive" aria-hidden="true" />
        </div>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Meus parabéns!
        </p>
      </div>

      {/* Balão de fala */}
      <div className="px-6 pb-8 pt-5">
        <div className="rounded-2xl border border-border bg-secondary/50 p-5 text-pretty text-base leading-relaxed text-foreground">
          <p>
            Sua conta foi criada com{' '}
            <span className="font-semibold text-positive">sucesso!</span> Agora chegou a hora do seu{' '}
            <span className="font-semibold text-primary">Convite de Acesso ao Luna Privé</span>.
          </p>
          <p className="mt-3">
            Ele garante que você é uma usuária <span className="font-semibold">real e comprometida</span> aqui dentro.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Os convites de acesso gratuitos foram removidos do Luna, mas o investimento para o seu
            acesso está muito barato e confiável.
          </p>
        </div>

        <div className="mt-6">
          <CtaButton onClick={onAccept}>Quero um Convite</CtaButton>
        </div>
      </div>
    </div>
  )
}

/* ---------- Helpers ---------- */

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function pixPlaceholder(type: string) {
  switch (type) {
    case 'CPF':
      return '000.000.000-00'
    case 'CNPJ':
      return '00.000.000/0000-00'
    case 'Telefone':
      return '(00) 00000-0000'
    case 'Email':
      return 'seu@email.com'
    default:
      return 'sua chave aleatória'
  }
}
