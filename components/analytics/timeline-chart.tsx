// Document timeline chart component

'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TimelineData {
  name: string;
  uploaded: number;
  analyzed: number;
  date: string;
}

interface DocumentTimelineProps {
  data: TimelineData[];
}

export function DocumentTimelineChart({ data }: DocumentTimelineProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" stroke="var(--muted-foreground)" />
          <YAxis stroke="var(--muted-foreground)" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--background)', 
              border: '1px solid var(--border)',
              color: 'var(--foreground)'
            }}
          />
          <Legend />
          <Bar dataKey="uploaded" fill="var(--chart-1)" name="Cargados" />
          <Bar dataKey="analyzed" fill="var(--chart-2)" name="Analizados" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
