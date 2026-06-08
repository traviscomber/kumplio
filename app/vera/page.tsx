'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Loader2, Send, AlertCircle, Check } from 'lucide-react'

export default function VeraChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/vera-chat',
    }),
    onError: (error) => {
      console.error('[Chat Error]', error)
    },
  })

  const [systemReady, setSystemReady] = useState(true)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-bold text-primary">V</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold">Vera - Asistente de Cumplimiento</h1>
                <p className="text-sm text-muted-foreground">
                  Respuestas 24/7 sobre Ley 21.719 y protección de datos en Chile
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="grid gap-6">
          {/* Messages */}
          <div className="space-y-4 rounded-lg border border-border bg-card p-6" style={{ height: '500px', overflowY: 'auto' }}>
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center space-y-4 py-8 text-center">
                <div className="text-4xl">💬</div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">¡Hola! Soy Vera</h2>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Puedo ayudarte con preguntas sobre Ley 21.719, cumplimiento de datos, obligaciones legales,
                    riesgos y más. ¿Cuál es tu pregunta?
                  </p>
                </div>

                {/* Quick Question Suggestions */}
                <div className="grid gap-2 pt-4 w-full">
                  <p className="text-xs font-semibold text-muted-foreground">Preguntas de ejemplo:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      '¿Qué es el consentimiento informado?',
                      '¿Cuáles son las multas por incumplimiento?',
                      '¿Qué son los derechos ARCO+?',
                      '¿Cómo implementar seguridad de datos?',
                    ].map((question) => (
                      <button
                        key={question}
                        onClick={() => {
                          handleInputChange({ target: { value: question } } as any)
                        }}
                        className="rounded-lg border border-border bg-muted/50 p-3 text-left text-sm hover:bg-muted transition"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground border border-border'
                    }`}
                  >
                    {/* Extract text from message parts */}
                    <div className="text-sm">
                      {message.parts?.map((part, idx) => {
                        if (part.type === 'text') {
                          return (
                            <div key={idx} className="whitespace-pre-wrap">
                              {part.text}
                            </div>
                          )
                        }
                        if (part.type === 'tool-call') {
                          return (
                            <div key={idx} className="text-xs opacity-75">
                              [Herramienta: {part.toolName}]
                            </div>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator */}
            {isLoading && status === 'streaming' && (
              <div className="flex gap-4 justify-start">
                <div className="flex gap-2 bg-muted rounded-lg px-4 py-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Vera está pensando...</span>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-2">
              {systemReady ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-muted-foreground">Sistema listo • Vera en línea</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span className="text-xs text-muted-foreground">Conectando...</span>
                </>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{messages.length} mensajes</span>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <Input
                value={input || ''}
                onChange={handleInputChange}
                placeholder="Pregunta sobre Ley 21.719, cumplimiento, obligaciones, riesgos..."
                className="flex-1"
                disabled={isLoading}
                autoFocus
              />
              <Button type="submit" disabled={isLoading || !(input && input.trim())} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Vera proporciona información general. Para asesoría legal específica, consulta un abogado especializado
              en protección de datos.
            </p>
          </form>

          {/* Feature Cards */}
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4 border border-border">
              <h3 className="font-semibold text-sm mb-2">✓ Vera puede ayudarte con:</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Requisitos de Ley 21.719</li>
                <li>• Derechos ARCO+ y cómo responder</li>
                <li>• Cálculo de multas y penalidades</li>
                <li>• Medidas de seguridad de datos</li>
                <li>• Checklists por industria</li>
              </ul>
            </Card>

            <Card className="p-4 border border-border">
              <h3 className="font-semibold text-sm mb-2">🔒 Información útil:</h3>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Ley 21.719 entró en vigencia: 1 enero 2023</li>
                <li>• Autoridad: SERNAC (Servicio de Protección)</li>
                <li>• Plazo respuesta ARCO+: 10 días hábiles</li>
                <li>• Reporte breaches: 72 horas</li>
                <li>• Multas graves: 500-2500 UTF (~$33M-$167M CLP)</li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
