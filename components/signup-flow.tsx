'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
  AlertCircle,
} from 'lucide-react'
import { CtaButton } from '@/components/cta-button'
import { cn } from '@/lib/utils'

interface SignupFlowProps {
  onComplete: () => void
}

const TOTAL = 6

const pixOptions = ['CPF', 'CNPJ', 'Telefone', 'Email', 'Chave Aleatoria']

export function SignupFlow({ onComplete }: SignupFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<'form' | 'loading' | 'invite' | 'error'>('form')
  const [errorMessage, setErrorMessage] = useState('')

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

  const finish = async () => {
    setStatus('loading')
    setErrorMessage('')
    
    try {
      const supabase = createClient()
      
      // Criar usuario no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            username: username.trim(),
            display_name: username.trim(),
            phone: phone.replace(/\D/g, ''),
            pix_type: pixType,
            pix_key: pixKey.trim(),
            is_creator: true,
          },
        },
      })
      
      if (error) {
        console.error('[v0] Supabase signup error:', error)
        // Traduzir mensagens de erro comuns
        let msg = error.message
        if (error.message.includes('User already registered')) {
          msg = 'Este email ja esta cadastrado. Tente fazer login.'
        } else if (error.message.includes('rate limit') || error.message.includes('too many')) {
          msg = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.'
        } else if (error.message.includes('is invalid') || error.message.includes('Invalid email')) {
          msg = 'Use um email real e valido. Emails inventados nao funcionam.'
        } else if (error.message.includes('Password')) {
          msg = 'Senha deve ter pelo menos 6 caracteres.'
        } else if (error.message.includes('email')) {
          msg = 'Erro com o email. Verifique se esta correto.'
        }
        setErrorMessage(msg)
        setStatus('error')
        return
      }
      
      if (!data.user) {
        setErrorMessage('Erro ao criar conta. Tente novamente.')
        setStatus('error')
        return
      }
      
      // Atualizar o perfil com dados adicionais (phone e pix)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: phone.replace(/\D/g, ''),
          pix_type: pixType,
          pix_key: pixKey.trim(),
        })
        .eq('id', data.user.id)
      
      if (profileError) {
        console.error('[v0] Profile update error:', profileError)
        // Nao bloquear - o trigger ja criou o perfil basico
      }
      
      // Salvar dados no sessionStorage para a pagina de convite
      try {
        sessionStorage.setItem(
          'luna_signup',
          JSON.stringify({ username, email, pixType, pixKey }),
        )
      } catch {
        // ignore storage errors
      }
      
      setStatus('invite')
    } catch (err) {
      console.error('[v0] Signup error:', err)
      setErrorMessage('Erro inesperado. Tente novamente.')
      setStatus('error')
    }
  }

  const goToConvite = () => {
    onComplete()
    router.push('/convite')
  }
  
  const goToMinhaConta = () => {
    onComplete()
    router.push('/minha-conta')
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
            <InviteCard onAccept={goToConvite} onSkip={goToMinhaConta} />
          ) : status === 'error' ? (
            <ErrorCard message={errorMessage} onRetry={() => setStatus('form')} />
          ) : status === 'loading' ? (
          <LoadingCard />
        ) : (
          <div
            key={step}
            className="animate-pop luna-border w-full max-w-sm overflow-hidden rounded-3xl bg-card p-7 shadow-2xl shadow-primary/15"
          >
            {/* Progresso */}
            <div className="mb-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Passo {step + 1} de {TOTAL}
                </span>
                <span className="text-[0.7rem] font-bold tabular-nums text-primary">
                  {Math.round(((step + 1) / TOTAL) * 100)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <div
                  className="h-full rounded-full luna-gradient transition-all duration-500 ease-out"
                  style={{ width: `${((step + 1) / TOTAL) * 100}%` }}
                />
              </div>
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
                    onChange={(v) => setPixKey(formatPixKey(pixType, v))}
                    inputMode={
                      pixType === 'CPF' || pixType === 'CNPJ' || pixType === 'Telefone'
                        ? 'numeric'
                        : pixType === 'Email'
                          ? 'email'
                          : 'text'
                    }
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
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-xl',
            iconPositive ? 'bg-positive/15' : 'bg-primary/15',
          )}
        >
          <Icon
            className={cn('size-[1.1rem]', iconPositive ? 'text-positive' : 'text-primary')}
            aria-hidden="true"
          />
        </span>
        <p
          className={cn(
            'text-[0.7rem] font-bold uppercase tracking-[0.16em]',
            iconPositive ? 'text-positive' : 'text-primary',
          )}
        >
          {eyebrow}
        </p>
      </div>
      <h2 className="mt-3.5 text-balance text-[1.35rem] font-bold leading-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
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
        Estamos preparando tudo para voce comecar a vender.
      </p>
    </div>
  )
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="animate-pop luna-border flex w-full max-w-sm flex-col items-center rounded-3xl bg-card px-6 py-10 text-center shadow-2xl shadow-primary/15">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/15">
        <AlertCircle className="size-7 text-destructive" aria-hidden="true" />
      </div>
      <p className="mt-5 text-lg font-bold text-foreground">Ops! Algo deu errado</p>
      <p className="mt-1.5 text-pretty text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
      <CtaButton className="mt-6" onClick={onRetry}>
        Tentar novamente
      </CtaButton>
    </div>
  )
}

function InviteCard({ onAccept, onSkip }: { onAccept: () => void; onSkip: () => void }) {
  return (
    <div className="animate-pop luna-border w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/20">
      {/* Mulher falando */}
      <div className="flex flex-col items-center px-6 pt-8">
        <div className="relative">
          <span className="absolute -inset-1.5 rounded-full luna-gradient opacity-70 blur-lg" aria-hidden="true" />
          <img
            src="/images/mentor.png"
            alt="Mentora do Luna Prive"
            className="relative size-28 rounded-full border-2 border-primary/60 object-cover"
          />
          <span className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-card bg-positive" aria-hidden="true" />
        </div>
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-primary">
          Meus parabens!
        </p>
      </div>

      {/* Balao de fala */}
      <div className="px-6 pb-8 pt-5">
        <div className="rounded-2xl border border-border bg-secondary/50 p-5 text-pretty text-base leading-relaxed text-foreground">
          <p>
            Sua conta foi criada com{' '}
            <span className="font-semibold text-positive">sucesso!</span> Agora chegou a hora do seu{' '}
            <span className="font-semibold text-primary">Convite de Acesso ao Luna Prive</span>.
          </p>
          <p className="mt-3">
            Ele garante que voce e uma usuaria <span className="font-semibold">real e comprometida</span> aqui dentro.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Os convites de acesso gratuitos foram removidos do Luna, mas o investimento para o seu
            acesso esta muito barato e confiavel.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <CtaButton onClick={onAccept}>Quero um Convite</CtaButton>
          <button
            type="button"
            onClick={onSkip}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pular e ir para minha conta
          </button>
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

function formatPixKey(type: string, value: string) {
  switch (type) {
    case 'CPF': {
      const d = value.replace(/\D/g, '').slice(0, 11)
      if (d.length <= 3) return d
      if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
      if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
      return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    }
    case 'CNPJ': {
      const d = value.replace(/\D/g, '').slice(0, 14)
      if (d.length <= 2) return d
      if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`
      if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`
      if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`
      return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
    }
    case 'Telefone':
      return formatPhone(value)
    case 'Email':
      // remove espaços, mantém o resto livre
      return value.replace(/\s/g, '')
    default:
      // Chave aleatória — texto livre
      return value
  }
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
