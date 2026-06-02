import { useEffect, useRef, useState, useMemo, type FC, type ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { getAllEmpresas, getAllSectores } from "../services/apiServices";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";

import {
  GridIcon,
  UserCircleIcon,
  PieChartIcon,
  ChevronDownIcon,
  AlertIcon,
  GroupIcon,
  DollarLineIcon,
} from "../icons";

// --- Tipos ---
type Company = {
  id: number;
  nombre: string;
  codigo_bbv: string;
  sector: string;
};

type SectorGroup = {
  id: number;
  nombre: string;
  empresas: Company[];
};

type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string; tooltip?: string }[];
  allowedRoles?: string[];
};

const ALL_ROLES = ['Administrador', 'Analista', 'Auditor', 'Inversionista'];

// --- Iconos de Sectores ---
const SECTOR_ICONS: Record<string, ReactNode> = {
  agroindustrial: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M12 2v10" />
      <path d="M8 12c-2.5 0-4 1.5-5 4" />
      <path d="M16 12c2.5 0 4 1.5 5 4" />
      <path d="M10 22v-4" />
      <path d="M14 22v-4" />
    </svg>
  ),
  bancos: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M3 10h18" />
      <path d="M5 6l7-4 7 4" />
      <path d="M4 10v11" />
      <path d="M20 10v11" />
      <path d="M8 14v4" />
      <path d="M16 14v4" />
    </svg>
  ),
  comercio: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  construcción: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M4 21h16" />
      <path d="M8 21V7a2 2 0 012-2h4a2 2 0 012 2v14" />
      <path d="M9 10h2" />
      <path d="M13 10h2" />
      <path d="M9 14h2" />
      <path d="M13 14h2" />
    </svg>
  ),
  cooperativas: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M17 20v-2a4 4 0 00-4-4h-2a4 4 0 00-4 4v2" />
      <path d="M11 10a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M17 8a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  ),
  eléctricas: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M13 2L3 14h7l-2 8 11-13h-7l1-7z" />
    </svg>
  ),
  "fondo de inversión cerrado": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M12 15v3" />
      <path d="M8 11V7a4 4 0 018 0v4" />
      <path d="M6 11h12a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6a2 2 0 012-2z" />
    </svg>
  ),
  industrial: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M4 21h16" />
      <path d="M4 14h16" />
      <path d="M4 21V5a2 2 0 012-2h2a2 2 0 012 2v2h4V5a2 2 0 012-2h2a2 2 0 012 2v16" />
    </svg>
  ),
  minero: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M4 21h16L12 3l-8 18z" />
      <path d="M12 3v18" />
    </svg>
  ),
  municipios: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M4 21h16" />
      <path d="M4 14h16" />
      <path d="M12 2L4 9h16L12 2z" />
      <path d="M8 14v4" />
      <path d="M16 14v4" />
    </svg>
  ),
  otros: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="8" cy="12" r="1" fill="currentColor" />
      <circle cx="16" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
  "patrimonios autónomos": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  ),
  petroleras: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M12 2L5 14a7 7 0 1014 0L12 2z" />
    </svg>
  ),
  seguros: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  servicios: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M5 20v-2a4 4 0 014-4h6a4 4 0 014 4v2" />
      <path d="M9 10a3 3 0 110-6 3 3 0 010 6z" />
      <path d="M15 10a3 3 0 110-6 3 3 0 010 6z" />
    </svg>
  ),
  "servicios financieros": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M3 10l6-6 4 4 6-6" />
      <path d="M7 21v-6" />
      <path d="M12 21v-9" />
      <path d="M17 21v-4" />
    </svg>
  ),
  "sociedad de titularización": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M4 21h16" />
      <path d="M8 21V5a2 2 0 012-2h4a2 2 0 012 2v16" />
      <path d="M10 9v4" />
      <path d="M14 9v4" />
    </svg>
  ),
  "sociedades administradoras de fondos de inversión": (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M4 21h16" />
      <path d="M4 11l4-4 4 4 4-4 4 4" />
      <path d="M6 11v8" />
      <path d="M12 7v12" />
      <path d="M18 11v8" />
    </svg>
  ),
  transporte: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
      <path d="M16 4H5a2 2 0 00-2 2v10h18V8a2 2 0 00-2-2h-3l-4-4z" />
      <path d="M9 16H3" />
      <path d="M19 16h-4" />
      <circle cx="7" cy="20" r="2" />
      <circle cx="17" cy="20" r="2" />
    </svg>
  ),
};

const getSectorIcon = (nombre: string): ReactNode =>
  SECTOR_ICONS[nombre.toLowerCase().trim()] || SECTOR_ICONS.otros;

