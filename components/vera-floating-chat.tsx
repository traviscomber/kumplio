'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageCircle, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Vera Floating Chat Widget
 * Appears on all pages, allows quick compliance questions
 * Opens in a floating panel (bottom-right)
 */
export function VeraFloatingChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, sendMessage, isLoading, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/vera-chat',
    }),
  })

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input?.trim?.()) return
    sendMessage({ text: input })
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-40 group"
        type="button"
        title="Abrir Vera"
      >
        <MessageCircle className="w-7 h-7 text-white" />
        <span className="absolute -top-2 -right-2 w-3 h-3 bg-accent rounded-full animate-pulse" />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 transition-all duration-300 origin-bottom-right',
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]',
      )}
    >
      {/* Chat Panel */}
      <div className="bg-background border border-border rounded-2xl shadow-2xl flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              Vera - Asistente IA
            </h3>
            <p className="text-xs text-muted-foreground">Pregunta sobre Ley 21.719</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:bg-muted rounded-md transition"
              type="button"
              title="Minimizar"
            >
              <span className="text-lg">_</span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-muted rounded-md transition"
              type="button"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        {!isMinimized && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Hola, soy Vera. Pregunta lo que necesites sobre cumplimiento de Ley 21.719
                  </p>
                  <div className="mt-4 space-y-2 w-full">
                    <button
                      onClick={() => {
                        const text = '¿Qué es el consentimiento informado?'
                        handleInputChange({ target: { value: text } } as any)
                        sendMessage({ text })
                      }}
                      className="w-full text-xs p-2 rounded bg-muted hover:bg-muted/80 transition text-left"
                    >
                      ¿Qué es el consentimiento?
                    </button>
                    <button
                      onClick={() => {
                        const text = '¿Cuáles son mis obligaciones?'
                        handleInputChange({ target: { value: text } } as any)
                        sendMessage({ text })
                      }}
                      className="w-full text-xs p-2 rounded bg-muted hover:bg-muted/80 transition text-left"
                    >
                      ¿Cuáles son mis obligaciones?
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex',
                        msg.role === 'user' ? 'justify-end' : 'justify-start',
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-xs rounded-lg p-3 text-sm',
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted text-foreground rounded-bl-none',
                        )}
                      >
                        {msg.role === 'assistant' && msg.parts ? (
                          msg.parts
                            .filter((p: any) => p.type === 'text')
                            .map((p: any, i: number) => (
                              <div key={i}>{p.text}</div>
                            ))
                        ) : (
                          <div>{msg.content}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 p-3 bg-muted rounded-lg w-fit">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="border-t border-border p-4 flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Tu pregunta..."
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                disabled={isLoading || !input?.trim?.()}
                className="h-10 w-10 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
