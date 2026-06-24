import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useApi } from '../../hooks/useApi';
import { useUIFeedback } from '../../context/UIFeedbackContext';
import { getEmpresas, getAllSectores, createEmpresa, updateEmpresa, deleteEmpresa } from '../../services/apiServices';
import type { Empresa, PaginatedResponse, SectorEmpresa } from '../../types/api';
import { StaggerRow } from '../../components/common/Stagger';
import RippleButton from '../../components/common/RippleButton';

// ── Badges de estado ────────────────────────────────────────────
const StatusBadge: React.FC<{ activa: boolean }> = ({ activa }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
      activa
        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    }`}
  >
    <span className={`h-1.5 w-1.5 rounded-full ${activa ? 'bg-emerald-500' : 'bg-gray-400'}`} />
    {activa ? 'Activa' : 'Inactiva'}
  </span>
);

// ── Skeleton row ────────────────────────────────────────────────
const SkeletonRow: React.FC = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6].map((i) => (
      <td key={i} className="px-6 py-4">
        <div className="h-4 rounded bg-gray-100 dark:bg-gray-700 animate-pulse" />
      </td>
    ))}
  </tr>
);

// ── Companies Management ────────────────────────────────────────
const CompaniesManagement: React.FC = () => {
  const navigate = useNavigate();
  const { notify, confirm } = useUIFeedback();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<number | ''>('');
  const [page, setPage] = useState(1);

  // Modal empresa
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    codigo_bbv: '',
    sigla: '',
    sector: '',
    descripcion: '',
    sitio_web: '',
    activa: true,
  });
  const [saving, setSaving] = useState(false);

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    if (modalOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [modalOpen]);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Sectores para el filtro desplegable (todos, sin paginar)
  const { data: sectores } = useApi<SectorEmpresa[]>(
    () => getAllSectores(),
    []
  );

  // Empresas paginadas con filtros (usando backend search)
  const fetchEmpresas = useCallback(
    () =>
      getEmpresas({
        sector: sectorFilter !== '' ? sectorFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        page_size: 15,
      }),
    [sectorFilter, debouncedSearch, page]
  );

  const { data, isLoading, error, refetch } = useApi<PaginatedResponse<Empresa>>(fetchEmpresas, [fetchEmpresas]);

  const empresas = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 15);

  const handleSectorChange = (val: string) => {
    setSectorFilter(val === '' ? '' : Number(val));
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  // ── Modal handlers ──────────────────────────────────────
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ nombre: '', codigo_bbv: '', sigla: '', sector: '', descripcion: '', sitio_web: '', activa: true });
    setModalOpen(true);
  };

  const openEditModal = (emp: Empresa) => {
    setEditingId(emp.id_empresa);
    setFormData({
      nombre: emp.nombre,
      codigo_bbv: emp.codigo_bbv,
      sigla: emp.sigla ?? '',
      sector: String(emp.sector),
      descripcion: emp.descripcion ?? '',
      sitio_web: emp.sitio_web ?? '',
      activa: emp.activa,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: formData.nombre,
        codigo_bbv: formData.codigo_bbv,
        sector: Number(formData.sector),
        activa: formData.activa,
      };
      if (formData.sigla) payload.sigla = formData.sigla;
      if (formData.descripcion) payload.descripcion = formData.descripcion;
      if (formData.sitio_web) payload.sitio_web = formData.sitio_web;

      if (editingId !== null) {
        await updateEmpresa(editingId, payload);
      } else {
        await createEmpresa(payload);
      }
      setModalOpen(false);
      refetch();
      notify(editingId !== null ? 'Empresa actualizada correctamente.' : 'Empresa creada correctamente.', 'success');
    } catch {
      notify('Error al guardar la empresa.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (emp: Empresa) => {
    try {
      await updateEmpresa(emp.id_empresa, { activa: !emp.activa });
      refetch();
    } catch {
      notify('Error al cambiar el estado de la empresa.', 'error');
    }
  };

  const handleDelete = async (emp: Empresa) => {
    const ok = await confirm({
      title: 'Eliminar empresa',
      message: `¿Estás seguro de eliminar "${emp.nombre}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await deleteEmpresa(emp.id_empresa);
      refetch();
      notify('Empresa eliminada correctamente.', 'success');
    } catch {
      notify('Error al eliminar la empresa.', 'error');
    }
  };

  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Directorio de Empresas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isLoading ? 'Cargando registros…' : `${totalCount} entidad${totalCount !== 1 ? 'es' : ''} encontrada${totalCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <RippleButton
          onClick={openCreateModal}
          className="shrink-0 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600 active:scale-95 transition-all"
        >
          + Crear Empresa
        </RippleButton>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, código o sigla…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 py-2.5 pl-9 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
        </div>
        <select
          value={sectorFilter}
          onChange={(e) => handleSectorChange(e.target.value)}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all min-w-[200px]"
        >
          <option value="">Todos los sectores</option>
          {sectores?.map((s) => (
            <option key={s.id_sector} value={s.id_sector}>
              {s.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {['Empresa', 'Código BBV', 'Sigla', 'Sector', 'Estado', 'Acciones'].map((h) => (
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
                : empresas.length === 0
                ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 italic">
                      No se encontraron empresas con los criterios de búsqueda.
                    </td>
                  </tr>
                )
                : empresas.map((emp, idx) => (
                  <StaggerRow
                    index={idx}
                    key={emp.id_empresa}
                    onClick={() => navigate(`/admin/companies/${emp.id_empresa}`)}
                    className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-white">{emp.nombre}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500 dark:text-gray-400">
                      {emp.codigo_bbv}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {emp.sigla ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {emp.sector_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge activa={emp.activa} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditModal(emp); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand-500 transition-all"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleActive(emp); }}
                          className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${emp.activa ? 'text-amber-500 hover:text-amber-600' : 'text-emerald-500 hover:text-emerald-600'}`}
                          title={emp.activa ? 'Desactivar' : 'Activar'}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(emp); }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500 transition-all"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </StaggerRow>
                ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-900/30">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                ← Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modal Crear / Editar Empresa ──────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="shrink-0 border-b border-gray-100 px-6 py-5 text-lg font-bold text-gray-900 dark:border-gray-700 dark:text-white">
              {editingId !== null ? 'Editar Empresa' : 'Crear Empresa'}
            </h2>

            <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  required
                />
              </div>

              {/* Código BBV */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Código BBV *</label>
                <input
                  type="text"
                  value={formData.codigo_bbv}
                  onChange={(e) => updateField('codigo_bbv', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  required
                />
              </div>

              {/* Sigla */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Sigla</label>
                <input
                  type="text"
                  value={formData.sigla}
                  onChange={(e) => updateField('sigla', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>

              {/* Sector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Sector *</label>
                <select
                  value={formData.sector}
                  onChange={(e) => updateField('sector', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  required
                >
                  <option value="">Seleccionar sector</option>
                  {sectores?.map((s) => (
                    <option key={s.id_sector} value={s.id_sector}>{s.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
                />
              </div>

              {/* Sitio Web */}
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5">Sitio Web</label>
                <input
                  type="url"
                  value={formData.sitio_web}
                  onChange={(e) => updateField('sitio_web', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  placeholder="https://"
                />
              </div>

              {/* Activa */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.activa}
                  onChange={(e) => updateField('activa', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Empresa activa</span>
              </label>
            </div>

            {/* Botones */}
            <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-700">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.nombre || !formData.codigo_bbv || !formData.sector}
                className="px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompaniesManagement;
