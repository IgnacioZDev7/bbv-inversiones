import { useState, useEffect } from 'react';
import { getEmpresas } from '../../services/apiServices';
import type { Empresa } from '../../types/api';
import Simulator from '../../components/bbv/Simulator';
import BiometricWizard from '../../components/biometrics/BiometricWizard';

function ShieldLockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function FingerprintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.61-.09 5.112-.252 7.566M1.5 15.234c.714-1.902 1.393-3.823 2.034-5.734M6.103 18.25c1.056-1.677 2.102-3.36 3.135-5.049M10.5 21c1.5-2.906 2.868-5.884 4.107-8.91M16.5 10.5a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}

function isBiometricVerified(): boolean {
  const verified = sessionStorage.getItem('biometric_verified');
  const timestamp = sessionStorage.getItem('biometric_timestamp');
  if (verified !== 'true' || !timestamp) return false;
  const elapsed = Date.now() - Number(timestamp);
  return elapsed < 24 * 60 * 60 * 1000;
}

export default function Simulations() {
  const [companies, setCompanies] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [verified, setVerified] = useState(isBiometricVerified());
  const [animClass, setAnimClass] = useState('opacity-0 translate-y-4');

  useEffect(() => {
    const timer = setTimeout(() => setAnimClass('opacity-100 translate-y-0'), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    getEmpresas({ page_size: 100 })
      .then((res) => setCompanies(res.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleBiometricComplete = () => {
    setVerified(true);
    setShowWizard(false);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 transition-all duration-700 ${animClass}`}>
      {!verified ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 animate-pulse rounded-full bg-brand-500/10 blur-xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 shadow-2xl shadow-brand-500/30">
              <ShieldLockIcon className="h-12 w-12 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
            Acceso Restringido
          </h1>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 max-w-md mb-8 leading-relaxed">
            Para acceder al Simulador IA, debes verificar tu identidad mediante el proceso biométrico. 
            Tus datos están protegidos con cifrado de extremo a extremo.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-2xl w-full">
            {[
              { step: '01', title: 'Documento', desc: 'Sube tu carnet de identidad' },
              { step: '02', title: 'Selfie', desc: 'Captura tu rostro frontal' },
              { step: '03', title: 'Verificación', desc: 'Prueba de vida biométrica' },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-gray-100 bg-white p-5 text-center dark:border-gray-800 dark:bg-white/[0.02]">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 text-xs font-black">
                  {item.step}
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-[10px] font-medium text-gray-400 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-3 rounded-2xl bg-brand-500 px-10 py-4 text-sm font-black uppercase tracking-[0.2em] text-white hover:bg-brand-600 active:scale-95 transition-all shadow-2xl shadow-brand-500/30 group"
          >
            <FingerprintIcon className="h-5 w-5" />
            Iniciar Verificación Biométrica
          </button>

          <p className="mt-6 text-[10px] font-medium text-gray-400 flex items-center gap-1.5">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Tus imágenes no se almacenan permanentemente
          </p>
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Simulador IA</h1>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                Proyección financiera estadística · Identidad verificada
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Verificado
              </span>
            </div>
          </div>
          <Simulator companies={companies} />
        </div>
      )}

      {showWizard && (
        <BiometricWizard
          onComplete={handleBiometricComplete}
          onClose={() => setShowWizard(false)}
        />
      )}
    </div>
  );
}