// --- Configuración del Menú según Roles ---
const MENU_CONFIG: NavItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/admin",
    allowedRoles: ['Administrador'],
  },
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/analyst",
    allowedRoles: ['Analista'],
  },
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/investor",
    allowedRoles: ['Inversionista'],
  },
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/auditor",
    allowedRoles: ['Auditor'],
  },
  {
    name: "Completar perfil",
    icon: <UserCircleIcon />,
    path: "/complete-profile",
    allowedRoles: ALL_ROLES,
  },
  {
    name: "Administración",
    icon: <GroupIcon />,
    allowedRoles: ['Administrador'],
    subItems: [
      { name: "Dashboard", path: "/admin" },
      { name: "Usuarios", path: "/admin/users" },
      { name: "Empresas", path: "/admin/companies" },
      { name: "Sectores", path: "/admin/sectors" },
      { name: "Reportes", path: "/analyst/reports" },
      { name: "Pipeline", path: "/analyst/pipeline" },
      { name: "Auditoría", path: "/admin/audit" },
    ],
  },
  {
    name: "Análisis",
    icon: <PieChartIcon />,
    allowedRoles: ['Analista'],
    subItems: [
      { name: "Dashboard", path: "/analyst" },
      { name: "Empresas", path: "/analyst/companies" },
      { name: "Indicadores", path: "/analyst/indicators" },
      { name: "Reportes", path: "/analyst/reports" },
      { name: "Pipeline", path: "/analyst/pipeline" },
    ],
  },
  {
    name: "Auditoría",
    icon: <AlertIcon />,
    allowedRoles: ['Auditor'],
    subItems: [
      { name: "Dashboard", path: "/auditor" },
      { name: "Historial", path: "/auditor/history" },
      { name: "Reportes", path: "/auditor/reports" },
      { name: "Logs", path: "/auditor/logs" },
    ],
  },
  {
    name: "Inversiones",
    icon: <DollarLineIcon />,
    allowedRoles: ['Inversionista'],
    subItems: [
      { name: "Dashboard", path: "/investor" },
      { name: "Empresas", path: "/investor/companies" },
      { name: "Watchlist", path: "/investor/companies" },
      { name: "Indicadores", path: "/investor/indicators" },
      { name: "Recomendaciones", path: "/investor/recommendations" },
    ],
  },
];

