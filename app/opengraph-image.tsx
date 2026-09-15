import { ImageResponse } from 'next/og'

export const alt = 'Kumplio — Sistema operativo de cumplimiento · Compliance operating system for Chile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: '#171715',
        color: '#C2A887',
        padding: '72px',
        fontFamily: 'sans-serif',
        border: '1px solid #393833',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '70px',
              height: '70px',
              borderRadius: '6px',
              border: '1px solid #B17A4D',
              background: '#20201D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#A7C63A',
              fontSize: '34px',
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ fontSize: '38px', fontWeight: 700, letterSpacing: '-0.02em' }}>KUMPLIO</div>
        </div>
        <div style={{ fontSize: '18px', color: '#8F8678' }}>powered by n3uralia</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <div style={{ fontSize: '24px', color: '#B17A4D', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Sistema operativo de cumplimiento
        </div>
        <div style={{ fontSize: '68px', lineHeight: 1.02, fontWeight: 400, maxWidth: '980px', letterSpacing: '-0.04em' }}>
          Cumplir. Sin perseguir documentos.
        </div>
        <div style={{ fontSize: '25px', color: '#AAA69C' }}>
          Personas · Documentos · Requisitos · Evidencia
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '21px' }}>
        <span style={{ color: '#A7C63A' }}>Entiende · Resuelve · Demuestra</span>
        <span style={{ color: '#8F8678' }}>kumplio.app · Chile</span>
      </div>
    </div>,
    size,
  )
}
