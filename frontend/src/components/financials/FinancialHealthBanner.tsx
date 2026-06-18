import { useEffect, useRef, useMemo, useCallback } from 'react';

type HealthState = 'healthy' | 'watch' | 'risk';

interface FinancialHealthBannerProps {
  liquidez: number;
  endeudamiento: number;
  trendPatrimonio: number;
  companyId?: number;
}

const AUDIO_FILES: Record<HealthState, string> = {
  healthy: '/audio/saludable.mp3',
  watch: '/audio/observacion.mp3',
  risk: '/audio/riesgo.mp3',
};

const TONE_FREQ: Record<HealthState, number> = {
  healthy: 523,
  watch: 392,
  risk: 196,
};

const TONE_DUR: Record<HealthState, number> = {
  healthy: 0.8,
  watch: 0.6,
  risk: 1.0,
};

function computeHealth(liquidez: number, endeudamiento: number, trend: number) {
  const liqScore = Math.min(35, Math.max(0, (liquidez - 0.8) / 0.7 * 35));
  const debtScore = Math.min(35, Math.max(0, (0.9 - endeudamiento) / 0.5 * 35));
  const trendScore = Math.min(30, Math.max(0, (trend + 0.15) / 0.25 * 30));
  const score = Math.round(Math.min(100, Math.max(0, liqScore + debtScore + trendScore)));

  let state: HealthState;
  let label: string;
  let summary: string;

  if (score >= 70) {
    state = 'healthy';
    label = 'SALUDABLE';
    summary = 'La empresa mantiene una posición financiera sólida con indicadores estables.';
  } else if (score >= 40) {
    state = 'watch';
    label = 'EN OBSERVACIÓN';
    summary = 'Algunos indicadores requieren monitoreo constante en los próximos periodos.';
  } else {
    state = 'risk';
    label = 'EN RIESGO';
    summary = 'Múltiples indicadores financieros muestran señales de alerta significativas.';
  }

  return { score, state, label, summary, liqScore, debtScore, trendScore };
}

const config: Record<HealthState, { bar: string; text: string; bg: string; border: string; icon: string }> = {
  healthy: {
    bar: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-500/5',
    border: 'border-emerald-200 dark:border-emerald-500/20',
    icon: 'text-emerald-500',
  },
  watch: {
    bar: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-500/5',
    border: 'border-amber-200 dark:border-amber-500/20',
    icon: 'text-amber-500',
  },
  risk: {
    bar: 'bg-red-500',
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-500/5',
    border: 'border-red-200 dark:border-red-500/20',
    icon: 'text-red-500',
  },
};

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

const stateIcons: Record<HealthState, typeof ShieldIcon> = {
  healthy: ShieldIcon,
  watch: EyeIcon,
  risk: AlertIcon,
};

export default function FinancialHealthBanner({ liquidez, endeudamiento, trendPatrimonio, companyId }: FinancialHealthBannerProps) {
  const playedRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const { score, state, label, summary } = useMemo(
    () => computeHealth(liquidez, endeudamiento, trendPatrimonio),
    [liquidez, endeudamiento, trendPatrimonio],
  );

  const styles = config[state];
  const StateIcon = stateIcons[state];

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const playTone = useCallback((s: HealthState) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (ctx.state === 'closed') return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = TONE_FREQ[s];
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + TONE_DUR[s]);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + TONE_DUR[s]);
      console.log(`[FinancialHealthBanner] Tone OK: ${s} (${TONE_FREQ[s]}Hz)`);
    } catch (e) {
      console.log('[FinancialHealthBanner] Web Audio fallback failed:', e);
    }
  }, []);

  const playMp3 = useCallback((s: HealthState) => {
    stopAudio();
    const audio = new Audio(AUDIO_FILES[s]);
    audio.volume = 0.5;
    audioRef.current = audio;
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => console.log(`[FinancialHealthBanner] MP3 OK: ${AUDIO_FILES[s]}`))
        .catch((err) => {
          console.log(`[FinancialHealthBanner] MP3 fail: ${err.message} → Web Audio fallback`);
          playTone(s);
        });
    }
  }, [stopAudio, playTone]);

  useEffect(() => {
    const key = companyId ?? 0;
    if (playedRef.current === key) return;
    playedRef.current = key;

    console.log(`[FinancialHealthBanner] Company #${key} | state=${state} | score=${score} | liq=${liquidez.toFixed(2)} | end=${endeudamiento.toFixed(3)} | trend=${(trendPatrimonio * 100).toFixed(1)}%`);
    playMp3(state);
  }, [state, companyId, liquidez, endeudamiento, trendPatrimonio, score, playMp3]);

  useEffect(() => {
    const handler = () => {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    };
    document.addEventListener('click', handler, { once: true });
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopAudio]);

  return (
    <div className={`rounded-2xl border ${styles.border} ${styles.bg} p-4 sm:p-5 shadow-sm`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.bg} ${styles.icon}`}>
            <StateIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black leading-none ${styles.text}`}>{score}</span>
              <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">/100</span>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${styles.bg} ${styles.text}`}>
                {label}
              </span>
            </div>
            <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 max-w-lg">{summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Liquidez</p>
            <p className="font-bold text-gray-900 dark:text-white">{liquidez.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Endeudamiento</p>
            <p className="font-bold text-gray-900 dark:text-white">{(endeudamiento * 100).toFixed(0)}%</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Var. Patrimonial</p>
            <p className={`font-bold ${trendPatrimonio >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendPatrimonio >= 0 ? '+' : ''}{(trendPatrimonio * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/80 dark:bg-gray-900/50">
        <div className={`h-full rounded-full transition-all duration-700 ${styles.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