const AppSidebar: FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { isExpanded, isHovered, setIsHovered, isMobileOpen } = useSidebar();

  const [sectorGroups, setSectorGroups] = useState<SectorGroup[]>([]);
  const [expandedSectors, setExpandedSectors] = useState<Set<number>>(new Set());
  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sectores, empresas] = await Promise.all([
          getAllSectores(),
          getAllEmpresas(),
        ]);

        const grupos = new Map<string, Company[]>();
        empresas.forEach(e => {
          const prev = grupos.get(e.sector_nombre) || [];
          prev.push({
            id: e.id_empresa,
            nombre: e.nombre,
            codigo_bbv: e.codigo_bbv,
            sector: e.sector_nombre,
          });
          grupos.set(e.sector_nombre, prev);
        });

        const groups: SectorGroup[] = sectores
          .filter(s => s.activo)
          .map(s => ({
            id: s.id_sector,
            nombre: s.nombre,
            empresas: grupos.get(s.nombre) || [],
          }));

        setSectorGroups(groups);
      } catch (err) {
        console.error("Error loading sectors/companies", err);
      }
    };
    loadData();
  }, []);

  // Filtramos el menú según el rol del usuario
  const userMenu = useMemo(() => {
    if (!user) return [];
    return MENU_CONFIG.filter(item => !item.allowedRoles || item.allowedRoles.includes(user.role));
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const isCompanyActive = (companyId: number) => location.pathname === `/company/${companyId}`;

  const toggleSector = (sectorId: number) => {
    setExpandedSectors(prev => {
      const next = new Set(prev);
      if (next.has(sectorId)) next.delete(sectorId);
      else next.add(sectorId);
      return next;
    });
  };

  const handleSubmenuToggle = (index: number) => {
    if (openSubmenu?.index === index) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu({ type: "main", index });
    }
  };

  // Auto-abrir submenú cuando un sub-item está activo
  useEffect(() => {
    const idx = userMenu.findIndex(nav =>
      nav.subItems?.some(s => isActive(s.path))
    );
    if (idx >= 0) {
      setOpenSubmenu({ type: "main", index: idx });
    }
  }, [location.pathname]);

  useEffect(() => {
    if (openSubmenu) {
      const key = `main-${openSubmenu.index}`;
      const height = subMenuRefs.current[key]?.scrollHeight || 0;
      setSubMenuHeight(prev => ({ ...prev, [key]: height }));
    }
  }, [openSubmenu]);

  useEffect(() => {
    expandedSectors.forEach(id => {
      const key = `sector-${id}`;
      const height = subMenuRefs.current[key]?.scrollHeight || 0;
      setSubMenuHeight(prev => ({ ...prev, [key]: height }));
    });
  }, [expandedSectors]);

  return (
    <aside
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 ${isExpanded || isHovered ? "w-64" : "w-20"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-center border-b border-gray-200 dark:border-gray-800">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
            <span className="text-xl font-black">B</span>
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div className="flex flex-col leading-none">
              <span className="text-sm font-black tracking-tighter text-gray-900 dark:text-white uppercase">Inversiones</span>
              <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest">Plataforma</span>
            </div>
          )}
        </Link>
      </div>

      {/* Navegación */}
      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 scrollbar-hide">
        {/* Menú principal */}
        <nav className="mb-6">
          <ul className="space-y-2">
            {userMenu.map((nav, index) => {
              const isMenuOpen = openSubmenu?.index === index;
              const hasSubActive = nav.subItems?.some(s => isActive(s.path));

              if (nav.subItems) {
                return (
                  <li key={index}>
                    <button
                      onClick={() => handleSubmenuToggle(index)}
                      className={`menu-item group w-full ${isMenuOpen || hasSubActive ? "menu-item-active" : "menu-item-inactive"}`}
                    >
                      <span className={`menu-item-icon-size ${isMenuOpen || hasSubActive ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <>
                          <span className="menu-item-text">{nav.name}</span>
                          <ChevronDownIcon
                            className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
                          />
                        </>
                      )}
                    </button>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <div
                        ref={(el) => { subMenuRefs.current[`main-${index}`] = el; }}
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ height: isMenuOpen ? `${subMenuHeight[`main-${index}`] || "auto"}px` : "0px" }}
                      >
                        <ul className="mt-2 space-y-1 ml-9 border-l border-gray-200 dark:border-gray-800 pl-2">
                          {nav.subItems.map((sub) => (
                            <li key={sub.name}>
                              <Link
                                to={sub.path}
                                title={sub.tooltip}
                                className={`menu-dropdown-item text-sm py-1.5 transition-colors ${
                                  isActive(sub.path)
                                    ? "menu-dropdown-item-active font-medium"
                                    : "menu-dropdown-item-inactive hover:text-brand-500"
                                }`}
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              }

              const active = nav.path ? isActive(nav.path) : false;
              return (
                <li key={index}>
                  {nav.path && (
                    <Link
                      to={nav.path}
                      className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"}`}
                    >
                      <span className={`menu-item-icon-size ${active ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sectores */}
        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="mb-3 flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Sectores</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        )}

        <nav>
          <ul className="space-y-1">
            {sectorGroups.map((sector) => {
              const isOpen = expandedSectors.has(sector.id);
              const hasCompanies = sector.empresas.length > 0;
              const key = `sector-${sector.id}`;

              return (
                <li key={sector.id}>
                  <button
                    onClick={() => hasCompanies && toggleSector(sector.id)}
                    className={`menu-item group w-full ${isOpen ? "menu-item-active" : "menu-item-inactive"} ${!hasCompanies ? "cursor-default" : ""}`}
                  >
                    <span className={`menu-item-icon-size ${isOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                      {getSectorIcon(sector.nombre)}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <>
                        <span className="menu-item-text truncate">{sector.nombre}</span>
                        {hasCompanies && (
                          <ChevronDownIcon
                            className={`ml-auto h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                          />
                        )}
                      </>
                    )}
                  </button>

                  {hasCompanies && (isExpanded || isHovered || isMobileOpen) && (
                    <div
                      ref={(el) => { subMenuRefs.current[key] = el; }}
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{ height: isOpen ? `${subMenuHeight[key] || "auto"}px` : "0px" }}
                    >
                      <ul className="mt-2 space-y-1 ml-9 border-l border-gray-200 dark:border-gray-800 pl-2">
                        {sector.empresas.map((emp) => (
                          <li key={emp.id}>
                            <Link
                              to={`/company/${emp.id}`}
                              className={`menu-dropdown-item text-sm py-1.5 transition-colors ${
                                isCompanyActive(emp.id)
                                  ? "menu-dropdown-item-active font-medium"
                                  : "menu-dropdown-item-inactive hover:text-brand-500"
                              }`}
                            >
                              <span className="truncate">{emp.nombre}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Logout */}
      <div className="mt-auto border-t border-gray-200 p-4 dark:border-gray-800">
        <button onClick={logout} className="menu-item group text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5">
          <span className="menu-item-icon-size">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </span>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="menu-item-text">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
