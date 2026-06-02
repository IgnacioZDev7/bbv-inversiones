import React from 'react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import AnalystDashboard from './AnalystDashboard';
import Indicators from './Indicators';

export { AnalystDashboard, Indicators };
export const AnalystCompanies: React.FC = () => <PagePlaceholder title="Empresas (Analista)" />;
export const FinancialReports: React.FC = () => <PagePlaceholder title="Reportes Financieros" />;
export const ManualPipeline: React.FC = () => <PagePlaceholder title="Ejecucion Manual de Pipeline" />;
