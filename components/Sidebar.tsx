"use client";

// components/Sidebar.tsx

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "./Icons";
import { useApp } from "@/context/AppContext";
import { NAV_COMPRADOR, NAV_VENDEDOR, fmt } from "@/data/constants";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen, mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, balance, lotes, vendas, role, setRole, showToast, logout } = useApp();

  const NAV      = role === "vendedor" ? NAV_VENDEDOR : NAV_COMPRADOR;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const acColor     = role === "vendedor" ? "#0ea5e9" : "#16a34a";
  const acBg        = role === "vendedor"
    ? "linear-gradient(135deg,rgba(14,165,233,0.14),rgba(56,189,248,0.06))"
    : "linear-gradient(135deg,rgba(22,163,74,0.14),rgba(34,197,94,0.06))";
  const borderColor = role === "vendedor" ? "#e0f2fe" : "#e7f5e7";
  const sectionBg   = role === "vendedor" ? "#f0f9ff" : "#f0fdf4";

  const switchRole = () => {
    const next = role === "comprador" ? "vendedor" : "comprador";
    setRole(next);
    router.push(next === "vendedor" ? "/vendedor" : "/");
    showToast(`Perfil alterado para ${next === "vendedor" ? "Vendedor" : "Comprador"}`, "info");
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const Content = ({ isDrawer = false }: { isDrawer?: boolean }) => {
    const expanded = isDrawer || open;
    return (
      <aside
        className="flex flex-col h-full bg-white overflow-hidden"
        style={{
          width: expanded ? "240px" : "64px",
          borderRight: `1px solid ${borderColor}`,
          transition: isDrawer ? "none" : "width 0.25s",
          boxShadow: `2px 0 10px ${role === "vendedor" ? "rgba(14,165,233,0.06)" : "rgba(22,163,74,0.06)"}`,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2"
          style={{
            padding: expanded ? "22px 18px 14px" : "22px 14px 14px",
            borderBottom: `1px solid ${sectionBg}`,
            justifyContent: expanded ? "space-between" : "center",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-white shrink-0"
              style={{
                background: role === "vendedor"
                  ? "linear-gradient(135deg,#0ea5e9,#38bdf8)"
                  : "linear-gradient(135deg,#16a34a,#22c55e)",
                boxShadow: `0 4px 12px ${role === "vendedor" ? "rgba(14,165,233,0.3)" : "rgba(22,163,74,0.3)"}`,
              }}
            >
              🌱
            </div>
            {expanded && (
              <span
                className="text-[17px] font-bold whitespace-nowrap"
                style={{
                  color: role === "vendedor" ? "#0c4a6e" : "#14532d",
                  fontFamily: "'Playfair Display',serif",
                  letterSpacing: "-0.3px",
                }}
              >
                CleanTrade
              </span>
            )}
          </div>

          {isDrawer ? (
            <button
              onClick={() => setMobileOpen(false)}
              className="bg-transparent border-none cursor-pointer text-gray-400 p-1 rounded-md flex"
            >
              {Icons.close}
            </button>
          ) : (
            <button
              onClick={() => setOpen(!open)}
              className="bg-transparent border-none cursor-pointer text-gray-400 p-1 rounded-md flex shrink-0"
            >
              {open ? Icons.close : Icons.menu}
            </button>
          )}
        </div>

        {/* Perfil */}
        <div style={{ padding: expanded ? "12px 14px" : "12px", borderBottom: `1px solid ${sectionBg}` }}>
          {expanded ? (
            <>
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{
                    background: role === "vendedor"
                      ? "linear-gradient(135deg,#0ea5e9,#7dd3fc)"
                      : "linear-gradient(135deg,#16a34a,#86efac)",
                  }}
                >
                  {user?.nome ? user.nome.charAt(0) : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-900 truncate">{user?.nome || "Carregando..."}</div>
                  <div className="text-[11px] font-medium" style={{ color: acColor }}>
                    {user?.empresa || (role === "vendedor" ? "Produtor Rural" : "Comprador Premium")}
                  </div>
                </div>
              </div>

              <div
                className="flex items-center justify-between px-2.5 py-2 rounded-lg mb-2"
                style={{ background: sectionBg }}
              >
                <div className="flex items-center gap-1.5 text-gray-500">
                  {Icons.wallet}
                  <span className="text-xs">{role === "vendedor" ? "Receita" : "Saldo"}</span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: role === "vendedor" ? "#0c4a6e" : "#15803d" }}>
                  {fmt(balance)}
                </span>
              </div>

              <button
                onClick={switchRole}
                className="w-full py-[7px] px-2.5 rounded-lg text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: role === "vendedor" ? "#f0fdf4" : "#f0f9ff",
                  color: role === "vendedor" ? "#16a34a" : "#0ea5e9",
                  border: role === "vendedor" ? "1px solid #bbf7d0" : "1px solid #bae6fd",
                }}
              >
                <span className="text-sm">{role === "vendedor" ? "🛒" : "🌾"}</span>
                Modo {role === "vendedor" ? "Comprador" : "Vendedor"}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{
                  background: role === "vendedor"
                    ? "linear-gradient(135deg,#0ea5e9,#7dd3fc)"
                    : "linear-gradient(135deg,#16a34a,#86efac)",
                }}
              >
                {user?.nome ? user.nome.charAt(0) : "U"}
              </div>
              <button onClick={switchRole} title="Trocar perfil" className="bg-transparent border-none cursor-pointer text-base">
                {role === "vendedor" ? "🛒" : "🌾"}
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2.5 px-2 overflow-y-auto">
          {expanded && (
            <div className="text-[10px] font-semibold text-gray-400 tracking-[0.8px] uppercase px-2 pb-2">
              {role === "vendedor" ? "Painel Vendedor" : "Menu Principal"}
            </div>
          )}
          {NAV.map((item: any) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className="no-underline"
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className="flex items-center gap-2.5 rounded-[10px] mb-0.5 text-[13.5px] transition-all"
                  style={{
                    padding: "10px",
                    justifyContent: expanded ? "flex-start" : "center",
                    color: active ? acColor : "#6b7280",
                    fontWeight: active ? 600 : 400,
                    background: active ? acBg : "transparent",
                  }}
                >
                  <span className="shrink-0">{Icons[item.icon] || Icons.dashboard}</span>
                  {expanded && <span className="whitespace-nowrap">{item.label}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2">
          <button
            onClick={handleLogout}
            className="w-full bg-transparent border-none flex items-center gap-2.5 p-2.5 text-gray-400 cursor-pointer rounded-[10px] hover:bg-gray-50 transition-colors"
            style={{ justifyContent: expanded ? "flex-start" : "center" }}
          >
            <span className="text-lg">🚪</span>
            {expanded && <span className="text-[13px] font-semibold">Sair da conta</span>}
          </button>
        </div>
      </aside>
    );
  };

  return (
    <>
      {/* Desktop: sidebar fixa lg+ */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0">
        <Content isDrawer={false} />
      </div>

      {/* Mobile: overlay */}
      <div
        className={`fixed inset-0 z-[200] lg:hidden transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.45)" }}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile: drawer */}
      <div
        className="fixed top-0 left-0 h-full z-[201] lg:hidden transition-transform duration-300 ease-in-out"
        style={{ transform: mobileOpen ? "translateX(0)" : "translateX(-100%)" }}
      >
        <Content isDrawer={true} />
      </div>
    </>
  );
}