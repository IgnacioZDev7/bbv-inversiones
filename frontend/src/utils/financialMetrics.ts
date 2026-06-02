import type { ReporteFinanciero } from '../types/api';

export type FinancialStatus = 'healthy' | 'watch' | 'risk';

export interface FinancialPoint {
  label: string;
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

  return {
    label: report.trimestre ? `${report.gestion} T${report.trimestre}` : `${report.gestion}`,
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

  const liquidezScore = Math.min(35, Math.max(0, latestPoint ? latestPoint.liquidez / 1.5 : 0) * 35);
  const debtScore = latestPoint ? Math.max(0, 35 - latestPoint.endeudamiento * 35) : 0;
  const trendScore = Math.min(30, Math.max(0, (variacionPatrimonio + 0.15) / 0.3) * 30);
  const score = Math.round(Math.min(100, liquidezScore + debtScore + trendScore));

  const status: FinancialStatus =
    latestPoint && (latestPoint.liquidez < 1 || latestPoint.endeudamiento > 0.8 || variacionPatrimonio < -0.1)
      ? 'risk'
      : latestPoint && latestPoint.liquidez >= 1.2 && latestPoint.endeudamiento <= 0.6 && variacionPatrimonio >= 0
        ? 'healthy'
        : 'watch';

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
    variacionPatrimonio,
    score,
    status,
    statusLabel: status === 'healthy' ? 'Saludable' : status === 'risk' ? 'Riesgo alto' : 'En observacion',
    riskLabel: status === 'healthy' ? 'Riesgo bajo' : status === 'risk' ? 'Riesgo alto' : 'Riesgo medio',
  };
};
