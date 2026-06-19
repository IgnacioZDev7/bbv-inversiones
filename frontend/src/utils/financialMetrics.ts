import type { ReporteFinanciero } from '../types/api';

export type FinancialStatus = 'excelente' | 'saludable' | 'observacion' | 'riesgo';

export interface FinancialPoint {
  label: string;
  date: string;
  gestion: number;
  trimestre: number | null;
  activo: number;
  pasivo: number;
  patrimonio: number;
  activoCorriente: number;
  pasivoCorriente: number;
  liquidez: number;
  endeudamiento: number;
  capitalTrabajo: number;
}

export interface FinancialSnapshot {
  latest: ReporteFinanciero | null;
  previous: ReporteFinanciero | null;
  points: FinancialPoint[];
  activo: number;
  pasivo: number;
  patrimonio: number;
  activoCorriente: number;
  pasivoCorriente: number;
  liquidez: number;
  endeudamiento: number;
  capitalTrabajo: number;
  solvencia: number;
  variacionPatrimonio: number;
  score: number;
  status: FinancialStatus;
  statusLabel: string;
  riskLabel: string;
}

export const formatMoneyCompact = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

export const formatRatio = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    maximumFractionDigits: 2,
  }).format(value);

export const formatPercent = (value: number) =>
  new Intl.NumberFormat('es-BO', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value);

const getFinancialValue = (report: ReporteFinanciero | null, key: string): number => {
  if (!report?.datos_extraidos_json) return 0;
  const value = report.datos_extraidos_json[key];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number.parseFloat(value) || 0;
  return 0;
};

export const sortReportsChronologically = (reports: ReporteFinanciero[]) =>
  [...reports].sort((a, b) => a.gestion - b.gestion || (a.trimestre ?? 0) - (b.trimestre ?? 0));

export const sortReportsLatestFirst = (reports: ReporteFinanciero[]) =>
  [...reports].sort((a, b) => b.gestion - a.gestion || (b.trimestre ?? 0) - (a.trimestre ?? 0));

export const getProcessedReports = (reports: ReporteFinanciero[] = []) =>
  reports.filter((report) => report.estado_procesamiento === 'PROCESADO' && report.datos_extraidos_json);

export const toFinancialPoint = (report: ReporteFinanciero): FinancialPoint => {
  const activo = getFinancialValue(report, 'total_activo');
  const pasivo = getFinancialValue(report, 'total_pasivo');
  const patrimonio = getFinancialValue(report, 'total_patrimonio');
  const activoCorriente = getFinancialValue(report, 'total_activo_corriente');
  const pasivoCorriente = getFinancialValue(report, 'total_pasivo_corriente');

  const month = report.trimestre ? ((report.trimestre - 1) * 3 + 1).toString().padStart(2, '0') : '01';
  return {
    label: report.trimestre ? `${report.gestion} T${report.trimestre}` : `${report.gestion}`,
    date: `${report.gestion}-${month}-01`,
    gestion: report.gestion,
    trimestre: report.trimestre,
    activo,
    pasivo,
    patrimonio,
    activoCorriente,
    pasivoCorriente,
    liquidez: pasivoCorriente > 0 ? activoCorriente / pasivoCorriente : 0,
    endeudamiento: activo > 0 ? pasivo / activo : 0,
    capitalTrabajo: activoCorriente - pasivoCorriente,
  };
};

export function calculateFinancialHealthScore(params: {
  liquidez: number;
  endeudamiento: number;
  crecimientoPatrimonial: number;
  solvencia?: number;
}): number {
  const liqScore = Math.min(35, Math.max(0, (params.liquidez - 0.8) / 0.7 * 35));
  const endScore = Math.min(35, Math.max(0, (0.9 - params.endeudamiento) / 0.5 * 35));
  const trendScore = Math.min(20, Math.max(0, (params.crecimientoPatrimonial + 0.15) / 0.25 * 20));
  const solvScore = params.solvencia != null
    ? Math.min(10, Math.max(0, (params.solvencia - 1.0) / 1.0 * 10))
    : 0;
  return Math.round(Math.min(100, Math.max(0, liqScore + endScore + trendScore + solvScore)));
}

export function classifyHealthScore(score: number): FinancialStatus {
  if (score >= 80) return 'excelente';
  if (score >= 60) return 'saludable';
  if (score >= 40) return 'observacion';
  return 'riesgo';
}

export const healthLabelMap: Record<FinancialStatus, { status: string; risk: string }> = {
  excelente: { status: 'Excelente', risk: 'Riesgo muy bajo' },
  saludable: { status: 'Saludable', risk: 'Riesgo bajo' },
  observacion: { status: 'En observación', risk: 'Riesgo medio' },
  riesgo: { status: 'En riesgo', risk: 'Riesgo alto' },
};

export const buildFinancialSnapshot = (reports: ReporteFinanciero[] = []): FinancialSnapshot => {
  const processed = getProcessedReports(reports);
  const latestFirst = sortReportsLatestFirst(processed);
  const latest = latestFirst[0] ?? null;
  const previous = latestFirst[1] ?? null;
  const points = sortReportsChronologically(processed).map(toFinancialPoint);
  const latestPoint = latest ? toFinancialPoint(latest) : null;
  const previousPatrimonio = previous ? getFinancialValue(previous, 'total_patrimonio') : 0;
  const variacionPatrimonio =
    latestPoint && previousPatrimonio !== 0
      ? (latestPoint.patrimonio - previousPatrimonio) / previousPatrimonio
      : 0;

  const solvencia = latestPoint && latestPoint.pasivo > 0 ? latestPoint.activo / latestPoint.pasivo : 0;

  const score = calculateFinancialHealthScore({
    liquidez: latestPoint?.liquidez ?? 0,
    endeudamiento: latestPoint?.endeudamiento ?? 0,
    crecimientoPatrimonial: variacionPatrimonio,
    solvencia,
  });
  const status = classifyHealthScore(score);
  const labels = healthLabelMap[status];

  return {
    latest,
    previous,
    points,
    activo: latestPoint?.activo ?? 0,
    pasivo: latestPoint?.pasivo ?? 0,
    patrimonio: latestPoint?.patrimonio ?? 0,
    activoCorriente: latestPoint?.activoCorriente ?? 0,
    pasivoCorriente: latestPoint?.pasivoCorriente ?? 0,
    liquidez: latestPoint?.liquidez ?? 0,
    endeudamiento: latestPoint?.endeudamiento ?? 0,
    capitalTrabajo: latestPoint?.capitalTrabajo ?? 0,
    solvencia,
    variacionPatrimonio,
    score,
    status,
    statusLabel: labels.status,
    riskLabel: labels.risk,
  };
};
