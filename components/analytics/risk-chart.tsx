// Risk distribution pie chart component

'use client';

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartLegend, ChartTooltip } from '@/components/ui/chart';

interface RiskChartProps {
  data: Array<{ name: string; value: number; fill: string }>;
}

export function RiskDistributionChart({ data }: RiskChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: any) => `${value} items`}
            contentStyle={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
