import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BiometricProgressSphere from './BiometricProgressSphere';

interface BiometricFaceGuideProps {
  onCaptureComplete: (frontalImage: File) => void;
  onError: (message: string) => void;
}

type CapturePhase =
  | 'requesting'
  | 'front-countdown'
  | 'left-countdown'
  | 'right-countdown'
  | 'complete'
  | 'error';

type NodePosition = 'front' | 'left' | 'right';

interface NodeState {
  position: NodePosition;
  label: string;
  status: 'pending' | 'active' | 'captured';
  instruction: string;
}

const NODE_CONFIG: NodeState[] = [
  { position: 'front', label: 'Frente', status: 'pending', instruction: 'Mire al frente' },
  { position: 'left', label: 'Izquierda', status: 'pending', instruction: 'Gire lentamente hacia la izquierda' },
  { position: 'right', label: 'Derecha', status: 'pending', instruction: 'Gire lentamente hacia la derecha' },
];

function playCaptureSound(ctx: AudioContext | null) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);
}

function playSuccessSound(ctx: AudioContext | null) {
  if (!ctx) return;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
    gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.25);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.25);
  });
}

function CircleCheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function FaceIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

export default function BiometricFaceGuide({ onCaptureComplete, onError }: BiometricFaceGuideProps) {
  const [phase, setPhase] = useState<CapturePhase>('requesting');
  const [countdown, setCountdown] = useState(3);
  const [nodes, setNodes] = useState<NodeState[]>(NODE_CONFIG);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [leftPreview, setLeftPreview] = useState<string | null>(null);
  const [rightPreview, setRightPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const completedRef = useRef(false);
  const initIdRef = useRef(0);

  const updateNodeStatus = useCallback((position: NodePosition, status: NodeState['status']) => {
    setNodes(prev => prev.map(n => n.position === position ? { ...n, status } : n));
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.95);
  }, []);

  const dataUrlToFile = useCallback((dataUrl: string, name: string): File => {
    const byteString = atob(dataUrl.split(',')[1]);
    const mimeString = dataUrl.split(',')[0].match(/:(.*?);/)![1];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new File([ab], name, { type: mimeString });
  }, []);

  const completePhaseCapture = useCallback((position: NodePosition, nextPhase: CapturePhase) => {
    if (completedRef.current) return;
    completedRef.current = true;

    playCaptureSound(audioCtxRef.current);
    const dataUrl = captureFrame();
    if (!dataUrl) {
      completedRef.current = false;
      return;
    }
    if (position === 'front') setFrontPreview(dataUrl);
    else if (position === 'left') setLeftPreview(dataUrl);
    else setRightPreview(dataUrl);
    updateNodeStatus(position, 'captured');

    // Pre-activate next node and reset countdown to avoid visual gaps
    if (nextPhase === 'left-countdown') {
      updateNodeStatus('left', 'active');
      setCountdown(3);
    } else if (nextPhase === 'right-countdown') {
      updateNodeStatus('right', 'active');
      setCountdown(3);
    }

    if (nextPhase === 'complete') {
      setPhase('complete');
    } else {
      setPhase(nextPhase);
    }
    completedRef.current = false;
  }, [captureFrame, updateNodeStatus]);

  const startPhaseTimer = useCallback((
    targetPhase: CapturePhase,
    nextPhase: CapturePhase,
    position: NodePosition,
  ) => {
    completedRef.current = false;
    setCountdown(3);
    setPhase(targetPhase);
    updateNodeStatus(position, 'active');

    let count = 3;
    const intervalId = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(intervalId);
        completePhaseCapture(position, nextPhase);
      }
    }, 1000);
  }, [completePhaseCapture, updateNodeStatus]);

  useEffect(() => {
    const id = ++initIdRef.current;
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (id !== initIdRef.current) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setTimeout(() => startPhaseTimer('front-countdown', 'left-countdown', 'front'), 800);
      } catch (e: any) {
        if (id === initIdRef.current) {
          setPhase('error');
          onError(e.message || 'No se pudo acceder a la cámara.');
        }
      }
    };
    startCamera();

    return () => {
      initIdRef.current += 1;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (phase === 'left-countdown') {
      if (!completedRef.current) startPhaseTimer('left-countdown', 'right-countdown', 'left');
    }
    if (phase === 'right-countdown') {
      if (!completedRef.current) startPhaseTimer('right-countdown', 'complete', 'right');
    }
    if (phase === 'complete') {
      playSuccessSound(audioCtxRef.current);
      const t = setTimeout(() => {
        if (frontPreview) {
          const file = dataUrlToFile(frontPreview, 'selfie.jpg');
          onCaptureComplete(file);
        }
      }, 500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleRetry = () => {
    let lastCompleteIdx = -1;
    nodes.forEach((n, i) => { if (n.status === 'captured') lastCompleteIdx = i; });
    if (lastCompleteIdx === -1 || lastCompleteIdx >= nodes.length - 1) {
      startPhaseTimer('front-countdown', 'left-countdown', 'front');
    } else {
      const next = nodes[lastCompleteIdx + 1];
      const nextPh = next.position === 'front' ? 'front-countdown' : next.position === 'left' ? 'left-countdown' : 'right-countdown';
      const afterNext = next.position === 'front' ? 'left-countdown' : next.position === 'left' ? 'right-countdown' : 'complete';
      startPhaseTimer(nextPh as CapturePhase, afterNext as CapturePhase, next.position);
    }
  };

  const currentInst = nodes.find(n => n.status === 'active')?.instruction || '';

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <canvas ref={canvasRef} className="hidden" />

      {/* Left Column: Camera */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="relative w-full max-w-[400px] aspect-[4/3] rounded-2xl overflow-hidden bg-gray-900 shadow-2xl">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ${phase === 'complete' ? 'opacity-60 scale-105' : 'opacity-100'}`}
          />

          {/* Circular face guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <motion.div
                className={`w-40 h-48 rounded-full border-2 transition-colors duration-500 ${
                  phase === 'complete'
                    ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.4)]'
                    : phase === 'front-countdown' || phase === 'left-countdown' || phase === 'right-countdown'
                      ? 'border-brand-400 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                      : 'border-white/30'
                }`}
                animate={
                  phase === 'front-countdown' || phase === 'left-countdown' || phase === 'right-countdown'
                    ? { scale: [1, 1.03, 1], borderColor: ['rgba(255,255,255,0.3)', 'rgba(99,102,241,0.7)', 'rgba(255,255,255,0.3)'] }
                    : {}
                }
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="absolute inset-0 -m-40 rounded-full bg-gray-950/40 pointer-events-none"
                style={{ mask: 'radial-gradient(ellipse 80px 96px at center, transparent 60%, black 61%)', WebkitMask: 'radial-gradient(ellipse 80px 96px at center, transparent 60%, black 61%)' }}
              />

              <AnimatePresence mode="wait">
                {(phase === 'front-countdown' || phase === 'left-countdown' || phase === 'right-countdown') && (
                  <motion.div
                    key={countdown}
                    initial={{ scale: 1.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="text-6xl font-black text-white drop-shadow-2xl">{countdown}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase === 'complete' && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                      <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Top status bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg bg-black/50 backdrop-blur-sm px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">En vivo</span>
            </div>
            {phase === 'complete' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="rounded-lg bg-emerald-500/80 backdrop-blur-sm px-3 py-1.5"
              >
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Completado</span>
              </motion.div>
            )}
          </div>

          {/* Bottom instruction bar */}
          {phase !== 'complete' && (
            <div className="absolute bottom-3 left-3 right-3">
              <motion.div key={phase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-black/60 backdrop-blur-sm px-4 py-2.5 text-center"
              >
                {phase === 'requesting' ? (
                  <span className="text-xs font-medium text-white flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Solicitando acceso a la cámara...
                  </span>
                ) : (
                  <span className="text-xs font-bold text-white tracking-wide">{currentInst}</span>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Position Indicator */}
      <div className="w-full lg:w-48 flex flex-col items-center justify-center gap-5">
        <BiometricProgressSphere status={phase as any} />
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Posiciones</div>

        <div className="relative flex flex-col items-center gap-3">
          {/* Front node */}
          <motion.div className="flex flex-col items-center gap-1.5"
            animate={nodes[0].status === 'active' ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 ${
                nodes[0].status === 'captured' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                nodes[0].status === 'active' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' :
                'bg-gray-100 text-gray-400 dark:bg-gray-800'
              }`}
              animate={nodes[0].status === 'active' ? { scale: [1, 1.12, 1] } : {}}
              transition={nodes[0].status === 'active' ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              {nodes[0].status === 'captured' ? <CircleCheckIcon /> : <FaceIcon />}
            </motion.div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              nodes[0].status === 'captured' ? 'text-emerald-600 dark:text-emerald-400' :
              nodes[0].status === 'active' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'
            }`}>{nodes[0].label}</span>
          </motion.div>

          <div className="flex items-center gap-8">
            {/* Left node */}
            <motion.div className="flex flex-col items-center gap-1.5"
              animate={nodes[1].status === 'active' ? { x: [0, -3, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 ${
                  nodes[1].status === 'captured' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                  nodes[1].status === 'active' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' :
                  'bg-gray-100 text-gray-400 dark:bg-gray-800'
                }`}
                animate={nodes[1].status === 'active' ? { scale: [1, 1.12, 1] } : {}}
                transition={nodes[1].status === 'active' ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                {nodes[1].status === 'captured' ? <CircleCheckIcon /> : <FaceIcon />}
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                nodes[1].status === 'captured' ? 'text-emerald-600 dark:text-emerald-400' :
                nodes[1].status === 'active' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'
              }`}>{nodes[1].label}</span>
            </motion.div>

            {/* Right node */}
            <motion.div className="flex flex-col items-center gap-1.5"
              animate={nodes[2].status === 'active' ? { x: [0, 3, 0] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 ${
                  nodes[2].status === 'captured' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                  nodes[2].status === 'active' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' :
                  'bg-gray-100 text-gray-400 dark:bg-gray-800'
                }`}
                animate={nodes[2].status === 'active' ? { scale: [1, 1.12, 1] } : {}}
                transition={nodes[2].status === 'active' ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
              >
                {nodes[2].status === 'captured' ? <CircleCheckIcon /> : <FaceIcon />}
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                nodes[2].status === 'captured' ? 'text-emerald-600 dark:text-emerald-400' :
                nodes[2].status === 'active' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'
              }`}>{nodes[2].label}</span>
            </motion.div>
          </div>
        </div>

        {phase === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 mt-2">
            <motion.button
              onClick={handleRetry}
              whileTap={{ scale: 0.95 }}
              className="rounded-xl bg-brand-500 px-5 py-2.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
            >
              Reintentar captura
            </motion.button>
          </motion.div>
        )}

        {(frontPreview || leftPreview || rightPreview) && (
          <div className="flex gap-2 mt-2">
            {[frontPreview, leftPreview, rightPreview].map((preview, i) => preview && (
              <motion.div key={i} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="h-8 w-8 rounded-lg overflow-hidden ring-2 ring-emerald-400/50"
              >
                <img src={preview} alt="" className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
