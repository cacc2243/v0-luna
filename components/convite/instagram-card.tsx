import { Instagram, Camera, Lock } from 'lucide-react'

export function InstagramCard() {
  return (
    <section aria-label="Instagram Luna Privé">
      <div className="luna-border overflow-hidden rounded-2xl bg-card/60 backdrop-blur-sm">
        <div className="flex flex-col gap-3 px-4 py-4">
          {/* Cabeçalho do perfil */}
          <div className="flex items-center gap-3">
            {/* Avatar com borda rosa (logo da bolinha) */}
            <span className="cta-gradient flex size-11 shrink-0 items-center justify-center rounded-full p-[2px]">
              <span className="flex size-full items-center justify-center rounded-full bg-background">
                <img
                  src="/images/luna-icon.png"
                  alt="Luna Privé"
                  className="size-8 rounded-full object-contain"
                />
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-foreground">Luna Privé</p>
              {/* Nome de usuário borrado */}
              <p
                className="select-none text-xs leading-tight text-muted-foreground blur-[3px]"
                aria-hidden="true"
              >
                @app.lunaprive
              </p>
            </div>

            <Instagram className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>

          {/* Texto do convite */}
          <p className="flex gap-2 text-pretty text-xs leading-relaxed text-muted-foreground">
            <Camera className="mt-0.5 size-4 shrink-0 text-foreground/70" aria-hidden="true" />
            <span>
              Siga-nos em nosso <span className="font-semibold text-foreground">Instagram!</span>{' '}
              Agora ele é privado e apenas usuárias com{' '}
              <span className="font-semibold text-foreground">CONVITES ATIVOS</span> podem seguir e
              acompanhar. Já são mais de{' '}
              <span className="font-semibold text-foreground">6 mil seguidoras!</span>
            </span>
          </p>

          {/* Barra bloqueada */}
          <div className="flex items-center gap-2 rounded-xl bg-background/50 px-3 py-2.5 ring-1 ring-border/50">
            <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground">
              Para seguir você precisa ter um convite Luna Privé
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
