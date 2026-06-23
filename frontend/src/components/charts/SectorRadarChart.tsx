import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip,
} from 'recharts';
import CustomTooltip from './CustomTooltip';

export interface RadarAxisDatum {
  axis: string;
  empresa: number;
  sector: number;
}

interface SectorRadarChartProps {
  data: RadarAxisDatum[];
}

const EMPRESA_COLOR = '#465fff';
const SECTOR_COLOR = '#94a3b8';

export default function SectorRadarChart({ data }: SectorRadarChartProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400">Perfil Financiero vs. Sector</h4>
        <div className="flex items-center gap-3 text-[10px] font-medium text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EMPRESA_COLOR }} />
            Tu empresa
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SECTOR_COLOR }} />
            Promedio sector
          </span>
        </div>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="rgba(148, 163, 184, 0.25)" />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} tickCount={5} axisLine={false} />
            <Tooltip content={<CustomTooltip formatter={(v) => `${v.toFixed(0)}%`} />} />
            <Radar name="Tu empresa" dataKey="empresa" stroke={EMPRESA_COLOR} fill={EMPRESA_COLOR} fillOpacity={0.25} />
            <Radar name="Promedio sector" dataKey="sector" stroke={SECTOR_COLOR} fill={SECTOR_COLOR} fillOpacity={0.15} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.map((row) => (
          <div key={row.axis} className="rounded-lg border border-gray-100 px-2.5 py-2 dark:border-gray-700">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">{row.axis}</p>
            <p className="mt-0.5 text-xs font-bold" style={{ color: EMPRESA_COLOR }}>Tú: {row.empresa}%</p>
            <p className="text-xs font-medium text-gray-400 dark:text-gray-500">Sector: {row.sector}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
