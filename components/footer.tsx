'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-border">
      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand & Description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">K</span>
              </div>
              <span className="font-bold text-lg">KUMPLIO</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Plataforma IA integral para cumplimiento legal en Chile. 7 agentes expertos analizando, validando y optimizando tu cumplimiento 24/7.
            </p>
            <p className="text-xs text-muted-foreground font-semibold">Desarrollado por n3uralia.com</p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Producto</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/features/ley-21719" className="text-muted-foreground hover:text-primary transition">
                  Ley 21.719 Compliance
                </Link>
              </li>
              <li>
                <Link href="/features/documento-intelligence" className="text-muted-foreground hover:text-primary transition">
                  Document Intelligence
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-muted-foreground hover:text-primary transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/features/compliance-matrix" className="text-muted-foreground hover:text-primary transition">
                  Compliance Matrix
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="font-semibold mb-4">Solutions</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/demo/transporte" className="text-muted-foreground hover:text-primary transition">
                  Transporte
                </Link>
              </li>
              <li>
                <Link href="/demo/mineria" className="text-muted-foreground hover:text-primary transition">
                  Minería
                </Link>
              </li>
              <li>
                <Link href="/resources/cumplimiento-normativo" className="text-muted-foreground hover:text-primary transition">
                  Cumplimiento Normativo
                </Link>
              </li>
              <li>
                <Link href="/webinars" className="text-muted-foreground hover:text-primary transition">
                  Webinars
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/resources/ley-21719-guia" className="text-muted-foreground hover:text-primary transition">
                  Guía Ley 21.719
                </Link>
              </li>
              <li>
                <Link href="/resources/templates" className="text-muted-foreground hover:text-primary transition">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/resources/faq" className="text-muted-foreground hover:text-primary transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-muted-foreground hover:text-primary transition">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition">
                  Sobre N3uralia
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-primary transition">
                  Soporte
                </Link>
              </li>
              <li>
                <Link href="https://n3uralia.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition">
                  n3uralia.com
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* LLM/AI Agents Information */}
        <div className="border-t border-border mt-12 pt-12">
          <h3 className="font-semibold mb-6">Arquitectura IA & LLM</h3>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-muted/30 border border-muted/50">
              <p className="font-semibold text-primary mb-1">Is1dora</p>
              <p className="text-xs text-muted-foreground">Extracción de Documentos & Obligaciones</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted/50">
              <p className="font-semibold text-primary mb-1">R0drigo</p>
              <p className="text-xs text-muted-foreground">Cuantificación de Riesgo Regulatorio</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted/50">
              <p className="font-semibold text-primary mb-1">Jav1er</p>
              <p className="text-xs text-muted-foreground">Generación de Roadmaps Ejecutables</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted/50">
              <p className="font-semibold text-primary mb-1">Be4triz</p>
              <p className="text-xs text-muted-foreground">Monitoreo 24/7 de Cambios Regulatorios</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted/50">
              <p className="font-semibold text-primary mb-1">Ver0nica</p>
              <p className="text-xs text-muted-foreground">Auditoría de Compliance Real</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted/50">
              <p className="font-semibold text-primary mb-1">Andr3s</p>
              <p className="text-xs text-muted-foreground">Análisis de Datos Regulatorios</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border border-muted/50">
              <p className="font-semibold text-primary mb-1">Cat4lina</p>
              <p className="text-xs text-muted-foreground">Validación Legal & Generación de Reportes</p>
            </div>
          </div>
        </div>

        {/* Regional Coverage */}
        <div className="border-t border-border mt-12 pt-12">
          <h3 className="font-semibold mb-4">Cobertura Regional Chile</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-muted-foreground">
            <p>Región de Arica y Parinacota</p>
            <p>Región de Tarapacá</p>
            <p>Región de Antofagasta</p>
            <p>Región de Atacama</p>
            <p>Región de Coquimbo</p>
            <p>Región de Valparaíso</p>
            <p>Región Metropolitana</p>
            <p>Región del Libertador</p>
            <p>Región del Bío-Bío</p>
            <p>Región de La Araucanía</p>
            <p>Región de Los Ríos</p>
            <p>Región de Los Lagos</p>
            <p>Región de Aysén</p>
            <p>Región de Magallanes</p>
            <p>Región de Ñuble</p>
          </div>
        </div>

        {/* Contact & Social */}
        <div className="border-t border-border mt-12 pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Contacto</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href="mailto:info@kumplio.app" className="text-muted-foreground hover:text-primary transition">
                    info@kumplio.app
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-primary" />
                  <a href="tel:+56993826127" className="text-muted-foreground hover:text-primary transition">
                    +56 9 9382-6127
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">Santiago, Chile</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Síguenos</h3>
              <div className="flex gap-6 text-sm">
                <a href="https://linkedin.com/company/n3uralia" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition">
                  LinkedIn
                </a>
                <a href="https://x.com/n3uralia" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition">
                  X
                </a>
                <a href="https://github.com/n3uralia" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border bg-muted/30">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>&copy; {currentYear} KUMPLIO by n3uralia.com. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-primary transition">
                Privacidad
              </Link>
              <Link href="/terms" className="hover:text-primary transition">
                Términos
              </Link>
              <Link href="/security" className="hover:text-primary transition">
                Seguridad
              </Link>
              <Link href="/compliance-statement" className="hover:text-primary transition">
                Cumplimiento
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
