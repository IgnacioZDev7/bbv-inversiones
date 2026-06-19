import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { verifyBiometricIdentity, checkLiveness } from '../../services/apiServices';
import BiometricFaceGuide from './BiometricFaceGuide';

type WizardStep = 1 | 2 | 3;

interface BiometricWizardProps {
  onComplete: () => void;
  onClose?: () => void;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}

function FaceScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className="flex items-center gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-current" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-current" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-current" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

const STEP_CONFIG = [
  { step: 1 as WizardStep, title: 'Documento de Identidad', icon: CameraIcon, desc: 'Sube una foto clara de tu carnet de identidad' },
  { step: 2 as WizardStep, title: 'Captura Facial Guiada', icon: FaceScanIcon, desc: 'Captura automática mediante cámara' },
  { step: 3 as WizardStep, title: 'Verificación de Vida', icon: FaceScanIcon, desc: 'Confirmamos que eres una persona real' },
];

export default function BiometricWizard({ onComplete, onClose }: BiometricWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [carnetFile, setCarnetFile] = useState<File | null>(null);
  const [carnetPreview, setCarnetPreview] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceCaptured, setFaceCaptured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ similarity: number } | null>(null);
  const [livenessResult, setLivenessResult] = useState<{ alive: boolean; confidence: number } | null>(null);
  const [slideIn, setSlideIn] = useState(true);
  const prevStepRef = useRef<WizardStep>(1);

  useEffect(() => {
    if (prevStepRef.current !== step) {
      setSlideIn(false);
      const timer = setTimeout(() => {
        setSlideIn(true);
        prevStepRef.current = step;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const { getRootProps: getCarnetProps, getInputProps: getCarnetInput, isDragActive: isCarnetDrag } = useDropzone({
    onDrop: ([file]) => {
      if (file) {
        setCarnetFile(file);
        setCarnetPreview(URL.createObjectURL(file));
        setError(null);
      }
    },
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleStep1Next = () => {
    if (!carnetFile) return;
    setStep(2);
  };

  const handleFaceCaptureComplete = (frontalImage: File) => {
    setFaceImage(frontalImage);
    setFaceCaptured(true);
    setTimeout(() => setStep(3), 400);
  };

  const handleFaceError = (message: string) => {
    setError(message);
  };

  const handleVerify = async () => {
    if (!carnetFile || !faceImage) return;
    setLoading(true);
    setError(null);
    try {
      const verify = await verifyBiometricIdentity(carnetFile, faceImage);
      if (!verify.verified) {
        setError(`No coinciden los rostros (similitud: ${verify.similarity}%). Intenta con mejores fotos.`);
        setLoading(false);
        return;
      }
      setVerifyResult({ similarity: verify.similarity });

      const liveness = await checkLiveness(faceImage);
      setLivenessResult({ alive: liveness.alive, confidence: liveness.confidence });

      if (!liveness.alive) {
        setError('La prueba de vida no fue superada. Asegúrate de que tu rostro sea visible y frontal.');
        setLoading(false);
        return;
      }

      sessionStorage.setItem('biometric_verified', 'true');
      sessionStorage.setItem('biometric_timestamp', Date.now().toString());
      setLoading(false);
      onComplete();
    } catch (e: any) {
      setError(e.response?.data?.error || e.message || 'Error en la verificación biométrica.');
      setLoading(false);
    }
  };

  const stepIndicator = (s: WizardStep) => {
    const isActive = step === s;
    const isDone = (s === 1 && carnetFile) || (s === 2 && faceCaptured) || (s === 3 && livenessResult !== null) || (s === 1 && step > 1) || (s === 2 && step > 2);
    return (
      <div key={s} className="flex items-center gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black transition-all duration-500 ${
          isActive ? 'bg-brand-500 text-white scale-110 shadow-lg shadow-brand-500/30' :
          isDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
        }`}>
          {isDone ? <CheckIcon className="h-4 w-4" /> : s}
        </div>
        <div className="hidden sm:block">
          <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-brand-600 dark:text-brand-400' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
            {STEP_CONFIG[s - 1].title}
          </p>
        </div>
        {s < 3 && (
          <div className={`mx-2 h-px w-8 transition-all duration-500 ${isDone ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
        )}
      </div>
    );
  };

  const renderUploadZone = (
    getRootProps: any,
    getInputProps: any,
    isDrag: boolean,
    preview: string | null,
    label: string,
  ) => (
    <div
      {...getRootProps()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
        isDrag
          ? 'border-brand-400 bg-brand-50 dark:bg-brand-500/10 scale-[1.02]'
          : preview
            ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-500/30 dark:bg-emerald-500/5'
            : 'border-gray-200 bg-gray-50/50 hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-brand-500/30'
      }`}
    >
      <input {...getInputProps()} />
      {preview ? (
        <div className="relative mx-auto max-w-[260px]">
          <img src={preview} alt={label} className="max-h-52 w-full rounded-xl object-contain shadow-sm" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl bg-black/40">
            <p className="text-xs font-bold text-white">Haz clic para cambiar</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/10">
            <CameraIcon className="h-8 w-8 text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
              {isDrag ? 'Suelta la imagen aquí' : 'Arrastra o selecciona'}
            </p>
            <p className="mt-1 text-[10px] font-medium text-gray-400">JPEG / PNG · Máx 10 MB</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4">
      <div
        className={`relative overflow-hidden rounded-3xl border border-gray-200/50 bg-white shadow-2xl animate-fade-in dark:border-gray-700/50 dark:bg-gray-900 ${
          step === 2 ? 'w-full max-w-4xl' : 'w-full max-w-xl'
        }`}
      >
        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-6 pb-4">
          <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-brand-500/5 blur-3xl" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Verificación Biométrica</h2>
              <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                Paso {step} de 3: {STEP_CONFIG[step - 1].title}
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center sm:justify-start">
            {([1, 2, 3] as WizardStep[]).map(stepIndicator)}
          </div>
        </div>

        {/* Body */}
        <div className={`px-6 py-4 transition-all duration-300 ${slideIn ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
          {/* Step 1: CI Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{STEP_CONFIG[0].desc}</p>
              {renderUploadZone(getCarnetProps, getCarnetInput, isCarnetDrag, carnetPreview, 'Carnet de Identidad')}
              {carnetFile && (
                <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckIcon className="h-3.5 w-3.5" />
                  {carnetFile.name} ({(carnetFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>
          )}

          {/* Step 2: Guided Face Capture */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{STEP_CONFIG[1].desc}</p>
              <BiometricFaceGuide
                onCaptureComplete={handleFaceCaptureComplete}
                onError={handleFaceError}
              />
              {error && (
                <div className="animate-shake rounded-2xl border border-red-200/50 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Liveness & Verify */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-amber-200/50 bg-amber-50/50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <FaceScanIcon className="h-5 w-5 shrink-0" />
                  Verificaremos tu identidad y actividad biométrica
                </p>
                <p className="mt-1 text-[10px] font-medium text-amber-600/70 dark:text-amber-400/70">
                  Al confirmar, se enviarán las imágenes a Amazon Rekognition para su análisis.
                </p>
              </div>

              {verifyResult && (
                <div className="rounded-2xl border border-emerald-200/50 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckIcon className="h-5 w-5" />
                    Rostros verificados: {verifyResult.similarity}% similitud
                  </p>
                </div>
              )}

              {livenessResult && (
                <div className="rounded-2xl border border-emerald-200/50 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckIcon className="h-5 w-5" />
                    Prueba de vida: {livenessResult.alive ? 'Superada' : 'Fallida'} ({livenessResult.confidence}% confianza)
                  </p>
                </div>
              )}

              {error && (
                <div className="animate-shake rounded-2xl border border-red-200/50 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>

          <div className="flex gap-2">
            {step === 1 && (
              <>
                <button
                  onClick={() => setStep((step - 1) as WizardStep)}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 transition-all"
                >
                  Atrás
                </button>
                <button
                  onClick={handleStep1Next}
                  disabled={!carnetFile}
                  className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-brand-600 disabled:opacity-40 transition-all shadow-lg shadow-brand-500/20"
                >
                  Continuar
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>
              </>
            )}
            {step === 2 && (
              <button
                disabled
                className="flex items-center gap-2 rounded-xl bg-brand-500/60 px-6 py-2.5 text-[10px] font-black uppercase tracking-wider text-white/60 transition-all cursor-not-allowed"
              >
                Capturando...
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleVerify}
                disabled={loading}
                className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-brand-600 disabled:opacity-40 transition-all shadow-lg shadow-brand-500/20 min-w-[140px] justify-center"
              >
                {loading ? (
                  <>
                    Verificando
                    <LoadingDots />
                  </>
                ) : (
                  <>
                    Confirmar
                    <CheckIcon className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
