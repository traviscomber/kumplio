// Obligations by type bar chart

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ObligationTypeData {
  type: string;
  count: number;
  fill: string;
}

interface ObligationsChartProps {
  data: ObligationTypeData[];
}

export function ObligationsByTypeChart({ data }: ObligationsChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 flex items-center justify-center text-muted-foreground">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis 
            dataKey="type" 
            stroke="var(--muted-foreground)"
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--background)', 
              border: '1px solid var(--border)',
              color: 'var(--foreground)'
            }}
            formatter={(value: any) => `${value} obligaciones`}
          />
          <Bar dataKey="count" fill="var(--chart-1)" name="Cantidad" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
