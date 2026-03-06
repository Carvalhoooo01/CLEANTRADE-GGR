"use client";

import { useApp } from "@/context/AppContext";
import { fmt, fmtCO2 } from "@/data/constants";
import Link from "next/link";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
const PixDeposito = dynamic(() => import("@/components/PixDeposito"), { ssr: false });

export default function DashboardPage() {
  const { user, role, balance, transactions, vendas, market, certs } = useApp();
  const isVendedor = role === "vendedor";

  const [pixOpen, setPixOpen] = useState(false);

  const totalCompras = useMemo(() =>
    transactions?.filter((t: any) => t.type === "BUY").length || 0, [transactions]);

  const totalVendas = useMemo(() =>
    vendas?.length || 0, [vendas]);

  const totalCO2 = useMemo(() =>
    certs?.reduce((s: number, c: any) => s + (c.quantidade || 0), 0) || 0, [certs]);

  const totalEconomizado = useMemo(() => totalCO2 * 25, [totalCO2]);

  const ultimasAtividades = useMemo(() => {
    return [
      ...(transactions || []).map((t: any) => ({ ...t, tipo: t.type, data: t.date })),
      ...(vendas || []).map((v: any) => ({ ...v, tipo: "venda", data: v.data || v.date })),
    ].sort((a, b) => (b.data || "").localeCompare(a.data || "")).slice(0, 5);
  }, [transactions, vendas]);

  return (
    <div className="flex flex-col gap-6 pb-10 font-[Inter,system-ui,sans-serif] px-4 sm:px-0">

      {/* Header */}
      <div className="bg-gradient-to-r from-green-800 to-green-600 rounded-2xl px-6 sm:px-8 py-6 sm:py-7 text-white">
        <p className="text-sm opacity-80 mb-1">Bem-vindo de volta,</p>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">{user?.nome || "Usuário"}</h1>
            <p className="text-sm opacity-90 flex items-center gap-2">
              <span className="bg-white/20 px-3 py-1 rounded-full text-xs">
                {isVendedor ? "Perfil Vendedor" : "Perfil Comprador"}
              </span>
              <span>🌱 Desde 2024</span>
            </p>
          </div>

          {/* Saldo + botão deposito */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-4 flex flex-col gap-3 min-w-[180px]">
            <div>
              <p className="text-xs opacity-70 font-semibold uppercase tracking-wider mb-1">Saldo disponível</p>
              <p className="text-3xl font-black">{fmt(balance)}</p>
            </div>
            <button
              onClick={() => setPixOpen(true)}
              className="flex items-center justify-center gap-2 border-none cursor-pointer transition-all w-full"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1.5px solid rgba(255,255,255,0.35)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                padding: "8px 0",
                borderRadius: 8,
                letterSpacing: "0.04em",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.28)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.18)")}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              DEPOSITAR VIA PIX
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Créditos em Carteira",          value: fmtCO2(totalCO2),               icon: "🌿", color: "text-green-600",  bg: "bg-green-50",  link: "/certificados" },
          { title: isVendedor ? "Vendas Realizadas" : "Compras Realizadas",
                                                     value: isVendedor ? totalVendas : totalCompras, icon: isVendedor ? "💰" : "🛒", color: "text-blue-600", bg: "bg-blue-50", link: isVendedor ? "/vendas" : "/marketplace" },
          { title: "Árvores Equivalentes",           value: `${Math.round(totalEconomizado)} árvores`, icon: "🌳", color: "text-emerald-600", bg: "bg-emerald-50", link: "/impacto" },
          { title: "Lotes Ativos no Mercado",        value: market?.length || 0,            icon: "📊", color: "text-purple-600", bg: "bg-purple-50", link: "/marketplace" },
        ].map((kpi, idx) => (
          <Link href={kpi.link} key={idx}
            className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg transition-all duration-300 no-underline">
            <div className={`${kpi.bg} w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3`}>
              {kpi.icon}
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{kpi.title}</p>
            <p className={`text-xl font-extrabold ${kpi.color}`}>{kpi.value}</p>
          </Link>
        ))}
      </div>

      {/* Impacto + Atividades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-extrabold text-lg">Impacto Ambiental</h3>
              <p className="text-xs text-gray-400">Seu impacto positivo em números</p>
            </div>
            <span className="text-3xl">🌎</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "CO₂ Compensado",     value: fmtCO2(totalCO2),               icon: "🏭" },
              { label: "Árvores Preservadas", value: Math.round(totalEconomizado),   icon: "🌲" },
              { label: "Energia Limpa (kWh)", value: (totalCO2 * 4000).toFixed(0),  icon: "⚡" },
            ].map((item, i) => (
              <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                <span className="text-2xl mb-1 block">{item.icon}</span>
                <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm font-extrabold text-green-600">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-xs mb-2">
              <span className="font-semibold">Meta Anual de Compensação</span>
              <span className="text-green-600 font-bold">{Math.min(100, Math.round((totalCO2 / 100) * 100))}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalCO2 / 100) * 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">{fmtCO2(totalCO2)} de 100 tCO₂ meta anual</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-extrabold text-lg">Últimas Atividades</h3>
            <Link href="/financeiro" className="text-xs text-green-600 hover:text-green-700 font-semibold">
              Ver tudo →
            </Link>
          </div>

          {ultimasAtividades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-sm text-gray-400">Nenhuma atividade recente</p>
              <Link href="/marketplace" className="text-xs text-green-600 mt-2 inline-block">
                Começar a comprar →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ultimasAtividades.map((atv: any, idx: number) => {
                const isCompra = atv.type === "BUY"  || atv.tipo === "BUY";
                const isVenda  = atv.type === "SELL" || atv.tipo === "venda";
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm
                      ${isCompra ? "bg-blue-50" : isVenda ? "bg-green-50" : "bg-gray-100"}`}>
                      {isCompra ? "🛒" : isVenda ? "💰" : "💳"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">
                        {isCompra ? "Compra de Créditos" : isVenda ? "Venda Realizada" : atv.type === "deposito" ? "Depósito" : "Saque"}
                      </p>
                      <p className="text-[10px] text-gray-400">{atv.data || atv.date}</p>
                    </div>
                    <p className={`text-xs font-extrabold ${isCompra ? "text-blue-600" : isVenda ? "text-green-600" : "text-gray-600"}`}>
                      {atv.type === "saque" ? "-" : "+"}{fmt(atv.total || atv.valorTotal || 0)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs font-bold text-amber-800 mb-1">💡 Dica do dia</p>
            <p className="text-[11px] text-amber-700">
              {isVendedor
                ? "Créditos de reflorestamento têm maior valor de mercado por sua adicionalidade."
                : "Comprar créditos de projetos diferentes diversifica seu impacto ambiental."}
            </p>
          </div>
        </div>
      </div>

      {/* Acesso rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
        {[
          { icon: "🛒", title: "Comprar Créditos", desc: "Marketplace",      link: "/marketplace", color: "green"  },
          { icon: "💰", title: "Minhas Vendas",    desc: "Gerenciar ofertas", link: "/vendas",      color: "blue"   },
          { icon: "📜", title: "Certificados",     desc: "Meu portfólio",     link: "/certificados",color: "purple" },
          { icon: "💳", title: "Financeiro",       desc: "Extrato e saldo",   link: "/financeiro",  color: "amber"  },
        ].map((item, idx) => (
          <Link href={item.link} key={idx}
            className="bg-white p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all no-underline group">
            <div className={`w-10 h-10 rounded-lg bg-${item.color}-50 flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <p className="font-bold text-sm text-gray-800">{item.title}</p>
            <p className="text-[10px] text-gray-400">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Modal PIX */}
      {pixOpen && (
        <div className="fixed inset-0 bg-black/50 z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[440px] shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <p className="font-extrabold text-base">Depositar via PIX</p>
              <button onClick={() => setPixOpen(false)} className="bg-gray-100 border-none rounded-lg w-8 h-8 cursor-pointer text-gray-500 text-base">✕</button>
            </div>
            <PixDeposito onClose={() => setPixOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}