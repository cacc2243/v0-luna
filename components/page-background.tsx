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
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/35 to-background/85" />
      <div className={`absolute inset-0 ${darken ? 'bg-background/30' : 'bg-background/10'}`} />
    </div>
  )
}
