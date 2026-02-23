"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { useApp } from "../context/AppContext";

function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  const colors = { success: "#16a34a", error: "#dc2626", info: "#0ea5e9" };
  const c = colors[toast.type] || "#16a34a";
  return (
    <div style={{
      position: "fixed", bottom: 24, right: 24,
      background: "#111827", color: "#fff",
      borderRadius: 12, padding: "12px 18px",
      fontSize: 13, fontWeight: 600,
      boxShadow: `0 8px 28px rgba(0,0,0,0.25), 0 0 0 2px ${c}40`,
      zIndex: 9999, display: "flex", alignItems: "center", gap: 10,
      maxWidth: 320, animation: "toastIn 0.25s ease",
      borderLeft: `3px solid ${c}`,
    }}>
      <span style={{ fontSize: 18 }}>
        {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
      </span>
      {toast.msg}
      <style>{`@keyframes toastIn{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// Páginas exclusivas de comprador
const COMPRADOR_PAGES = ["/", "/marketplace", "/historico", "/certificados", "/propriedades"];
// Páginas exclusivas de vendedor
const VENDEDOR_PAGES = ["/vendedor", "/lotes", "/vendas", "/nova-oferta"];

export default function ClientLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { ready, user, role } = useApp();

  const isLoginPage = pathname === "/login";

  // Redirect centralizado baseado no role
  useEffect(() => {
    if (!ready || isLoginPage) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (role === "vendedor" && COMPRADOR_PAGES.includes(pathname)) {
      router.replace("/vendedor");
      return;
    }

    if (role === "comprador" && VENDEDOR_PAGES.includes(pathname)) {
      router.replace("/");
      return;
    }
  }, [ready, user, role, pathname]);

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: isLoginPage ? "#fff" : "#f4f7f4",
      transition: "background 0.3s ease"
    }}>

      {!isLoginPage && (
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      )}

      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        height: "100vh"
      }}>

        {!isLoginPage && <Header />}

        <main style={{
          flex: 1,
          padding: isLoginPage ? "0" : "24px 30px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column"
        }}>
          {children}
        </main>
      </div>

      <Toast />
    </div>
  );
}