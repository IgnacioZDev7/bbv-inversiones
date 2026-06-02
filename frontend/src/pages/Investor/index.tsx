import React from 'react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import InvestorDashboard from './InvestorDashboard';

export { InvestorDashboard };
export const InvestorCompanies: React.FC = () => <PagePlaceholder title="Empresas (Inversionista)" />;
export const InvestorIndicators: React.FC = () => <PagePlaceholder title="Indicadores" />;
export const Simulations: React.FC = () => <PagePlaceholder title="Simulaciones" />;
export const Recommendations: React.FC = () => <PagePlaceholder title="Recomendaciones" />;
