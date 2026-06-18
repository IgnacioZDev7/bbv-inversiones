import React from 'react';
import PagePlaceholder from '../../components/common/PagePlaceholder';
import InvestorDashboard from './InvestorDashboard';
import Simulations from './Simulations';

export { InvestorDashboard };
export { Simulations };
export const InvestorCompanies: React.FC = () => <PagePlaceholder title="Empresas (Inversionista)" />;
export const InvestorIndicators: React.FC = () => <PagePlaceholder title="Indicadores" />;
export const Recommendations: React.FC = () => <PagePlaceholder title="Recomendaciones" />;
