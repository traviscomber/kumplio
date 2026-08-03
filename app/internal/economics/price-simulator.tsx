'use client'

import { useMemo, useState } from 'react'

const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })

export function PriceSimulator() {
  const [customers, setCustomers] = useState(25)
  const [price, setPrice] = useState(249990)
  const [variableCost, setVariableCost] = useState(12000)
  const [fixedCost, setFixedCost] = useState(1500000)
  const [commissionPercent, setCommissionPercent] = useState(3.5)
  const [targetMargin, setTargetMargin] = useState(80)

  const metrics = useMemo(() => {
    const revenue = customers * price
    const commission = revenue * (commissionPercent / 100)
    const totalCost = customers * variableCost + fixedCost + commission
    const margin = revenue - totalCost
    const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0
    const denominator = Math.max(0.01, 1 - targetMargin / 100 - commissionPercent / 100)
    const minimumPrice = (variableCost + fixedCost / Math.max(customers, 1)) / denominator
    const priceWithIva = price * 1.19
    return { revenue, commission, totalCost, margin, marginPercent, minimumPrice, priceWithIva }
  }, [customers, price, variableCost, fixedCost, commissionPercent, targetMargin])

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Simulador interno</p>
          <h2 className="mt-1 text-xl font-extrabold">¿Este precio sostiene el negocio?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Modela precio, volumen y costos completos. El IVA se muestra separado y no se considera ingreso.</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-bold ${metrics.marginPercent >= targetMargin ? 'bg-emerald-500/10 text-emerald-700' : metrics.marginPercent >= 60 ? 'bg-amber-500/10 text-amber-700' : 'bg-red-500/10 text-red-700'}`}>
          Margen {metrics.marginPercent.toFixed(1)}%
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <NumberField label="Clientes activos" value={customers} min={1} onChange={setCustomers} />
        <NumberField label="Precio mensual sin IVA" value={price} step={1000} onChange={setPrice} />
        <NumberField label="Costo variable por cliente" value={variableCost} step={1000} onChange={setVariableCost} />
        <NumberField label="Costos fijos mensuales" value={fixedCost} step={10000} onChange={setFixedCost} />
        <NumberField label="Comisiones y medios de pago (%)" value={commissionPercent} step={0.1} onChange={setCommissionPercent} />
        <NumberField label="Margen objetivo (%)" value={targetMargin} min={1} max={95} step={1} onChange={setTargetMargin} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Ingreso mensual" value={clp.format(metrics.revenue)} />
        <Metric label="Costo completo" value={clp.format(metrics.totalCost)} />
        <Metric label="Margen bruto" value={clp.format(metrics.margin)} />
        <Metric label="Precio mínimo recomendado" value={clp.format(Math.ceil(metrics.minimumPrice / 1000) * 1000)} emphasized />
      </div>

      <div className="mt-4 rounded-xl bg-muted/40 p-4 text-sm">
        <p><strong>Precio al cliente con IVA:</strong> {clp.format(metrics.priceWithIva)}</p>
        <p className="mt-1 text-muted-foreground">Comisiones estimadas: {clp.format(metrics.commission)}. El precio mínimo busca alcanzar {targetMargin}% de margen con el volumen y costos ingresados.</p>
      </div>
    </section>
  )
}

function NumberField({ label, value, onChange, ...props }: { label: string; value: number; onChange: (value: number) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return <label className="block text-sm"><span className="font-semibold">{label}</span><input type="number" value={value} onChange={(event) => onChange(Number(event.target.value || 0))} {...props} className="mt-1 w-full rounded-lg border border-border bg-background p-3" /></label>
}

function Metric({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return <div className={`rounded-xl border p-4 ${emphasized ? 'border-primary/30 bg-primary/5' : 'border-border'}`}><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-lg font-extrabold">{value}</p></div>
}
