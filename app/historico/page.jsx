"use client";
import React from "react";
import { useApp } from "@/context/AppContext";
import { Btn, Badge, KpiCard, SectionHeader, downloadCSV } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { MONTHLY_DATA, fmt, fmtCO2 } from "@/data/constants";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";

// Imports corrigidos para o PDF
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; 

export default function HistoricoPage() {
  const { transactions, showToast } = useApp();
  
  const totalCO2 = transactions.reduce((s, t) => s + t.amount, 0);
  const totalVal = transactions.reduce((s, t) => s + t.total, 0);

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      const dateStr = new Date().toLocaleDateString("pt-BR");

      // 1. Título e Estilo
      doc.setFontSize(18);
      doc.setTextColor(22, 163, 74); 
      doc.text("Relatório de Ativos de Carbono", 14, 20);

      // 2. Resumo
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${dateStr}`, 14, 28);
      doc.text(`Resumo: Volume de ${fmtCO2(totalCO2)} | Total de ${fmt(totalVal)}`, 14, 34);

      // 3. Dados da Tabela
      const tableRows = transactions.map((t) => [
        t.date,
        t.type,
        t.cert,
        fmtCO2(t.amount),
        fmt(t.total),
        t.status.toUpperCase(),
      ]);

      // 4. Chamada da função autoTable (forma mais segura)
      autoTable(doc, {
        startY: 40,
        head: [["Data", "Tipo", "Certificado", "Volume", "Valor", "Status"]],
        body: tableRows,
        theme: "striped",
        headStyles: { 
          fillColor: [22, 163, 74], 
          fontSize: 10,
          halign: 'center' 
        },
        columnStyles: {
          3: { halign: 'right' }, 
          4: { halign: 'right' }, 
          5: { halign: 'center' } 
        },
        styles: { fontSize: 9 },
      });

      doc.save(`relatorio-carbono-${new Date().getTime()}.pdf`);
      showToast("Relatório PDF baixado! 📄");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showToast("Erro ao gerar o PDF.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Cards de KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <KpiCard label="Volume Total" value={fmtCO2(totalCO2)} sub="↑ 12%" color="#16a34a" />
        <KpiCard label="Valor Investido" value={fmt(totalVal)} sub="Em créditos verificados" color="#22c55e" />
        <KpiCard label="Transações" value={`${transactions.length}`} sub="Este ciclo" color="#3b82f6" />
      </div>

      {/* Gráfico de Evolução */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <SectionHeader 
          title="Evolução de Compras" 
          action={
            <Btn small variant="ghost" onClick={() => { downloadCSV(MONTHLY_DATA, "historico.csv"); showToast("CSV exportado! 📥"); }}>
              {Icons.download} CSV
            </Btn>
          } 
        />
        <ResponsiveContainer width="100%" height={90}>
          <AreaChart data={MONTHLY_DATA}>
            <defs>
              <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v} tCO₂`, "Volume"]} />
            <Area type="monotone" dataKey="volume" stroke="#16a34a" strokeWidth={2.5} fill="url(#gH)" dot={false} activeDot={{ r: 5 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Tabela de Transações */}
      <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <SectionHeader 
          title="Todas as Transações" 
          action={
            <Btn small variant="outline" onClick={handleDownloadPDF}>
              {Icons.download} Relatório PDF
            </Btn>
          } 
        />
        
        {transactions.map((t) => (
          <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#fafafa", borderRadius: 10, marginBottom: 6, border: "1px solid #f0f0f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🌿</div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{t.type}</p>
                <p style={{ fontSize: 11, color: "#9ca3af" }}>{t.cert} · {t.date}</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#16a34a" }}>{fmtCO2(t.amount)}</p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>{fmt(t.total)}</p>
              </div>
              <Badge label={t.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}