'use client'

const techs = [
  { name: 'OpenAI', logo: '/logos/openai.svg', invert: false },
  { name: 'Supabase', logo: '/logos/supabase.svg', invert: false },
  { name: 'Vercel', logo: '/logos/vercel.svg', invert: false },
  { name: 'Node.js', logo: '/logos/nodedotjs.svg', invert: false },
  { name: 'Cloudflare', logo: '/logos/cloudflare.svg', invert: false },
  { name: 'PostgreSQL', logo: '/logos/postgresql.svg', invert: false },
  { name: 'TypeScript', logo: '/logos/typescript.svg', invert: false },
  { name: 'React', logo: '/logos/react.svg', invert: false },
  { name: 'Next.js', logo: '/logos/nextdotjs.svg', invert: true },
  { name: 'Tailwind', logo: '/logos/tailwind-css.svg', invert: false },
]

export function TechStackCarousel() {
  // Duplicate techs for seamless loop
  const displayTechs = [...techs, ...techs]

  return (
    <div className="w-full overflow-hidden py-16 px-6 border-t border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-muted-foreground text-sm font-semibold uppercase tracking-widest">
            Tecnología de punta
          </p>
        </div>

        <div className="relative overflow-hidden">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-background to-transparent" />

          {/* Carousel */}
          <div className="flex gap-8 animate-scroll">
            {displayTechs.map((tech, i) => (
              <div
                key={`${tech.name}-${i}`}
                className="flex items-center justify-center gap-3 whitespace-nowrap px-8 py-4 rounded-lg border border-border/50 bg-card/30 hover:bg-card/60 transition-colors duration-300 hover:border-primary/50 flex-shrink-0"
              >
                <img
                  src={tech.logo || "/placeholder.svg"}
                  alt={tech.name}
                  className="w-6 h-6 opacity-90 hover:opacity-100 transition-opacity"
                  style={tech.invert ? { filter: 'brightness(0) invert(1)' } : undefined}
                  loading="lazy"
                />
                <span className="font-semibold text-foreground text-sm">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Infraestructura cloud-native, segura y escalable para cumplimiento en tiempo real
        </p>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-50% - 1rem));
          }
        }

        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
