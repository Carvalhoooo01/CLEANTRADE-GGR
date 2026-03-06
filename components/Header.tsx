"use client";

// components/Header.tsx

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Icons } from "./Icons";
import { NAV_COMPRADOR, NAV_VENDEDOR, fmt } from "@/data/constants";
import { useApp } from "@/context/AppContext";

const EXTRA_TITLES: Record<string, string> = {
  "/vendedor":     "Painel Vendedor",
  "/meus-lotes":   "Meus Lotes",
  "/nova-oferta":  "Nova Oferta",
  "/vendas":       "Histórico de Vendas",
  "/certificados": "Certificados",
  "/carteira":     "Minha Carteira",
};

function NotificationBell({ role }: { role: string }) {
  const { notifications, markNotifRead, markAllRead } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n: any) => !n.read).length;
  const ac = role === "vendedor" ? "#0ea5e9" : "#16a34a";

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-transparent border-none cursor-pointer relative text-gray-500 p-1.5 flex items-center rounded-lg hover:bg-gray-100 transition-colors"
      >
        {Icons.bell}
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-[17px] h-[17px] bg-red-500 rounded-full border-2 border-white text-[9px] text-white flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[300px] bg-white rounded-2xl shadow-xl border border-gray-100 z-[200] overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-50">
            <span className="text-[13px] font-bold text-gray-900">Notificações</span>
            <button
              onClick={markAllRead}
              className="bg-transparent border-none cursor-pointer text-[11px] font-semibold"
              style={{ color: ac }}
            >
              Marcar tudo lido
            </button>
          </div>
          <div className="max-h-[260px] overflow-y-auto">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                onClick={() => markNotifRead(n.id)}
                className="flex gap-2.5 items-start px-4 py-3 cursor-pointer border-b border-gray-50"
                style={{ background: n.read ? "transparent" : "#f8fffc" }}
              >
                <span className="text-xl">{n.icon}</span>
                <div className="flex-1">
                  <p className="text-xs text-gray-900 mb-0.5" style={{ fontWeight: n.read ? 500 : 700 }}>{n.title}</p>
                  <p className="text-[11px] text-gray-500">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname   = usePathname();
  const { role, user, balance } = useApp();

  const NAV        = role === "vendedor" ? NAV_VENDEDOR : NAV_COMPRADOR;
  const current    = NAV.find((n: any) => n.href === "/" ? pathname === "/" : pathname.startsWith(n.href));
  const title      = EXTRA_TITLES[pathname] ?? current?.label ?? "Dashboard";
  const isVendedor = role === "vendedor";
  const acColor    = isVendedor ? "#0ea5e9" : "#16a34a";
  const borderColor = isVendedor ? "#e0f2fe" : "#e7f5e7";

  return (
    <header
      className="bg-white sticky top-0 z-[9] flex items-center justify-between px-4 lg:px-6"
      style={{
        height: 65,
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: `0 1px 6px ${isVendedor ? "rgba(14,165,233,0.05)" : "rgba(22,163,74,0.05)"}`,
      }}
    >
      {/* Esquerda */}
      <div className="flex items-center gap-3">
        {/* Botão hamburguer — visível só no mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden bg-transparent border-none cursor-pointer text-gray-500 p-1.5 rounded-lg flex items-center hover:bg-gray-100 transition-colors"
          aria-label="Abrir menu"
        >
          {Icons.menu}
        </button>

        <div>
          <h1
            className="text-[17px] lg:text-[18px] font-bold m-0"
            style={{ color: "#0c4a6e", fontFamily: "'Playfair Display', serif" }}
          >
            {title}
          </h1>
          {/* Data — esconde no mobile para economizar espaço */}
          <p className="hidden sm:block text-[11px] text-gray-400 m-0">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>
      </div>

      {/* Direita */}
      <div className="flex items-center gap-3 lg:gap-5">

        {/* Saldo — esconde no mobile pequeno */}
        <div className="hidden sm:block text-right border-r border-slate-100 pr-4 lg:pr-5">
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide m-0">
            {isVendedor ? "Receita Total" : "Saldo p/ Investir"}
          </p>
          <p className="text-[15px] lg:text-[16px] font-extrabold m-0" style={{ color: acColor }}>
            {fmt(balance)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell role={role} />

          {/* Usuário */}
          <div className="flex items-center gap-2.5">
            {/* Nome + empresa — oculto em telas pequenas */}
            <div className="hidden md:block text-right">
              <p className="text-[13px] font-bold text-slate-800 m-0">{user?.nome || "Visitante"}</p>
              <p className="text-[10px] text-slate-500 m-0">{user?.empresa || "Acessando..."}</p>
            </div>

            {/* Avatar */}
            <div
              className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center font-extrabold text-sm border"
              style={{
                background: isVendedor ? "#e0f2fe" : "#f0fdf4",
                color: acColor,
                borderColor: "rgba(0,0,0,0.05)",
              }}
            >
              {user?.nome ? user.nome.charAt(0) : "U"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}