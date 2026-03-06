"use client";

// app/ClientLayout.tsx

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useApp } from "../context/AppContext";

const TOAST_CONFIG = {
  success: { color: "#16a34a", icon: "✅" },
  error:   { color: "#dc2626", icon: "❌" },
  info:    { color: "#0ea5e9", icon: "ℹ️" },
};

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  const { color, icon } = TOAST_CONFIG[toast.type as keyof typeof TOAST_CONFIG] || TOAST_CONFIG.success;
  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 max-w-xs
                 rounded-xl px-[18px] py-3 text-white text-[13px] font-semibold
                 animate-toast-in"
      style={{
        background: "#111827",
        boxShadow: `0 8px 28px rgba(0,0,0,0.25), 0 0 0 2px ${color}40`,
        borderLeft: `3px solid ${color}`,
      }}
    >
      <span className="text-[18px]">{icon}</span>
      {toast.msg}
    </div>
  );
}

const COMPRADOR_ONLY = ["/", "/marketplace", "/historico"];
const VENDEDOR_ONLY  = ["/vendedor", "/meus-lotes", "/vendas", "/nova-oferta"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen,   setSidebarOpen]   = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pathname = usePathname();
  const router   = useRouter();
  const { ready, user, role } = useApp();

  const isLoginPage = pathname === "/login";

  // Fecha drawer ao mudar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Trava scroll do body quando drawer aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!ready || isLoginPage) return;
    if (!user) { router.replace("/login"); return; }
    if (role === "vendedor" && COMPRADOR_ONLY.includes(pathname)) { router.replace("/vendedor"); return; }
    if (role === "comprador" && VENDEDOR_ONLY.includes(pathname)) { router.replace("/"); return; }
  }, [ready, user, role, pathname]);

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isLoginPage ? "bg-white" : "bg-[#f4f7f4]"}`}>

      {/* Sidebar — só renderiza fora do login */}
      {!isLoginPage && (
        <Sidebar
          open={sidebarOpen}
          setOpen={setSidebarOpen}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />
      )}

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col min-w-0 h-screen">
        {!isLoginPage && (
          <Header
            onMenuClick={() => setMobileMenuOpen(true)}
          />
        )}
        <main
          className={`flex flex-1 flex-col overflow-y-auto ${
            isLoginPage ? "p-0" : "px-4 py-4 lg:px-[30px] lg:py-6"
          }`}
        >
          {children}
        </main>
      </div>

      <Toast />
    </div>
  );
}