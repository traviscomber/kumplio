import { ImageResponse } from 'next/og'

export const alt = 'Ley 21.719 — Preparación para diciembre de 2026'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Ley21719OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0a0a0a', color: '#ffffff', padding: '72px', fontFamily: 'sans-serif' }}>
      <div style={{ color: '#b8f542', fontSize: '30px', fontWeight: 700 }}>KUMPLIO · Chile</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ fontSize: '78px', lineHeight: 1, fontWeight: 800 }}>Ley 21.719</div>
        <div style={{ fontSize: '42px', lineHeight: 1.15, maxWidth: '950px' }}>Preparación para la nueva ley de protección de datos personales.</div>
      </div>
      <div style={{ fontSize: '27px', color: '#d0d0d0' }}>Entrada en vigencia: 1 de diciembre de 2026</div>
    </div>,
    size,
  )
}
