import React from 'react';
import {
  ResponsiveContainer,
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

type Props = {
  data: any[];
  xKey: string;
  yKey: string;
  color?: string;
  formatTooltip?: (value: any, name?: string) => [string, string] | string;
  height?: number;
};

export function AreaChart({ data = [], xKey, yKey, color = '#10b981', formatTooltip, height = 300 }: Props) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <ReAreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip formatter={(value: any, name: any) => {
            if (formatTooltip) {
              const formatted = formatTooltip(value, name);
              if (Array.isArray(formatted)) return formatted;
              return [String(formatted), name];
            }
            return [value, name];
          }} />
          <Area type="monotone" dataKey={yKey} stroke={color} fill={color} fillOpacity={0.12} />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AreaChart;
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface AreaChartProps {
    data: any[];
    xKey: string;
    yKey: string;
    color?: string;
    height?: number;
    showGrid?: boolean;
    formatTooltip?: (value: any, name: string) => [string, string];
}

export function AreaChart({ 
    data, 
    xKey, 
    yKey, 
    color = '#8b5cf6', 
    height = 300,
    showGrid = true,
    formatTooltip
}: AreaChartProps) {
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsAreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
                <XAxis 
                    dataKey={xKey} 
                    className="text-xs text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis 
                    className="text-xs text-muted-foreground"
                    axisLine={false}
                    tickLine={false}
                />
                <Tooltip 
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={formatTooltip}
                />
                <Area 
                    type="monotone" 
                    dataKey={yKey} 
                    stroke={color} 
                    fill={color}
                    fillOpacity={0.3}
                    strokeWidth={2}
                />
            </RechartsAreaChart>
        </ResponsiveContainer>
    );
}
