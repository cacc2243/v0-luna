export function PageBackground({
  grayscale = false,
  darken = false,
}: {
  grayscale?: boolean
  darken?: boolean
}) {
  return (
    <div className="fixed inset-0 z-0">
      <img
        src="/images/background.png"
        alt=""
        className={`size-full object-cover ${grayscale ? 'grayscale' : ''}`}
      />
      {/* Readability overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/25 to-background/80" />
      <div className={`absolute inset-0 ${darken ? 'bg-background/70' : 'bg-background/10'}`} />
    </div>
  )
}
