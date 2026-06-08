export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Política de Privacidad</h1>
          <p className="text-lg text-muted-foreground">
            Última actualización: Junio 2024
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Introducción */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Introducción</h2>
            <p className="text-muted-foreground leading-relaxed">
              KUMPLIO by n3uralia ("nosotros", "nuestro" o "la Empresa") respeta la privacidad de nuestros usuarios. Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y protegemos sus datos personales en conformidad con la Ley 19.628 sobre Protección de la Vida Privada y la Ley 21.719 sobre Consentimiento Informado en Chile.
            </p>
          </div>

          {/* Información que Recopilamos */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Información que Recopilamos</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.1 Datos Personales que Usted Proporciona:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Datos de identificación: nombre, RUN, email, teléfono</li>
                  <li>Datos empresariales: nombre empresa, descripción, ruca/rol</li>
                  <li>Datos de acceso: usuario, contraseña (hasheada)</li>
                  <li>Datos de comunicación: mensajes, soportes, consultas</li>
                  <li>Documentos: archivos cargados para análisis de cumplimiento</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.2 Datos Recopilados Automáticamente:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Datos de uso: IP, navegador, dispositivo, páginas visitadas</li>
                  <li>Cookies y tecnologías similares: para autenticación y preferencias</li>
                  <li>Ubicación aproximada: país/región (basada en IP)</li>
                  <li>Logs de actividad: acciones dentro de la plataforma</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">2.3 Datos de Terceros:</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Información de proveedores de servicios (Supabase, Vercel)</li>
                  <li>Datos públicos de registros comerciales chilenos</li>
                  <li>Información de referencias comerciales (con consentimiento)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Base Legal */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Base Legal para el Tratamiento de Datos</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Tratamos sus datos personales conforme a las siguientes bases legales bajo la Ley 19.628:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Consentimiento:</strong> Usted consiente expresamente al crear una cuenta o usar nuestros servicios</li>
              <li><strong>Ejecución de Contrato:</strong> Datos necesarios para proporcionar servicios contratados</li>
              <li><strong>Obligación Legal:</strong> Cumplimiento de leyes chilenas (tributarias, laborales, cumplimiento)</li>
              <li><strong>Interés Legítimo:</strong> Mejora de seguridad, prevención de fraude, análisis de tendencias</li>
              <li><strong>Ley 21.719:</strong> Análisis de consentimiento informado para empresas</li>
            </ul>
          </div>

          {/* Uso de Datos */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Cómo Utilizamos Sus Datos</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Proporcionar, mantener y mejorar nuestros servicios</li>
              <li>Procesar transacciones y enviar confirmaciones</li>
              <li>Enviar actualizaciones, avisos de seguridad y comunicaciones administrativas</li>
              <li>Responder a sus consultas y solicitudes de soporte</li>
              <li>Analizar tendencias de cumplimiento normativo (datos agregados)</li>
              <li>Detectar, prevenir y abordar fraude, seguridad y problemas técnicos</li>
              <li>Personalizar su experiencia según preferencias</li>
              <li>Cumplir obligaciones legales y regulatorias chilenas</li>
              <li>Entrenar modelos de IA respetando privacidad (sin compartir PII)</li>
            </ul>
          </div>

          {/* Compartición de Datos */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">5. Compartición de Datos Personales</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              No vendemos, alquilamos ni compartimos sus datos personales con terceros, excepto en los siguientes casos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Proveedores de Servicios:</strong> Supabase (base datos), Vercel (hosting), OpenAI (IA análisis) - bajo acuerdos DPA</li>
              <li><strong>Cumplimiento Legal:</strong> Cuando requerido por autoridades chilenas (SERNAC, SII, autoridad judicial)</li>
              <li><strong>Protección de Derechos:</strong> Para proteger seguridad, derechos e integridad</li>
              <li><strong>Fusiones/Adquisiciones:</strong> En caso de cambio de control empresarial (con aviso previo)</li>
              <li><strong>Con su Consentimiento:</strong> Para otros fines específicos que comuniquemos</li>
            </ul>
          </div>

          {/* Seguridad */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">6. Seguridad de Sus Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Implementamos medidas técnicas y organizacionales para proteger sus datos personales contra acceso no autorizado, alteración o destrucción:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Encriptación SSL/TLS para transmisión de datos</li>
              <li>Contraseñas hasheadas con algoritmos modernos (bcrypt)</li>
              <li>Acceso restringido a datos por roles y permisos</li>
              <li>Auditoría de acceso y logs de actividad</li>
              <li>Autenticación de dos factores (2FA) disponible</li>
              <li>Backups encriptados y redundantes</li>
              <li>Cumplimiento de estándares de seguridad internacionales</li>
            </ul>
          </div>

          {/* Derechos ARCO */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">7. Sus Derechos ARCO+E</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Conforme a la Ley 19.628, usted tiene derecho a:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Acceso (A):</strong> Conocer qué datos tenemos sobre usted</li>
              <li><strong>Rectificación (R):</strong> Corregir datos inexactos o incompletos</li>
              <li><strong>Cancelación (C):</strong> Solicitar eliminación de datos bajo ciertos términos</li>
              <li><strong>Oposición (O):</strong> Rechazar tratamiento de sus datos</li>
              <li><strong>Portabilidad (E):</strong> Obtener sus datos en formato estructurado</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Para ejercer estos derechos, contacte a: privacy@kumplio.cl con identificación de RUN.
            </p>
          </div>

          {/* Retención de Datos */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">8. Retención de Datos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Retenemos datos personales solo por el tiempo necesario para los fines para los que fueron recopilados:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Datos de cuenta activa: mientras mantenga su suscripción</li>
              <li>Datos de transacciones: 7 años (requisito tributario chileno)</li>
              <li>Logs de seguridad: 6 meses a 2 años</li>
              <li>Datos de backup: hasta 30 días después de eliminación</li>
              <li>Datos anonimizados: indefinidamente para análisis agregados</li>
            </ul>
          </div>

          {/* Cookies */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">9. Cookies y Tecnologías de Seguimiento</h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies y tecnologías similares para:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-4">
              <li>Mantenerlo autenticado en su sesión</li>
              <li>Recordar sus preferencias</li>
              <li>Analizar patrones de uso (Google Analytics)</li>
              <li>Mejorar rendimiento y seguridad</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Puede controlar cookies desde su navegador. La desactivación de cookies puede afectar funcionalidad.
            </p>
          </div>

          {/* Links Externos */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">10. Enlaces Externos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nuestro sitio puede contener enlaces a terceros. No somos responsables de las políticas de privacidad de sitios externos. Le recomendamos revisar sus políticas antes de proporcionar información personal.
            </p>
          </div>

          {/* Cambios */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">11. Cambios a Esta Política</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos actualizar esta política ocasionalmente. Le notificaremos de cambios significativos por email o mediante aviso prominente en nuestro sitio. Su uso continuado constituye aceptación de cambios.
            </p>
          </div>

          {/* Contacto */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">12. Contacto</h2>
            <div className="bg-muted p-6 rounded-lg space-y-2">
              <p className="text-foreground">
                <strong>Encargado de Privacidad / DPO:</strong>
              </p>
              <p className="text-muted-foreground">
                KUMPLIO by n3uralia<br/>
                Email: privacy@kumplio.cl<br/>
                Teléfono: +56 9 9382-6127<br/>
                Dirección: Santiago, Chile<br/>
                Sitio Web: https://kumplio.cl
              </p>
              <p className="text-muted-foreground text-sm mt-4">
                Si considera que sus derechos han sido vulnerados, puede presentar reclamo ante el Juzgado de Letras competente conforme a la Ley 19.628.
              </p>
            </div>
          </div>

        </div>
      </section>
    </main>
  )
}
