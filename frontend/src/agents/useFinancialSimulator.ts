import { useState } from 'react';
import { simulateInvestment } from '../services/apiServices';
import type { SimulationResult } from '../types/api';

export const useFinancialSimulator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const simulate = async (params: {
    empresa: number;
    monto: number;
    anios: number;
    escenario: 'conservador' | 'base' | 'optimista';
    modo: 'basico' | 'avanzado';
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulateInvestment({
        empresa_id: params.empresa,
        monto: params.monto,
        horizonte: params.anios,
        modo: params.modo,
      });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Error al conectar con el simulador');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    simulate,
    loading,
    error,
    result,
    setResult
  };
};
