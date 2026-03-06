"use client";
import React from "react";
import { useApp } from "@/context/AppContext";
import { Btn, Badge, KpiCard, SectionHeader, downloadCSV } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { MONTHLY_DATA, fmt, fmtCO2 } from "@/data/constants";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
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
      doc.setFontSize(18);
      doc.setTextColor(22, 163, 74);
      doc.text("Relatório de Ativos de Carbono", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${dateStr}`, 14, 28);
      doc.text(`Resumo: Volume de ${fmtCO2(totalCO2)} | Total de ${fmt(totalVal)}`, 14, 34);
      const tableRows = transactions.map((t) => [t.date, t.type, t.cert, fmtCO2(t.amount), fmt(t.total), t.status.toUpperCase()]);
      autoTable(doc, {
        startY: 40,
        head: [["Data", "Tipo", "Certificado", "Volume", "Valor", "Status"]],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [22, 163, 74], fontSize: 10, halign: "center" },
        columnStyles: { 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "center" } },
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
    <div className="flex flex-col gap-4 md:gap-6 pb-10">
      
      {/* KPIs - Desktop 3 colunas / Mobile empilhado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <KpiCard label="Volume Total" value={fmtCO2(totalCO2)} sub="↑ 12%" color="#16a34a" />
        <KpiCard label="Valor Investido" value={fmt(totalVal)} sub="Em créditos verificados" color="#22c55e" />
        <KpiCard label="Transações" value={`${transactions.length}`} sub="Este ciclo" color="#3b82f6" />
      </div>

      {/* Gráfico - Altura ajustada para mobile */}
      <div className="bg-white rounded-2xl p-4 md:p-[18px] shadow-sm border border-gray-100">
        <SectionHeader
          title="Evolução de Compras"
          action={
            <Btn small variant="ghost" onClick={() => { downloadCSV(MONTHLY_DATA, "historico.csv"); showToast("CSV exportado! 📥"); }}>
              <span className="md:inline hidden mr-1">{Icons.download}</span> CSV
            </Btn>
          }
        />
        <div className="w-full h-[120px] md:h-[180px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MONTHLY_DATA}>
              <defs>
                <linearGradient id="gH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                formatter={(v) => [`${v} tCO₂`, "Volume"]} 
              />
              <Area type="monotone" dataKey="volume" stroke="#16a34a" strokeWidth={2.5} fill="url(#gH)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela de Transações - Mobile amigável */}
      <div className="bg-white rounded-2xl p-4 md:p-[18px] shadow-sm border border-gray-100">
        <SectionHeader
          title="Transações"
          action={
            <Btn small variant="outline" onClick={handleDownloadPDF}>
              <span className="md:inline hidden mr-1">{Icons.download}</span> PDF
            </Btn>
          }
        />
        
        <div className="mt-4 space-y-2">
          {transactions.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm italic">
              Nenhuma transação encontrada.
            </div>
          ) : (
            transactions.map((t) => (
              <div 
                key={t.id} 
                className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-3 md:gap-0"
              >
                {/* Lado Esquerdo: Ícone e Info Principal */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-lg shrink-0">
                    🌿
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.type}</p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      {t.cert} <span className="mx-1">•</span> {t.date}
                    </p>
                  </div>
                </div>

                {/* Lado Direito: Valores e Status */}
                <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <p className="text-sm font-black text-green-600">{fmtCO2(t.amount)}</p>
                    <p className="text-xs text-gray-500 font-medium">{fmt(t.total)}</p>
                  </div>
                  <div className="shrink-0">
                    <Badge label={t.status} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}