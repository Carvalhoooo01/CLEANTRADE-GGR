"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Btn, KpiCard, SectionHeader } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { fmt, fmtCO2 } from "@/data/constants";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import Link from "next/link";

const executarDownloadCSV = (dados, colunas, nome) => {
  const formatado = [colunas, ...dados];
  const csvContent = "data:text/csv;charset=utf-8," + formatado.map(row => row.join(";")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", nome);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const CustomTooltip = ({ active, payload, label, isCurrency = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 p-3 rounded-xl border border-slate-700 shadow-xl">
        <p className="text-xs font-bold text-slate-400 mb-1 uppercase">{label}</p>
        <p className="text-[15px] font-extrabold text-white">
          {isCurrency ? fmt(payload[0].value) : fmtCO2(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function VendedorDash() {
  const { ready, user, role, lotes, vendas, showToast } = useApp();
  const router = useRouter();

  const monthlyReceita = useMemo(() => {
    const base = [
      { m: "Set", receita: 0, volume: 0 },
      { m: "Out", receita: 0, volume: 0 },
      { m: "Nov", receita: 0, volume: 0 },
      { m: "Dez", receita: 0, volume: 0 },
      { m: "Jan", receita: 0, volume: 0 },
      { m: "Fev", receita: 0, volume: 0 },
    ];
    const mesMap = { "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez" };
    vendas.forEach((v) => {
      const dateStr = v.data || v.date || "";
      const parts = dateStr.split(" ")[0]?.split("/");
      if (!parts || parts.length < 2) return;
      const mesAbrev = mesMap[parts[1]];
      if (!mesAbrev) return;
      const entry = base.find((b) => b.m === mesAbrev);
      if (entry) {
        entry.receita += v.valorTotal || v.total || 0;
        entry.volume  += v.quantidade || 0;
      }
    });
    return base;
  }, [vendas]);

  const totalReceita     = vendas.reduce((s, v) => s + (v.valorTotal || v.total || 0), 0);
  const totalCO2Vendidos = vendas.reduce((s, v) => s + (v.quantidade || 0), 0);
  const lotesAtivos      = lotes.filter((l) => l.status === "ativo").length;
  const estoqueTotal     = lotes.reduce((s, l) => s + (l.quantidade || 0), 0);

  const exportarDadosFinanceiros = () => {
    const dados = monthlyReceita.map(d => [d.m, d.receita]);
    executarDownloadCSV(dados, ["Mês", "Receita (R$)"], "financeiro_vendas.csv");
    showToast("Relatório financeiro baixado!", "success");
  };

  const exportarRelatorioVendas = () => {
    const dados = vendas.map(v => [
      v.lote || v.loteId || "-",
      v.comprador || v.compradorId || "-",
      v.data || v.date || "-",
      v.quantidade || 0,
      v.valorTotal || v.total || 0,
    ]);
    executarDownloadCSV(dados, ["Lote", "Comprador", "Data", "Toneladas", "Total"], "auditoria_vendas_cleantrade.csv");
    showToast("Relatório de auditoria gerado!", "success");
  };

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace("/login");
    else if (role !== "vendedor") router.replace("/");
  }, [ready, user, role, router]);

  if (!ready || !user || role !== "vendedor") return null;

  return (
    <div className="flex flex-col gap-5 pb-10">

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #075985 0%, #0369a1 100%)", boxShadow: "0 10px 25px rgba(3,105,161,0.2)" }}
        className="p-8 rounded-2xl flex justify-between items-center">
        <div>
          <p className="text-sky-300 text-sm mb-1 font-semibold">{user.empresa || "FAZENDA"} • {user.localizacao || "BR"}</p>
          <h2 className="text-2xl font-extrabold text-white m-0">Painel do Produtor</h2>
        </div>
        <div className="text-right">
          <p className="text-sky-300 text-xs mb-1">FATURAMENTO TOTAL</p>
          <p className="text-3xl font-black text-white m-0">{fmt(totalReceita)}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <KpiCard label="Receita Vendas"   value={fmt(totalReceita)}        sub="Créditos Liquidados" color="#0ea5e9" />
        <KpiCard label="Carbono Vendido"  value={fmtCO2(totalCO2Vendidos)} sub="Contratos Fechados"  color="#16a34a" />
        <KpiCard label="Lotes Ativos"     value={lotesAtivos}              sub="No Mercado"          color="#f59e0b" />
        <KpiCard label="Total em Estoque" value={fmtCO2(estoqueTotal)}     sub="Pronto p/ Venda"     color="#6366f1" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-6 rounded-[18px] border border-slate-200 shadow-sm">
          <SectionHeader
            title="Evolução de Receita"
            action={<Btn small variant="ghost" onClick={exportarDadosFinanceiros}>{Icons.download || "📥"}</Btn>}
          />
          <div className="h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReceita} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} hide />
                <Tooltip content={<CustomTooltip isCurrency />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="receita" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[18px] border border-slate-200 shadow-sm">
          <SectionHeader
            title="Volume de Carbono (tCO₂e)"
            action={<Btn small variant="ghost" onClick={exportarRelatorioVendas}>{Icons.download || "📥"}</Btn>}
          />
          <div className="h-[220px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyReceita} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={10} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="volume" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" dot={{ fill: "#22c55e", r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Vendas recentes */}
      <div className="bg-white p-6 rounded-[18px] border border-slate-200 shadow-sm">
        <SectionHeader
          title="Vendas Recentes"
          action={<Link href="/vendas"><Btn small variant="outline">Ver Histórico</Btn></Link>}
        />
        <div className="mt-4 flex flex-col gap-2.5">
          {vendas.length > 0 ? vendas.slice(0, 4).map((v) => (
            <div key={v.id} className="flex justify-between items-center px-[18px] py-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-[42px] h-[42px] bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">🌳</div>
                <div>
                  <p className="text-sm font-bold text-slate-800 m-0">{v.lote || v.loteId || "Lote"}</p>
                  <p className="text-xs text-slate-500 m-0">{v.comprador || v.compradorId || "—"} • {v.data || v.date || "—"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[15px] font-extrabold text-sky-700 m-0">{fmt(v.valorTotal || v.total || 0)}</p>
                <p className="text-xs font-semibold text-green-600 m-0">{fmtCO2(v.quantidade || 0)}</p>
              </div>
            </div>
          )) : (
            <p className="text-center text-gray-400 py-5">Nenhuma venda registrada ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
}