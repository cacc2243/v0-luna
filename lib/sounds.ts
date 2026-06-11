'use client'

// ─────────────────────────────────────────────────────────────────────────────
// Utilitário central de sons (Web Audio API).
// Sons leves e sintetizados — sem arquivos externos. Usado em todo o app:
// notificações, vendas (novo pedido / aceite), toque nas abas e chat.
//
// O AudioContext só é criado/retomado após uma interação do usuário (política
// de autoplay dos navegadores). Por isso expomos `primeSounds()` que deve ser
// chamado em um gesto (clique/toque) para liberar o áudio.
// ─────────────────────────────────────────────────────────────────────────────

type Ctx = AudioContext

let audioCtx: Ctx | null = null
let muted = false

function getCtx(): Ctx | null {
  if (typeof window === 'undefined') return null
  try {
    const Ctor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    if (!audioCtx) audioCtx = new Ctor()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

/** Libera o áudio em um gesto do usuário (clique/toque). Seguro chamar várias vezes. */
export function primeSounds() {
  const ctx = getCtx()
  if (ctx && ctx.state === 'suspended') void ctx.resume()
}

export function setSoundMuted(value: boolean) {
  muted = value
}

type Note = {
  freq: number
  start: number // segundos a partir de agora
  dur: number // segundos
  type?: OscillatorType
  gain?: number // pico de volume (0..1)
}

// Toca uma sequência de notas curtas com envelope suave.
function playNotes(notes: Note[], masterGain = 1) {
  if (muted) return
  const ctx = getCtx()
  if (!ctx) return

  const now = ctx.currentTime
  const master = ctx.createGain()
  master.gain.value = masterGain
  master.connect(ctx.destination)

  for (const n of notes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = n.type ?? 'sine'
    osc.frequency.value = n.freq
    const t0 = now + n.start
    const peak = n.gain ?? 1
    gain.gain.setValueAtTime(0, t0)
    gain.gain.linearRampToValueAtTime(peak, t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur)
    osc.connect(gain)
    gain.connect(master)
    osc.start(t0)
    osc.stop(t0 + n.dur + 0.02)
  }
}

// ── Sons individuais ─────────────────────────────────────────────────────────

/** Notificação (mesmo chime usado no /convite): dois tons cristalinos C6→E6. */
export function playNotification() {
  playNotes(
    [
      { freq: 1046.5, start: 0, dur: 0.28 },
      { freq: 1318.5, start: 0.09, dur: 0.34 },
    ],
    0.06,
  )
}

/** Nova venda a aceitar: chamada de atenção alegre, três tons ascendentes. */
export function playNewSale() {
  playNotes(
    [
      { freq: 880, start: 0, dur: 0.22 },
      { freq: 1174.7, start: 0.1, dur: 0.24 },
      { freq: 1567.98, start: 0.2, dur: 0.34 },
    ],
    0.07,
  )
}

/** Venda aceita / dinheiro creditado: "ca-ching" curto e satisfatório. */
export function playSaleAccepted() {
  playNotes(
    [
      { freq: 1318.5, start: 0, dur: 0.18 },
      { freq: 1975.5, start: 0.08, dur: 0.4 },
      { freq: 2637, start: 0.16, dur: 0.42 },
    ],
    0.06,
  )
}

/** Toque leve ao trocar de aba: um único "tick" suave e curto. */
export function playTabTap() {
  playNotes([{ freq: 660, start: 0, dur: 0.07, type: 'triangle' }], 0.018)
}

/** Sucesso/conquista: arpejo maior ascendente, alegre e suave (volume baixo). */
export function playSuccess() {
  playNotes(
    [
      { freq: 523.25, start: 0, dur: 0.26, type: 'triangle' },
      { freq: 659.25, start: 0.1, dur: 0.28, type: 'triangle' },
      { freq: 783.99, start: 0.2, dur: 0.3, type: 'triangle' },
      { freq: 1046.5, start: 0.32, dur: 0.5, type: 'triangle' },
    ],
    0.05,
  )
}

/** Enviar mensagem no chat: "pop" curto ascendente. */
export function playMessageSent() {
  playNotes(
    [
      { freq: 720, start: 0, dur: 0.08, type: 'triangle' },
      { freq: 960, start: 0.05, dur: 0.12, type: 'triangle' },
    ],
    0.045,
  )
}

/** Receber/responder mensagem no chat: "pop" curto descendente, mais suave. */
export function playMessageReceived() {
  playNotes(
    [
      { freq: 880, start: 0, dur: 0.1, type: 'sine' },
      { freq: 620, start: 0.06, dur: 0.14, type: 'sine' },
    ],
    0.045,
  )
}
