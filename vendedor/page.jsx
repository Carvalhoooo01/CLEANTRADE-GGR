"use client";

import { useEffect, useMemo } from "react";
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
  const csvContent = "data:text/csv;charset=utf-8,"
    + formatado.map(row => row.join(";")).join("\n");
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
      <div style={{
        background: "#111827", padding: "12px", borderRadius: "10px",
        border: "1px solid #334155", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.3)"
      }}>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", marginBottom: "4px", textTransform: "uppercase" }}>
          {label}
        </p>
        <p style={{ fontSize: "15px", fontWeight: "800", color: "#fff" }}>
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
        entry.volume += v.quantidade || 0;
      }
    });
    return base;
  }, [vendas]);

  const totalReceita      = vendas.reduce((s, v) => s + (v.valorTotal || v.total || 0), 0);
  const totalCO2Vendidos  = vendas.reduce((s, v) => s + (v.quantidade || 0), 0);
  const lotesAtivos       = lotes.filter((l) => l.status === "ativo").length;
  const estoqueTotal      = lotes.reduce((s, l) => s + (l.quantidade || 0), 0);

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
      v.valorTotal || v.total || 0
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
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>

      {/* 1. BANNER */}
      <div style={bannerStyle}>
        <div>
          <p style={{ color: "#bae6fd", fontSize: 13, marginBottom: 4, fontWeight: "600" }}>
            {user.empresa || "FAZENDA"} • {user.localizacao || "BR"}
          </p>
          <h2 style={{ fontSize: 26, fontWeight: "800", color: "#fff", margin: 0 }}>Painel do Produtor</h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color: "#bae6fd", fontSize: 12, marginBottom: 4 }}>FATURAMENTO TOTAL</p>
          <p style={{ fontSize: 32, fontWeight: "900", color: "#fff", margin: 0 }}>{fmt(totalReceita)}</p>
        </div>
      </div>

      {/* 2. KPIS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <KpiCard label="Receita Vendas"    value={fmt(totalReceita)}          sub="Créditos Liquidados" color="#0ea5e9" />
        <KpiCard label="Carbono Vendido"   value={fmtCO2(totalCO2Vendidos)}   sub="Contratos Fechados"  color="#16a34a" />
        <KpiCard label="Lotes Ativos"      value={lotesAtivos}                sub="No Mercado"          color="#f59e0b" />
        <KpiCard label="Total em Estoque"  value={fmtCO2(estoqueTotal)}       sub="Pronto p/ Venda"     color="#6366f1" />
      </div>

      {/* 3. GRÁFICOS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={chartCardStyle}>
          <SectionHeader
            title="Evolução de Receita"
            action={<Btn small variant="ghost" onClick={exportarDadosFinanceiros}>{Icons.download || "📥"}</Btn>}
          />
          <div style={{ height: 220, marginTop: 15 }}>
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

        <div style={chartCardStyle}>
          <SectionHeader
            title="Volume de Carbono (tCO₂e)"
            action={<Btn small variant="ghost" onClick={exportarRelatorioVendas}>{Icons.download || "📥"}</Btn>}
          />
          <div style={{ height: 220, marginTop: 15 }}>
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

      {/* 4. VENDAS RECENTES */}
      <div style={chartCardStyle}>
        <SectionHeader
          title="Vendas Recentes"
          action={<Link href="/vendas"><Btn small variant="outline">Ver Histórico</Btn></Link>}
        />
        <div style={{ marginTop: 15, display: "flex", flexDirection: "column", gap: 10 }}>
          {vendas.length > 0 ? vendas.slice(0, 4).map((v) => (
            <div key={v.id} style={vendaRowStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={iconBoxStyle}>🌳</div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                    {v.lote || v.loteId || "Lote"}
                  </p>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                    {v.comprador || v.compradorId || "—"} • {v.data || v.date || "—"}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "15px", fontWeight: "800", color: "#0369a1", margin: 0 }}>
                  {fmt(v.valorTotal || v.total || 0)}
                </p>
                <p style={{ fontSize: "11px", fontWeight: "600", color: "#16a34a", margin: 0 }}>
                  {fmtCO2(v.quantidade || 0)}
                </p>
              </div>
            </div>
          )) : (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>
              Nenhuma venda registrada ainda.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}

const bannerStyle = {
  background: "linear-gradient(135deg, #075985 0%, #0369a1 100%)",
  padding: "30px", borderRadius: "20px", display: "flex", justifyContent: "space-between",
  alignItems: "center", boxShadow: "0 10px 25px rgba(3, 105, 161, 0.2)"
};

const chartCardStyle = {
  background: "#fff", padding: "24px", borderRadius: "18px",
  border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
};

const vendaRowStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "14px 18px", background: "#f8fafc", borderRadius: "12px",
  border: "1px solid #f1f5f9"
};

const iconBoxStyle = {
  width: "42px", height: "42px", background: "#fff", borderRadius: "10px",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
};