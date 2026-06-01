import { useEffect, useRef, useState, useMemo, type FC, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { getEmpresas } from "../services/apiServices";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";

import {
  GridIcon,
  UserCircleIcon,
  ListIcon,
  PieChartIcon,
  BoxCubeIcon,
  ChevronDownIcon,
  AlertIcon,
} from "../icons";

// --- Tipos ---
type Company = {
  id: number;
  nombre: string;
  codigo_bbv: string;
  sector: string;
};

type NavItem = {
  name: string;
  icon: ReactNode;
  path?: string;
  subItems?: { name: string; path: string; tooltip?: string }[];
  allowedRoles?: string[]; // RBAC simplificado con strings
};

// --- Iconos de Sectores (SVG Profesionales) ---
const SectorIcons: Record<string, ReactNode> = {
  Agroindustrial: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Comercial: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  Industrial: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Servicios: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Bancario: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v20M12 14v20M16 14v20M3 10h18M12 3l9 7H3l9-7z" /></svg>,
  Default: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
};

// --- Configuración Estática del Menú ---
const MENU_CONFIG: NavItem[] = [
  {
    name: "Dashboard",
    icon: <GridIcon />,
    path: "/",
    allowedRoles: ['Administrador', 'Analista', 'Auditor', 'Inversionista'],
  },
  {
    name: "Empresas",
    icon: <ListIcon />,
    path: "/admin/companies",
    allowedRoles: ['Administrador', 'Analista'],
  },
  {
    name: "Usuarios",
    icon: <UserCircleIcon />,
    path: "/admin/users",
    allowedRoles: ['Administrador'],
  },
  {
    name: "Indicadores",
    icon: <PieChartIcon />,
    path: "/analyst/indicators",
    allowedRoles: ['Analista', 'Inversionista'],
  },
  {
    name: "Simulación",
    icon: <BoxCubeIcon />,
    path: "/simulator",
    allowedRoles: ['Analista', 'Inversionista'],
  },
  {
    name: "Auditoría",
    icon: <AlertIcon />,
    path: "/admin/audit",
    allowedRoles: ['Administrador', 'Auditor'],
  },
];

const AppSidebar: FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeCompanyId = searchParams.get("company");
  const { isExpanded, isHovered, setIsHovered, isMobileOpen } = useSidebar();

  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "mercado"; index: number; } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getEmpresas({ page_size: 50 });
        const mapped: Company[] = response.results.map(e => ({
          id: e.id_empresa,
          nombre: e.nombre,
          codigo_bbv: e.codigo_bbv,
          sector: e.sector_nombre
        }));
        setCompanies(mapped);
      } catch (err) {
        console.error("Error fetching companies", err);
      }
    };
    loadData();
  }, []);

  // Filtramos el menú según el rol del usuario
  const userMenu = useMemo(() => {
    if (!user) return [];
    return MENU_CONFIG.filter(item => !item.allowedRoles || item.allowedRoles.includes(user.role));
  }, [user]);

  const marketNavItems: NavItem[] = useMemo(() => {
    return companies.map(company => ({
      name: company.nombre,
      icon: SectorIcons[company.sector] || SectorIcons.Default,
      path: `/?company=${company.id}`,
    }));
  }, [companies]);

  const isActive = (path?: string) => path && (location.pathname === path || (path === "/" && location.pathname === "/" && activeCompanyId === searchParams.get("company")));

  const handleSubmenuToggle = (type: "main" | "mercado", index: number) => {
    if (openSubmenu?.type === type && openSubmenu?.index === index) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu({ type, index });
    }
  };

  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      const height = subMenuRefs.current[key]?.scrollHeight || 0;
      setSubMenuHeight((prev) => ({ ...prev, [key]: height }));
    }
  }, [openSubmenu]);

  const renderNavItems = (items: NavItem[], menuType: "main" | "mercado") => {
    return items.map((nav, index) => {
      const isMenuOpen = openSubmenu?.type === menuType && openSubmenu?.index === index;
      return (
        <li key={nav.name} className="relative">
          {nav.subItems ? (
            <button onClick={() => handleSubmenuToggle(menuType, index)} className={`menu-item group ${isMenuOpen ? "menu-item-active" : "menu-item-inactive"}`}>
              <span className={`menu-item-icon-size ${isMenuOpen ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <>
                  <span className="menu-item-text">{nav.name}</span>
                  <ChevronDownIcon className={`ml-auto h-4 w-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`} />
                </>
              )}
            </button>
          ) : (
            nav.path && (
              <Link to={nav.path} className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}>
                <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div ref={(el) => { subMenuRefs.current[`${menuType}-${index}`] = el; }} className="overflow-hidden transition-all duration-300 ease-in-out" style={{ height: isMenuOpen ? `${subMenuHeight[`${menuType}-${index}`] || "auto"}px` : "0px" }}>
              <ul className="mt-2 space-y-1 ml-9 border-l border-gray-200 dark:border-gray-800 pl-2">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link to={subItem.path} title={subItem.tooltip} className={`menu-dropdown-item text-sm py-1.5 transition-colors ${isActive(subItem.path) ? "menu-dropdown-item-active font-medium" : "menu-dropdown-item-inactive hover:text-brand-500"}`}>
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      );
    });
  };

  return (
    <aside 
      className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 ${isExpanded || isHovered ? "w-64" : "w-20"} ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
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

      <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 scrollbar-hide">
        <nav className="mb-8">
          <ul className="space-y-2">
            {renderNavItems(userMenu, "main")}
          </ul>
        </nav>

        {(isExpanded || isHovered || isMobileOpen) && (
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Mercado en Vivo</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        )}

        <nav>
          <ul className="space-y-1">
            {renderNavItems(marketNavItems, "mercado")}
          </ul>
        </nav>
      </div>

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
