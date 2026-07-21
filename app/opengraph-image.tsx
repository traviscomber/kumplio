import { ImageResponse } from 'next/og'

export const alt = 'KUMPLIO — Cumplimiento continuo y evidencia auditable'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0a0a0a', color: '#ffffff', padding: '72px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '70px', height: '70px', borderRadius: '50%', border: '5px solid #b8f542', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8f542', fontSize: '34px', fontWeight: 800 }}>K</div>
        <div style={{ fontSize: '38px', fontWeight: 800 }}>KUMPLIO</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ fontSize: '68px', lineHeight: 1.05, fontWeight: 800, maxWidth: '980px' }}>Cumplimiento continuo con evidencia auditable.</div>
        <div style={{ fontSize: '28px', color: '#c7c7c7' }}>Obligaciones · Controles · Evidencia · Hallazgos · Acciones</div>
      </div>
      <div style={{ color: '#b8f542', fontSize: '24px' }}>kumplio.app · Chile</div>
    </div>,
    size,
  )
}
