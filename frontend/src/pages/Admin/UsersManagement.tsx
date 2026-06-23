import { useState, useMemo, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useUIFeedback } from '../../context/UIFeedbackContext';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, cambiarGrupoUsuario } from '../../services/apiServices';
import type { Usuario, PaginatedResponse } from '../../types/api';
import { StaggerRow, StaggerItem } from '../../components/common/Stagger';

function StatusBadge({ activo }: { activo: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        activo
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${activo ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  );
}

const GROUP_OPTIONS = ['Administrador', 'Analista', 'Auditor', 'Inversionista'];

interface UserModalProps {
  mode: 'create' | 'edit';
  usuario: Usuario | null;
  onClose: () => void;
  onSaved: () => void;
}

function UserModal({ mode, usuario, onClose, onSaved }: UserModalProps) {
  const [username, setUsername] = useState(usuario?.username ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [nombre, setNombre] = useState(usuario?.nombre ?? '');
  const [password, setPassword] = useState('');
  const [grupo, setGrupo] = useState(usuario?.group_names?.[0] ?? GROUP_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (mode === 'create') {
        const created = await createUsuario({
          username,
          email,
          nombre: nombre || undefined,
          password: password,
        } as Partial<Usuario> & { password?: string });
        await cambiarGrupoUsuario(created.id_usuario, grupo);
      } else if (usuario) {
        await updateUsuario(usuario.id_usuario, {
          email,
          nombre: nombre || undefined,
        });
        const currentRole = usuario.group_names?.[0];
        if (currentRole !== grupo) {
          await cambiarGrupoUsuario(usuario.id_usuario, grupo);
        }
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el usuario.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="shrink-0 border-b border-gray-100 px-6 py-5 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">
          {mode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
        </h2>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {mode === 'create' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Username *</label>
              <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-brand-500/20" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-brand-500/20" />
          </div>
          {mode === 'create' && (
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Contraseña *</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-brand-500/20" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Grupo / Rol</label>
            <select value={grupo} onChange={(e) => setGrupo(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none transition-all focus:ring-2 focus:ring-brand-500/20">
              {GROUP_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
          <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-600 transition-all">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserCard({ u, onToggle, onEdit, onDelete, onRefetch }: { u: Usuario; onToggle: () => void; onEdit: () => void; onDelete: () => void; onRefetch: () => void; }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
          {(u.nombre || u.username || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{u.nombre || u.username}</p>
          <p className="truncate text-xs text-gray-500">@{u.username} · {u.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <select
              value={u.group_names?.[0] || ''}
              onChange={async (e) => {
                const newRole = e.target.value;
                if (newRole && newRole !== u.group_names?.[0]) {
                  await cambiarGrupoUsuario(u.id_usuario, newRole);
                  onRefetch();
                }
              }}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300 outline-none"
            >
              {GROUP_OPTIONS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <StatusBadge activo={u.activo} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-all"
          title="Editar"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="rounded-xl p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
          title="Eliminar"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button
          onClick={onToggle}
          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
            u.activo
              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
          }`}
        >
          {u.activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}

const UsersManagement = () => {
  const { notify, confirm } = useUIFeedback();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  const { data, isLoading, error, refetch } = useApi<PaginatedResponse<Usuario>>(
    () => getUsuarios({ page }),
    [page]
  );

  const usuarios = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 10);

  const allGroups = useMemo(() => {
    const groups = new Set<string>();
    usuarios.forEach((u) => u.group_names?.forEach((g) => groups.add(g)));
    return Array.from(groups).sort();
  }, [usuarios]);

  const filtered = useMemo(() => {
    let result = usuarios;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.nombre?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)
      );
    }
    if (groupFilter) {
      result = result.filter((u) => u.group_names?.includes(groupFilter));
    }
    return result;
  }, [usuarios, search, groupFilter]);

  const handleToggleActive = async (usuario: Usuario) => {
    try {
      const { default: apiClient } = await import('../../api/client');
      await apiClient.patch(`/usuarios/${usuario.id_usuario}/`, { activo: !usuario.activo });
      refetch();
    } catch {
      notify('Error al cambiar el estado del usuario.', 'error');
    }
  };

  const handleDelete = async (usuario: Usuario) => {
    const ok = await confirm({
      title: 'Eliminar usuario',
      message: `¿Eliminar usuario "${usuario.nombre || usuario.username}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteUsuario(usuario.id_usuario);
      refetch();
      notify('Usuario eliminado correctamente.', 'success');
    } catch {
      notify('Error al eliminar el usuario.', 'error');
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Cargando...' : `${totalCount} usuario${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row">
        <button
          onClick={() => { setEditingUser(null); setShowModal(true); }}
          className="shrink-0 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all"
        >
          + Crear Usuario
        </button>
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, email o usuario..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
        </div>
        <select
          value={groupFilter}
          onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none transition-all focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        >
          <option value="">Todos los grupos</option>
          {allGroups.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Email</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Grupo / Rol</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">Creado</th>
              <th className="px-4 py-3 whitespace-nowrap" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-700" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm italic text-gray-400">
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              filtered.map((u, idx) => (
                <StaggerRow index={idx} key={u.id_usuario} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                        {(u.nombre || u.username || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{u.nombre || u.username}</p>
                        <p className="truncate text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.group_names?.[0] || ''}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        if (newRole && newRole !== u.group_names?.[0]) {
                          await cambiarGrupoUsuario(u.id_usuario, newRole);
                          refetch();
                        }
                      }}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 outline-none transition-all focus:ring-2 focus:ring-brand-500/20"
                    >
                      {GROUP_OPTIONS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3"><StatusBadge activo={u.activo} /></td>
                  <td className="truncate px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(u.created_at).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setEditingUser(u); setShowModal(true); }}
                        className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-all"
                        title="Editar"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="rounded-xl p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
                        title="Eliminar"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          u.activo
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
                        }`}
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </StaggerRow>
              ))
            )}
          </tbody>
        </table>

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                &larr; Anterior
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
                Siguiente &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-sm italic text-gray-400">No se encontraron usuarios.</p>
        ) : (
          filtered.map((u, idx) => (
            <StaggerItem key={u.id_usuario} index={idx}>
              <UserCard u={u} onToggle={() => handleToggleActive(u)} onEdit={() => { setEditingUser(u); setShowModal(true); }} onDelete={() => handleDelete(u)} onRefetch={refetch} />
            </StaggerItem>
          ))
        )}

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                &larr;
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition-all hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          mode={editingUser ? 'edit' : 'create'}
          usuario={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }}
          onSaved={refetch}
        />
      )}
    </div>
  );
};

export default UsersManagement;
