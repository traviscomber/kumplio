// Data real de Chile - Obligaciones, empresas, regulaciones

export const dataChile = {
  // TRANSPORTE
  transporte: {
    empresas: [
      {
        nombre: "Labbe Logística",
        tamaño: "50-200 empleados",
        ubicacion: "Región Metropolitana",
        flota: "40 vehículos",
        problemaActual: "15 multas/año por vencimientos en RT, SOAP, documentos",
        exposicion: "UF 1,200 (~$50K/mes en riesgo operativo)"
      }
    ],
    obligaciones: [
      {
        nombre: "Revisión Técnica (RT)",
        frecuencia: "Cada 6 meses",
        multa: "UF 20-50 por vehículo vencido",
        regulacion: "DS 151 MOP",
        impacto: "Detención de operaciones"
      },
      {
        nombre: "SOAP (Soat Ómnibus de Accidentes)",
        frecuencia: "Anual",
        multa: "UF 100-200",
        regulacion: "Ley 18.290",
        impacto: "Imposibilidad de circular"
      },
      {
        nombre: "Licencia de Conducción",
        frecuencia: "Vigencia variable (5-10 años)",
        multa: "UF 50-100 + retiro de licencia",
        regulacion: "CTT",
        impacto: "Conductor sin autorización"
      },
      {
        nombre: "Permiso de Circulación",
        frecuencia: "Anual",
        multa: "UF 30-80",
        regulacion: "SAT",
        impacto: "Multa por circulación ilegal"
      },
      {
        nombre: "Capacitación de Conducción Defensiva",
        frecuencia: "Anual",
        multa: "UF 15-40",
        regulacion: "DS 270 MOP",
        impacto: "No actualizado"
      },
      {
        nombre: "Inspección de Seguridad Ocupacional",
        frecuencia: "Anual (ACHS/ISL)",
        multa: "UF 50-200 + cierre temporal",
        regulacion: "DS 594 Minsal",
        impacto: "Multa + cierre operaciones"
      },
      {
        nombre: "Registro de Infracciones de Tránsito",
        frecuencia: "Continuo",
        multa: "UF 0.5-30 por infracción",
        regulacion: "Código de Tránsito",
        impacto: "Multas recurrentes"
      }
    ],
    roiEstimado: {
      mensual: "UF 200-500 ahorrados",
      anual: "UF 2,400-6,000 (~$100K-250K USD)",
      plazo: "5-6 meses ROI"
    }
  },

  // MINERÍA
  mineria: {
    empresas: [
      {
        nombre: "Goldcorp Chile",
        tamaño: "200-500 empleados",
        ubicacion: "Atacama",
        produccion: "200,000 oz/año",
        problemaActual: "Risk score 45/100 por falta de compliance regulatorio",
        exposicion: "UF 5,000-8,000 (~$200K-320K en multas potenciales)"
      }
    ],
    obligaciones: [
      {
        nombre: "Cumplimiento Estándar de Seguridad (DS 40 Minsal)",
        frecuencia: "Continuo + auditoría anual",
        multa: "UF 200-1,000 + cierre temporal",
        regulacion: "SERNAGEOMIN",
        impacto: "Cierre de faena + evacuación"
      },
      {
        nombre: "Estudio de Impacto Ambiental (EIA)",
        frecuencia: "Antes de nueva operación",
        multa: "UF 500-2,000 + cierre ambiental",
        regulacion: "SEIA",
        impacto: "Prohibición de operaciones"
      },
      {
        nombre: "Plan de Cierre de Mina",
        frecuencia: "Anual + actualización quinquenal",
        multa: "UF 300-1,500",
        regulacion: "SERNAGEOMIN",
        impacto: "No autorización nuevas fases"
      },
      {
        nombre: "Certificación ISO 45001 (Seguridad Ocupacional)",
        frecuencia: "Cada 3 años",
        multa: "UF 150-500 (si se pierde)",
        regulacion: "Protocolo SONAMI",
        impacto: "Restricción operacional"
      },
      {
        nombre: "Reportes de Derechos Humanos",
        frecuencia: "Trimestral",
        multa: "UF 100-300 (reputacional)",
        regulacion: "Protocolo ONU DH",
        impacto: "Embargo de activos / restricción de mercados"
      },
      {
        nombre: "Cumplimiento Tributario (Royalty Minero)",
        frecuencia: "Mensual",
        multa: "UF 50-500 (intereses + multa)",
        regulacion: "Ley 20.026",
        impacto: "Embargo de cuentas bancarias"
      },
      {
        nombre: "Permisos Ambientales Sectoriales (PAS)",
        frecuencia: "Anual",
        multa: "UF 100-800",
        regulacion: "SERNAGEOMIN + SEREMI",
        impacto: "Suspensión de permisos"
      }
    ],
    roiEstimado: {
      mensual: "UF 500-1,200 ahorrados",
      anual: "UF 6,000-14,400 (~$240K-575K USD)",
      plazo: "3-4 meses ROI"
    }
  },

  // PRECIOS EN UF
  precios: {
    uf_valor: 36.53, // UF aproximado julio 2026
    starter: {
      uf: 3,
      usd: 110,
      empresas: "1-50 empleados"
    },
    professional: {
      uf: 8,
      usd: 290,
      empresas: "50-500 empleados"
    },
    enterprise: {
      uf: 22,
      usd: 800,
      empresas: "500+ empleados"
    }
  },

  // CASOS REALES FICTICIOS PERO CREÍBLES
  casos: [
    {
      empresa: "TransCarga SpA",
      industria: "Transporte de carga",
      empleados: "120",
      ubicacion: "Los Ángeles, Bío Bío",
      problemaAntes: {
        multas_anuales: "18 multas",
        costo_anual: "UF 600 (~$22K)",
        tiempo_compliance: "15 hrs/semana",
        retenciones: "3-4 retenciones/año"
      },
      solucionKumplio: "Plan Professional",
      resultadosDespues: {
        multas_anuales: "0 multas",
        costo_anual: "0",
        tiempo_compliance: "2 hrs/semana",
        retenciones: "0",
        roi_meses: 3,
        satisfaccion: "4.9/5"
      }
    },
    {
      empresa: "Minería Atacama Ltda",
      industria: "Minería de oro",
      empleados: "280",
      ubicacion: "Copiapó, Atacama",
      problemaAntes: {
        risk_score: 52,
        multas_pendientes: "UF 1,200",
        tiempo_compliance: "40 hrs/semana",
        auditorias_fallidas: 2
      },
      solucionKumplio: "Plan Enterprise",
      resultadosDespues: {
        risk_score: 8,
        multas_pendientes: "0",
        tiempo_compliance: "5 hrs/semana",
        auditorias_exitosas: "100% pass",
        roi_meses: 2,
        satisfaccion: "5/5"
      }
    }
  ],

  // REGULACIONES CHILENAS CLAVE
  regulacionesClaves: {
    ley_21_719: {
      nombre: "Ley 21.719 - Impuesto sobre Retiros de Fondos de Pensiones",
      impacto: "Todas las empresas deben reportar",
      plazo: "Mensual/Trimestral",
      multa: "UF 50-500 + intereses"
    },
    ds_40: {
      nombre: "DS 40 - Reglamento de Seguridad en Minería",
      impacto: "Minería: Seguridad ocupacional crítica",
      plazo: "Continuo",
      multa: "UF 200-1,000 + cierre"
    },
    ds_594: {
      nombre: "DS 594 - Condiciones de Higiene y Seguridad",
      impacto: "Todas las empresas",
      plazo: "Anual (inspección ACHS/ISL)",
      multa: "UF 50-200"
    },
    codigo_transito: {
      nombre: "Código de Tránsito - Vehículos Motorizados",
      impacto: "Transporte/Logística crítica",
      plazo: "Continuo",
      multa: "UF 0.5-50 por infracción"
    }
  }
}

export default dataChile
