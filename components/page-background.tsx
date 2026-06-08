export function PageBackground() {
  return (
    <div className="fixed inset-0 z-0">
      <img
        src="/images/background.png"
        alt=""
        className="size-full object-cover"
      />
      {/* Readability overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/35 to-background/85" />
      <div className="absolute inset-0 bg-background/10" />
    </div>
  )
}
