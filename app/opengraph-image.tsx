import { ImageResponse } from 'next/og'

export const alt = 'Kumplio — Software de cumplimiento normativo en Chile, powered by n3uralia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#111723', color: '#ffffff', padding: '72px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '70px', height: '70px', borderRadius: '18px', background: '#b8f542', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111723', fontSize: '34px', fontWeight: 800 }}>K</div>
          <div style={{ fontSize: '38px', fontWeight: 800 }}>KUMPLIO</div>
        </div>
        <div style={{ fontSize: '18px', color: '#9aa4b5' }}>powered by n3uralia</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ fontSize: '64px', lineHeight: 1.05, fontWeight: 800, maxWidth: '1000px' }}>Cumplimiento normativo conectado con el trabajo real.</div>
        <div style={{ fontSize: '27px', color: '#c7ceda' }}>Fuentes · Obligaciones · Controles · Evidencia · Decisiones</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '22px' }}>
        <span style={{ color: '#b8f542' }}>kumplio.app</span>
        <span style={{ color: '#9aa4b5' }}>Chile</span>
      </div>
    </div>,
    size,
  )
}
