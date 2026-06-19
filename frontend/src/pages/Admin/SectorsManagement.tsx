import React, { useState, useCallback, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useUIFeedback } from '../../context/UIFeedbackContext';
import apiClient from '../../api/client';
import { createSector, updateSector, deleteSector } from '../../services/apiServices';
import type { PaginatedResponse, SectorEmpresa } from '../../types/api';

const StatusBadge: React.FC<{ activo: boolean }> = ({ activo }) => (
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

const SkeletonRow: React.FC = () => (
  <tr>
    {[1, 2, 3, 4].map((i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </td>
    ))}
  </tr>
);

const SectorsManagement: React.FC = () => {
  const { notify, confirm } = useUIFeedback();
  const [page, setPage] = useState(1);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchSectores = useCallback(
    () => apiClient.get<PaginatedResponse<SectorEmpresa>>('/sectores/', { params: { page } }).then((r) => r.data),
    [page]
  );

  const { data, isLoading, error, refetch } = useApi<PaginatedResponse<SectorEmpresa>>(fetchSectores, [fetchSectores]);

  const sectores = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 10);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createSector({ nombre: nombre.trim(), descripcion: descripcion.trim() || null });
      setNombre('');
      setDescripcion('');
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el sector.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const [editingSector, setEditingSector] = useState<SectorEmpresa | null>(null);

  const handleToggleActive = async (sector: SectorEmpresa) => {
    try {
      await apiClient.patch(`/sectores/${sector.id_sector}/`, { activo: !sector.activo });
      refetch();
    } catch {
      notify('Error al cambiar el estado del sector.', 'error');
    }
  };

  const handleDeleteSector = async (sector: SectorEmpresa) => {
    const ok = await confirm({
      title: 'Eliminar sector',
      message: `¿Eliminar el sector "${sector.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteSector(sector.id_sector);
      refetch();
      notify('Sector eliminado correctamente.', 'success');
    } catch {
      notify('Error al eliminar el sector.', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gesti&oacute;n de Sectores</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Cargando registros\u2026' : `${totalCount} sector${totalCount !== 1 ? 'es' : ''} encontrado${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Nuevo Sector</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Nombre del sector"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
          <input
            type="text"
            placeholder="Descripci&oacute;n (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={submitting || !nombre.trim()}
            className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 hover:bg-brand-600 transition-all"
          >
            {submitting ? 'Creando\u2026' : 'Crear Sector'}
          </button>
        </div>
        {submitError && (
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        )}
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {['Nombre', 'Descripci&oacute;n', 'Estado', 'Creado', ''].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                : sectores.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400 italic">
                      No hay sectores registrados.
                    </td>
                  </tr>
                )
                : sectores.map((s) => (
                  <tr key={s.id_sector} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setEditingSector(s)}
                        className="font-bold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors text-left"
                      >
                        {s.nombre}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {s.descripcion || '\u2014'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge activo={s.activo} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(s.created_at).toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleDeleteSector(s)}
                          className="rounded-xl p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all"
                          title="Eliminar"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                            s.activo
                              ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
                          }`}
                        >
                          {s.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-900/30">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              P&aacute;gina {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                &larr; Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Siguiente &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
      {editingSector && <EditSectorModal sector={editingSector} onClose={() => setEditingSector(null)} onSaved={refetch} />}
    </div>
  );
};

function EditSectorModal({ sector, onClose, onSaved }: { sector: SectorEmpresa; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(sector.nombre);
  const [descripcion, setDescripcion] = useState(sector.descripcion ?? '');
  const [activo, setActivo] = useState(sector.activo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await updateSector(sector.id_sector, { nombre: nombre.trim(), descripcion: descripcion.trim() || null, activo });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el sector.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="shrink-0 border-b border-gray-100 px-6 py-5 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">Editar Sector</h2>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
            <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-brand-500/20" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Descripción</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-brand-500/20 resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="sector-activo" checked={activo} onChange={(e) => setActivo(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
            <label htmlFor="sector-activo" className="text-sm font-medium text-gray-900 dark:text-white">Activo</label>
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

export default SectorsManagement;
