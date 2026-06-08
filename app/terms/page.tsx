export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Términos de Servicio</h1>
          <p className="text-lg text-muted-foreground">
            Última actualización: Junio 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Aceptación */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Aceptación de Términos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Al acceder y utilizar el sitio web y servicios de KUMPLIO by n3uralia (en adelante "el Servicio"), usted acepta estar obligado por estos Términos de Servicio. Si no acepta estos términos, no debe utilizar nuestro Servicio. Nos reservamos el derecho de modificar estos términos en cualquier momento notificándole.
            </p>
          </div>

          {/* Descripción del Servicio */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Descripción del Servicio</h2>
            <p className="text-muted-foreground leading-relaxed">
              KUMPLIO proporciona una plataforma basada en IA para análisis de cumplimiento normativo conforme a la Ley 21.719 sobre Consentimiento Informado en Chile. Esto incluye:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Análisis automático de documentos y políticas de privacidad</li>
              <li>Evaluación de cumplimiento normativo</li>
              <li>Dashboard de gestión de compliance</li>
              <li>Asesoramiento basado en IA (Vera)</li>
              <li>Reportes de vulnerabilidades y recomendaciones</li>
              <li>Acceso a herramientas de documentación</li>
            </ul>
          </div>

          {/* Elegibilidad */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Elegibilidad</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para utilizar nuestro Servicio, debe ser:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Mayor de 18 años o tener consentimiento de tutor legal</li>
              <li>Autorizado legalmente para formar contratos vinculantes en Chile</li>
              <li>Representante autorizado de una empresa/organización</li>
              <li>No estar restringido de utilizar servicios en línea bajo ley chilena</li>
            </ul>
          </div>

          {/* Cuenta de Usuario */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Cuenta de Usuario y Seguridad</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Al crear una cuenta, usted es responsable de:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Proporcionar información precisa y completa</li>
                <li>Mantener la confidencialidad de sus credenciales</li>
                <li>Todas las actividades realizadas bajo su cuenta</li>
                <li>Notificarnos inmediatamente de acceso no autorizado</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                No compartir su contraseña y mantener seguridad de su dispositivo. KUMPLIO no es responsable de acceso no autorizado causado por su negligencia.
              </p>
            </div>
          </div>

          {/* Licencia de Uso */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Licencia de Uso</h2>
            <p className="text-muted-foreground leading-relaxed">
              Le otorgamos una licencia limitada, no exclusiva, no transferible para acceder y utilizar el Servicio únicamente para los fines establecidos en su plan de suscripción. Usted NO puede:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Reproducir, modificar, distribuir o vender contenido</li>
              <li>Realizar ingeniería inversa o descompilar código</li>
              <li>Acceder no autorizado a sistemas (hacking)</li>
              <li>Usar para actividades ilegales o fraudulentas</li>
              <li>Compartir credenciales con terceros no autorizados</li>
              <li>Cargar malware, virus o contenido dañino</li>
            </ul>
          </div>

          {/* Contenido del Usuario */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Contenido del Usuario</h2>
            <p className="text-muted-foreground leading-relaxed">
              Al cargar documentos y contenido a través del Servicio:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Declara tener todos los derechos necesarios</li>
              <li>Nos otorga licencia para procesar, analizar y almacenar</li>
              <li>Aceptar que usemos contenido para mejorar IA (anonimizado)</li>
              <li>Es responsable del cumplimiento legal de contenido</li>
              <li>Indemniza a KUMPLIO de reclamaciones por contenido ilegal</li>
            </ul>
          </div>

          {/* Propiedad Intelectual */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Propiedad Intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              Todo contenido, software, base de datos y materiales en el Servicio son propiedad de KUMPLIO o sus licenciadores. Esto incluye:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Código fuente y arquitectura</li>
              <li>Diseño, interfaces y funcionalidades</li>
              <li>Reportes, análisis y recomendaciones personalizadas</li>
              <li>Base de datos de normativas y jurisprudencia</li>
              <li>Marca KUMPLIO, logos y contenido visual</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Prohibido reproducir, distribuir o transmitir sin autorización escrita. Violaciones resultan en terminación inmediata de cuenta.
            </p>
          </div>

          {/* Disclaimers */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Descargos de Responsabilidad</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              El Servicio se proporciona "TAL CUAL" sin garantías de ningún tipo. En particular:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>NO garantizamos disponibilidad ininterrumpida del Servicio</li>
              <li>NO somos responsables por interrupciones, errores o pérdida de datos</li>
              <li>Análisis de IA son orientativos, no constituyen asesoramiento legal</li>
              <li>No reemplaza abogados o asesores de cumplimiento profesionales</li>
              <li>Cambios en legislación pueden no reflejarse inmediatamente</li>
              <li>NO garantizamos exactitud 100% de análisis</li>
              <li>Usted es responsable de validar recomendaciones legales</li>
            </ul>
          </div>

          {/* Limitación de Responsabilidad */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Limitación de Responsabilidad</h2>
            <p className="text-muted-foreground leading-relaxed">
              KUMPLIO NO será responsable por:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Daños indirectos, incidentales, especiales o punitivos</li>
              <li>Pérdida de ingresos, datos, clientes o reputación</li>
              <li>Costos de remediación o recuperación</li>
              <li>Acciones de terceros o fuerzas mayores</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Nuestra responsabilidad total no excederá lo pagado en últimos 12 meses.
            </p>
          </div>

          {/* Garantía de Conformidad */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Garantía de Conformidad Normativa</h2>
            <p className="text-muted-foreground leading-relaxed">
              KUMPLIO se compromete a mantener cumplimiento con:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Ley 19.628 (Protección de Privacidad)</li>
              <li>Ley 21.719 (Consentimiento Informado)</li>
              <li>Resoluciones SUBTEL sobre datos</li>
              <li>Estándares de seguridad informática (ISO 27001)</li>
              <li>Normativas SII sobre retención tributaria</li>
            </ul>
          </div>

          {/* Vigencia y Terminación */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Vigencia y Terminación</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Su suscripción es por el período especificado. Puede cancelar en cualquier momento desde su panel de control.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Podemos terminar acceso si:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Viola estos términos repetidamente</li>
                <li>Incumple obligaciones de pago</li>
                <li>Realiza actividades fraudulentas o ilegales</li>
                <li>Causa daño a otros usuarios o seguridad</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Terminación no afecta obligaciones previas. Datos personales se eliminarán conforme a nuestra Política de Privacidad.
              </p>
            </div>
          </div>

          {/* Tarifas y Pago */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">12. Tarifas y Pago</h2>
            <p className="text-muted-foreground leading-relaxed">
              Las tarifas se muestran en CLP (Pesos Chilenos). Usted acepta pagar todas las tarifas según su plan. Podemos cambiar precios con aviso de 30 días. Renovación automática se realizará al menos 5 días antes de vencimiento.
            </p>
          </div>

          {/* Indemnización */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">13. Indemnización</h2>
            <p className="text-muted-foreground leading-relaxed">
              Usted indemniza a KUMPLIO contra reclamaciones por:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Contenido que carga que viola derechos</li>
              <li>Uso del Servicio violando ley</li>
              <li>Violación de derechos de terceros</li>
              <li>Incumplimiento de estos términos</li>
            </ul>
          </div>

          {/* Ley Aplicable */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">14. Ley Aplicable y Jurisdicción</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estos términos se rigen por las leyes de la República de Chile. Ambas partes se someten a jurisdicción de tribunales chilenos, específicamente juzgados de Santiago.
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">15. Contacto</h2>
            <div className="bg-muted p-6 rounded-lg space-y-2">
              <p className="text-foreground">
                <strong>Para consultas sobre estos términos:</strong>
              </p>
              <p className="text-muted-foreground">
                KUMPLIO by n3uralia<br/>
                Email: legal@kumplio.cl<br/>
                Teléfono: +56 9 93826127<br/>
                Dirección: Santiago, Chile<br/>
                Sitio Web: https://kumplio.cl
              </p>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
