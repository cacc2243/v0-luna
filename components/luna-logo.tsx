export function LunaLogo() {
  return (
    <div className="flex flex-col items-center gap-1" aria-label="Luna Privé">
      <div className="relative flex items-center justify-center">
        {/* crescent moon mark */}
        <svg
          width="34"
          height="34"
          viewBox="0 0 34 34"
          fill="none"
          className="text-primary"
          aria-hidden="true"
        >
          <path
            d="M24.5 17a9 9 0 1 1-8.2-8.96A7 7 0 0 0 24.5 17Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
        </svg>
      </div>
      <div className="text-center leading-none">
        <p className="font-serif text-2xl tracking-[0.35em] text-foreground/95">
          LUNA
        </p>
        <p className="font-serif text-base italic tracking-[0.3em] text-foreground/80">
          PRIVÉ
        </p>
      </div>
    </div>
  )
}
