export default function OnboardingDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Bienvenido a KUMPLIO, Mi Empresa!
          </h1>
          <p className="text-muted-foreground mt-1">Vamos a empezar analizando tus documentos</p>
        </div>
        
        <div className="space-y-8">
          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((step) => (
              <button
                key={step}
                className={`p-4 rounded-lg border-2 transition-all ${
                  step === 1
                    ? 'border-primary bg-primary/10 scale-110'
                    : step < 1
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-border bg-card'
                }`}
              >
                <div className="text-4xl font-bold text-primary mb-2">{step}</div>
                {step === 1 && <div className="text-lg font-semibold text-foreground">Paso Actual</div>}
              </button>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold text-primary mb-4">Paso 1</div>
              <h2 className="text-5xl font-bold text-foreground">Sube un documento</h2>
              <p className="text-lg text-muted-foreground">PDF, Word, Excel, PowerPoint</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">Tipos de documentos:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-foreground">
                    <span className="text-green-500">✓</span> Contratos
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <span className="text-green-500">✓</span> Políticas de privacidad
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <span className="text-green-500">✓</span> TDRs
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <span className="text-green-500">✓</span> Normativas
                  </li>
                </ul>
              </div>

              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  Pro Tip: Comienza con un contrato para ver cómo KUMPLIO analiza documentos
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button className="px-6 py-2 rounded-lg border border-border text-foreground hover:bg-accent" disabled>
              Anterior
            </button>
            <button className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
