import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { getCurrentUser, completarPerfil, getEmpresas } from '../../services/apiServices';
import type { CompleteProfilePayload } from '../../services/apiServices';
import type { Usuario, Empresa, PaginatedResponse } from '../../types/api';
import Watchlist from '../../components/financials/Watchlist';

type RiskLevel = 'conservador' | 'moderado' | 'agresivo';

interface UserPreferences {
  riskProfile: RiskLevel;
  favoriteSectors: string[];
  notifications: { email: boolean; sms: boolean; push: boolean };
  language: 'es' | 'en';
  reportFrequency: 'diario' | 'semanal' | 'mensual';
}

const AVATAR_KEY = 'bbv-avatar';
const PREFERENCES_KEY = 'bbv-user-preferences';
const WATCHLIST_KEY = 'bbv-investor-watchlist';

function ProfileAvatar({ avatar, onAvatarChange }: { avatar: string | null; onAvatarChange: (dataUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAvatarChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative group">
      <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        {avatar ? (
          <img src={avatar} alt="Avatar" className="object-cover w-full h-full" />
        ) : (
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center"
      >
        <span className="text-white text-[10px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
          Editar
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 rounded-full transition-all ${
        checked ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useApi<Usuario>(getCurrentUser, []);
  const { data: companiesData } = useApi<PaginatedResponse<Empresa>>(() => getEmpresas({ page_size: 100 }), []);

  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));
  const [formData, setFormData] = useState<CompleteProfilePayload>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          riskProfile: 'moderado',
          favoriteSectors: [],
          notifications: { email: true, sms: false, push: true },
          language: 'es',
          reportFrequency: 'semanal',
        };
  });

  const [watchlistIds, setWatchlistIds] = useState<number[]>(() => {
    const saved = localStorage.getItem(WATCHLIST_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        apellido_paterno: user.apellido_paterno || '',
        apellido_materno: user.apellido_materno || '',
        email: user.email || '',
        ci: user.ci || '',
        celular: user.celular || '',
        fecha_nacimiento: user.fecha_nacimiento || '',
      });
    }
  }, [user]);

  const handleAvatarChange = (dataUrl: string) => {
    setAvatar(dataUrl);
    localStorage.setItem(AVATAR_KEY, dataUrl);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await completarPerfil(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Error al guardar. Intente nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  };

  const handleNotifChange = (key: 'email' | 'sms' | 'push', value: boolean) => {
    const next = { ...preferences, notifications: { ...preferences.notifications, [key]: value } };
    setPreferences(next);
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  };

  const handleWatchlistRemove = (id: number) => {
    const next = watchlistIds.filter((wid) => wid !== id);
    setWatchlistIds(next);
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  };

  const watchlistCompanies = useMemo(
    () => (companiesData?.results || []).filter((c) => watchlistIds.includes(c.id_empresa)),
    [companiesData, watchlistIds],
  );

  const initials = user ? `${(user.nombre || user.username || '?').slice(0, 1)}${(user.apellido_paterno || '').slice(0, 1)}`.toUpperCase() : '';

  if (userLoading) return <div className="p-10 animate-pulse text-gray-400">Cargando perfil terminal...</div>;
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <ProfileAvatar avatar={avatar} onAvatarChange={handleAvatarChange} />
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Centro de Identidad</h1>
            <p className="text-sm text-gray-500 font-medium">Configuración de cuenta y preferencias de inversión</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg">
            {avatar ? <img src={avatar} alt="" className="w-full h-full rounded-xl object-cover" /> : initials}
          </div>
          <div className="pr-4">
            <p className="text-xs font-black text-gray-900 dark:text-white leading-none uppercase">{user.nombre || user.username}</p>
            <p className="text-[10px] font-bold text-brand-500 uppercase tracking-widest mt-1">{user.group_names?.[0]}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ─── Left Column ─── */}
        <div className="xl:col-span-2 space-y-8">
          {/* Personal Data */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Información Personal</h2>
              {saveSuccess && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Guardado</span>}
            </div>
            <form onSubmit={handleProfileSave} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {([
                { id: 'nombre', label: 'Nombre' } as const,
                { id: 'apellido_paterno', label: 'Apellido Paterno' } as const,
                { id: 'apellido_materno', label: 'Apellido Materno' } as const,
                { id: 'email', label: 'Email', disabled: true } as const,
                { id: 'ci', label: 'Cédula de Identidad' } as const,
                { id: 'celular', label: 'Teléfono / Celular' } as const,
                { id: 'fecha_nacimiento', label: 'Fecha Nacimiento', type: 'date' } as const,
                { id: 'direccion', label: 'Dirección', placeholder: 'No disponible en backend' } as const,
              ]).map((f) => (
                <div key={f.id} className={f.id === 'direccion' ? 'md:col-span-2' : ''}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{f.label}</label>
                  <input
                    type={'type' in f ? f.type : 'text'}
                    disabled={'disabled' in f ? f.disabled : undefined}
                    placeholder={'placeholder' in f ? f.placeholder : ''}
                    value={(formData as any)[f.id] || ''}
                    onChange={(e) => setFormData({ ...formData, [f.id]: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white focus:ring-4 focus:ring-brand-500/10 outline-none transition-all disabled:opacity-50 placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  />
                </div>
              ))}
              {saveError && <p className="md:col-span-2 text-xs font-bold text-red-500">{saveError}</p>}
              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-brand-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all disabled:opacity-50"
                >
                  {saving ? 'Procesando...' : 'Actualizar Perfil'}
                </button>
              </div>
            </form>
          </section>

          {/* Security */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Seguridad</h2>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
              <div className="flex gap-4 items-center">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-400">Cambio de Contraseña</p>
                  <p className="text-xs text-amber-700 dark:text-amber-500/80">Recomendado cada 90 días para cumplimiento</p>
                </div>
              </div>
              <button disabled className="text-xs font-black uppercase tracking-widest text-amber-600 opacity-50 cursor-not-allowed">
                Habilitar
              </button>
            </div>
          </section>
        </div>

        {/* ─── Right Column ─── */}
        <div className="space-y-8">
          {/* Risk Profile */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Perfil de Inversión</h2>
            <div className="space-y-4">
              {([
                { id: 'conservador', label: 'Conservador', desc: 'Prioriza estabilidad y preservación.' },
                { id: 'moderado', label: 'Moderado', desc: 'Balance entre riesgo y retorno.' },
                { id: 'agresivo', label: 'Agresivo', desc: 'Maximiza proyecciones de crecimiento.' },
              ] as const).map((lvl) => (
                <button
                  key={lvl.id}
                  onClick={() => handlePreferenceChange('riskProfile', lvl.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    preferences.riskProfile === lvl.id
                      ? 'border-brand-500 bg-brand-500/5 ring-4 ring-brand-500/5'
                      : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  <p
                    className={`text-sm font-black uppercase ${
                      preferences.riskProfile === lvl.id ? 'text-brand-600' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {lvl.label}
                  </p>
                  <p className="text-[10px] text-gray-500 font-medium mt-1">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Preferences */}
          <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Preferencias</h2>

            <div className="space-y-5">
              {/* Language */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Idioma</p>
                <select
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value as 'es' | 'en')}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white outline-none"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              {/* Report frequency */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Frecuencia de Reportes</p>
                <select
                  value={preferences.reportFrequency}
                  onChange={(e) => handlePreferenceChange('reportFrequency', e.target.value as 'diario' | 'semanal' | 'mensual')}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white outline-none"
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              {/* Notifications */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Notificaciones</p>
                <div className="space-y-3">
                  {([
                    { key: 'email', label: 'Correo electrónico' },
                    { key: 'sms', label: 'SMS' },
                    { key: 'push', label: 'Push' },
                  ] as const).map((n) => (
                    <div key={n.key} className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{n.label}</span>
                      <Toggle checked={preferences.notifications[n.key]} onChange={(v) => handleNotifChange(n.key, v)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Watchlist */}
          <Watchlist
            companies={watchlistCompanies}
            selectedCompanyId={null}
            onSelect={(id) => navigate(`/company/${id}`)}
            onRemove={handleWatchlistRemove}
          />
        </div>
      </div>
    </div>
  );
}
