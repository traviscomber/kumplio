import assert from 'node:assert/strict'
import {
  canonicalApiUrl,
  formatApiDate,
  normalizeRut,
  parseProviderDate,
  parsePurchaseOrderPayload,
  parseTenderPayload,
  purchaseOrderCanonicalIdentifier,
  tenderCanonicalIdentifier,
} from '../supabase/functions/mercado-publico-bootstrap/core.mjs'

assert.equal(formatApiDate('2026-08-09'), '09082026')
assert.throws(() => formatApiDate('09-08-2026'), /invalid_date/)
assert.throws(() => formatApiDate('2026-02-31'), /invalid_date/)
assert.equal(normalizeRut('76.123.456-7'), '76123456-7')
assert.equal(normalizeRut('70.017.820-k'), '70017820-K')
assert.equal(parseProviderDate('09/08/2026 10:30:00'), '2026-08-09')
assert.equal(parseProviderDate('2026-08-09T10:30:00'), '2026-08-09')
assert.equal(tenderCanonicalIdentifier('1234-5-LR26'), 'mercadopublico:licitacion:1234-5-lr26')
assert.equal(purchaseOrderCanonicalIdentifier('1234-99-SE26'), 'mercadopublico:oc:1234-99-se26')

const safe = canonicalApiUrl('https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha=09082026')
assert.match(safe, /^https:\/\/api[.]mercadopublico[.]cl\/servicios\/v1\/publico\/licitaciones[.]json/)
assert.throws(() => canonicalApiUrl('http://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json'), /https_required/)
assert.throws(() => canonicalApiUrl('https://evil.example/servicios/v1/publico/licitaciones.json'), /host_not_allowed/)
assert.throws(() => canonicalApiUrl('https://api.mercadopublico.cl/private/users.json'), /path_not_allowed/)

const tenderPayload = {
  Cantidad: 2,
  FechaCreacion: '09/08/2026 11:00:00',
  Version: 'v1',
  Listado: [
    {
      CodigoExterno: '1234-5-LR26',
      Nombre: 'Servicio de cumplimiento normativo',
      Descripcion: 'Implementación y soporte',
      CodigoEstado: 5,
      Estado: 'Publicada',
      FechaCreacion: '09/08/2026 10:00:00',
      FechaPublicacion: '09/08/2026 10:15:00',
      FechaCierre: '20/08/2026 15:00:00',
      Moneda: 'CLP',
      MontoEstimado: '25000000',
      Comprador: {
        CodigoOrganismo: '6945',
        NombreOrganismo: 'Dirección de Compras y Contratación Pública',
        RutUnidad: '60.808.000-7',
        CodigoUnidad: '123',
        NombreUnidad: 'Unidad de Compra',
        ComunaUnidad: 'Santiago',
        RegionUnidad: 'Región Metropolitana',
      },
    },
    {
      CodigoExterno: '1234-5-LR26',
      Nombre: 'Duplicada por upstream',
    },
  ],
}

const tenders = parseTenderPayload(tenderPayload)
assert.equal(tenders.length, 1)
assert.equal(tenders[0].canonicalIdentifier, 'mercadopublico:licitacion:1234-5-lr26')
assert.equal(tenders[0].buyer.unitRut, '60808000-7')
assert.equal(tenders[0].estimatedAmount, 25000000)
assert.equal(tenders[0].publishedDate, '2026-08-09')
assert.equal(tenders[0].closingDate, '2026-08-20')
assert.equal(tenders[0].currency, 'CLP')

const purchaseOrderPayload = {
  Cantidad: 1,
  Listado: [
    {
      Codigo: '1234-99-SE26',
      Nombre: 'Orden de compra servicio',
      Descripcion: 'Servicio mensual',
      CodigoEstado: 6,
      Estado: 'Aceptada',
      FechaCreacion: '09/08/2026',
      TipoMoneda: 'CLP',
      TotalNeto: 1000000,
      Impuestos: 190000,
      Total: 1190000,
      Fechas: {
        FechaEnvio: '09/08/2026 12:00:00',
        FechaAceptacion: '10/08/2026 09:00:00',
      },
      Comprador: {
        CodigoOrganismo: '6945',
        NombreOrganismo: 'Dirección de Compras y Contratación Pública',
        RutUnidad: '60.808.000-7',
      },
      Proveedor: {
        CodigoProveedor: '17793',
        NombreProveedor: 'Proveedor Demo SpA',
        RutProveedor: '76.123.456-7',
      },
    },
  ],
}

const orders = parsePurchaseOrderPayload(purchaseOrderPayload)
assert.equal(orders.length, 1)
assert.equal(orders[0].canonicalIdentifier, 'mercadopublico:oc:1234-99-se26')
assert.equal(orders[0].supplier.rut, '76123456-7')
assert.equal(orders[0].total, 1190000)
assert.equal(orders[0].sentDate, '2026-08-09')
assert.equal(orders[0].acceptedDate, '2026-08-10')

console.log('Mercado Público fixtures passed')
