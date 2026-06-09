'use client'

import { useEffect, useState } from 'react'

const techs = [
  { name: 'OpenAI', logo: '🔮' },
  { name: 'Supabase', logo: '🟢' },
  { name: 'Vercel', logo: '⚫' },
  { name: 'Node.js', logo: '💚' },
  { name: 'Cloudflare', logo: '🟠' },
  { name: 'PostgreSQL', logo: '🐘' },
  { name: 'TypeScript', logo: '🔵' },
  { name: 'React', logo: '⚛️' },
  { name: 'Next.js', logo: '▲' },
  { name: 'Tailwind', logo: '💨' },
]

export function TechStackCarousel() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
                <span className="text-3xl">{tech.logo}</span>
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
