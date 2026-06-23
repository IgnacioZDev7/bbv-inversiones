import { useState, useEffect, useRef } from 'react';
import { useApi } from '../../hooks/useApi';
import { useUIFeedback } from '../../context/UIFeedbackContext';
import { getCurrentUser, completarPerfil, cambiarPassword } from '../../services/apiServices';
import type { CompleteProfilePayload } from '../../services/apiServices';
import type { Usuario } from '../../types/api';
import GradientText from '../../components/common/GradientText';
import RippleButton from '../../components/common/RippleButton';

const AVATAR_KEY = 'bbv-avatar';

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

export default function CompleteProfile() {
  const { notify } = useUIFeedback();
  const { data: user, isLoading: userLoading } = useApi<Usuario>(getCurrentUser, []);

  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem(AVATAR_KEY));
  const [formData, setFormData] = useState<CompleteProfilePayload>({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

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
    } catch (e: any) {
      const detail =
        e.response?.data &&
        typeof e.response.data === 'object' &&
        !Array.isArray(e.response.data)
          ? Object.entries(e.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
              .join('. ')
          : e.response?.data || e.message || 'Error al guardar.';
      setSaveError(detail);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      notify('La contraseña debe tener al menos 8 caracteres.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      notify('Las contraseñas no coinciden.', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await cambiarPassword(newPassword);
      notify('Contraseña actualizada correctamente.', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      notify('Error al cambiar la contraseña.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = user ? `${(user.nombre || user.username || '?').slice(0, 1)}${(user.apellido_paterno || '').slice(0, 1)}`.toUpperCase() : '';

  if (userLoading) return <div className="p-10 animate-pulse text-gray-400">Cargando perfil...</div>;
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          <ProfileAvatar avatar={avatar} onAvatarChange={handleAvatarChange} />
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight">
              <GradientText>Mi Perfil</GradientText>
            </h1>
            <p className="text-sm text-gray-500 font-medium">Configuración de cuenta</p>
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

      {/* Información Personal */}
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
            <RippleButton
              type="submit"
              disabled={saving}
              className="px-8 py-3 bg-brand-500 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all disabled:opacity-50"
            >
              {saving ? 'Procesando...' : 'Actualizar Perfil'}
            </RippleButton>
          </div>
        </form>
      </section>

      {/* Seguridad */}
      <section className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm p-8">
        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Seguridad</h2>
        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white focus:ring-4 focus:ring-brand-500/10 outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-bold text-gray-700 dark:text-white focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
            />
          </div>
          <div className="md:col-span-2">
            <RippleButton
              type="submit"
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="px-8 py-3 bg-gray-900 dark:bg-white/10 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 dark:hover:bg-white/20 transition-all disabled:opacity-50"
            >
              {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </RippleButton>
          </div>
        </form>
      </section>
    </div>
  );
}
