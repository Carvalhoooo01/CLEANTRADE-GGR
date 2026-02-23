"use client";

import { useApp } from "@/context/AppContext";
import { Btn, Badge, KpiCard, SectionHeader } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { MONTHLY_DATA, fmt, fmtCO2 } from "@/data/constants";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function VendasPage() {
  const { vendas, lotes, showToast } = useApp();
  
  const totalReceita = vendas.reduce((s, v) => s + v.total, 0);
  const totalCO2 = vendas.reduce((s, v) => s + v.quantidade, 0);

  // --- FUNÇÃO DE DOWNLOAD DE PDF (VIA JANELA DE IMPRESSÃO FORMATADA) ---
  const exportarPDF = () => {
    const relatorioHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 3px solid #0ea5e9; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 28px; font-weight: 800; color: #0c4a6e; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th { text-align: left; background: #f8fafc; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; color: #64748b; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .total-section { margin-top: 40px; padding: 20px; background: #f0f9ff; border-radius: 12px; text-align: right; }
            .total-value { font-size: 24px; font-weight: 800; color: #0ea5e9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">🌱 CleanTrade</div>
              <p>Relatório de Liquidação de Créditos</p>
            </div>
            <div style="text-align: right;">
              <p><b>PRODUTOR:</b> GUSTAVO CARVALHO</p>
              <p><b>DATA:</b> ${new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Lote</th>
                <th>Comprador</th>
                <th>Data</th>
                <th>Volume</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${vendas.map(v => `
                <tr>
                  <td><b>${v.lote}</b></td>
                  <td>${v.comprador}</td>
                  <td>${v.data}</td>
                  <td>${v.quantidade} tCO2e</td>
                  <td>R$ ${v.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-section">
            <p>RECEITA CONSOLIDADA:</p>
            <p class="total-value">R$ ${totalReceita.toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;

    // Criar o arquivo e forçar o download
    const blob = new Blob([relatorioHtml], { type: 'text/html' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Relatorio_Vendas_CleanTrade_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast("Relatório baixado com sucesso!", "success");
  };

  // --- TOOLTIP DO GRÁFICO ---
  const ChartTip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: "#111827", padding: "10px", borderRadius: "8px", border: "1px solid #334155" }}>
          <p style={{ color: "#94a3b8", fontSize: "10px", marginBottom: "4px" }}>{label}</p>
          <p style={{ color: "#fff", fontSize: "14px", fontWeight: "700" }}>{payload[0].value} tCO₂e</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      
      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <KpiCard label="Receita Total" value={fmt(totalReceita)} sub="↑ 18% este mês" color="#0ea5e9" />
        <KpiCard label="Créditos Liquidados" value={fmtCO2(totalCO2)} sub="Transferidos p/ Comprador" color="#16a34a" />
        <KpiCard label="Contratos" value={`${vendas.length} ordens`} sub="Vendas finalizadas" color="#f59e0b" />
      </div>

      {/* ── GRÁFICO INTERATIVO ── */}
      <div style={cardStyle}>
        <SectionHeader 
          title="Sazonalidade de Volume" 
          sub="Toneladas de CO2 compensadas por mês"
          action={<Btn small variant="ghost" onClick={() => showToast("Exportando CSV...")}>{Icons.download} CSV</Btn>} 
        />
        <div style={{ height: 180, marginTop: 20 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_DATA} barSize={22} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={10} />
              <YAxis hide />
              <Tooltip content={<ChartTip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="volume" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }}>
        
        {/* ── LISTA DE VENDAS ── */}
        <div style={cardStyle}>
          <SectionHeader 
            title="Histórico de Vendas" 
            action={<Btn small variant="ghost" onClick={exportarPDF}>{Icons.download} Baixar PDF</Btn>} 
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 15 }}>
            {vendas.map((v) => (
              <div key={v.id} style={rowStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={iconStyle}>📄</div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: 0 }}>{v.lote}</p>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{v.comprador} • {v.data}</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "14px", fontWeight: "800", color: "#0ea5e9", margin: 0 }}>{fmt(v.total)}</p>
                  <p style={{ fontSize: "11px", color: "#16a34a", fontWeight: "600", margin: 0 }}>{fmtCO2(v.quantidade)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PERFORMANCE POR LOTE ── */}
        <div style={cardStyle}>
          <SectionHeader title="Liquidez por Lote" />
          <div style={{ marginTop: 20 }}>
            {lotes.map((l) => {
              const pct = l.quantidade + l.vendidos > 0 ? (l.vendidos / (l.quantidade + l.vendidos)) * 100 : 0;
              return (
                <div key={l.id} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#334155" }}>{l.name}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={progressBg}>
                    <div style={{ ...progressFill, width: `${pct}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>Receita: {fmt(l.receita)}</span>
                    <span style={{ fontSize: "10px", fontWeight: "700", color: "#16a34a" }}>{l.status.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- ESTILOS REUTILIZÁVEIS ---
const cardStyle = { background: "#fff", borderRadius: "18px", padding: "24px", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" };
const rowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" };
const iconStyle = { width: "36px", height: "36px", background: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" };
const progressBg = { background: "#f1f5f9", borderRadius: "10px", height: "8px", overflow: "hidden" };
const progressFill = { background: "linear-gradient(90deg, #0ea5e9, #38bdf8)", height: "100%", transition: "width 1s ease" };