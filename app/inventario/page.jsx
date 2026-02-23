"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Btn, SectionHeader, downloadCSV } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { STATUS_COLORS } from "@/data/constants";

export default function InventarioPage() {
  const { properties, showToast } = useApp();
  const [calc, setCalc] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // LISTA DE HISTÓRICO: Aqui você pode adicionar todos os registros passados
  // No futuro, esses dados virão do seu banco de dados (Supabase/Postgres)
  const [historicoInventarios, setHistoricoInventarios] = useState([
    { 
      id: "INV-001", 
      prop: "Fazenda Verde", 
      year: 2025, 
      emissoes: "14.40", 
      sequestro: "57.60", 
      saldo: "43.20", 
      method: "VM0042", 
      status: "validado" 
    },
    { 
      id: "INV-002", 
      prop: "Sítio Esperança", 
      year: 2025, 
      emissoes: "8.20", 
      sequestro: "32.80", 
      saldo: "24.60", 
      method: "VM0042", 
      status: "pendente" 
    }
  ]);

  // FUNÇÃO PDF (VERSÃO SEGURA QUE FUNCIONOU)
  const handleExportPDF = async (data) => {
    try {
      showToast("Gerando PDF...", "info");
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      doc.setFillColor(22, 163, 74); 
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("CleanTrade - Inventário Ambiental", 14, 25);
      
      autoTable(doc, {
        startY: 50,
        head: [['Indicador', 'Valor']],
        body: [
          ["Propriedade", data.prop],
          ["ID do Inventário", data.id || "Novo"],
          ["Metodologia", data.method || "VM0042"],
          ["Emissões", `-${data.emissoes} tCO2e`],
          ["Sequestro", `+${data.sequestro} tCO2e`],
          ["Saldo Líquido", `${data.saldo} tCO2e`],
          ["Status", data.status.toUpperCase()]
        ],
        theme: 'striped',
        headStyles: { fillColor: [22, 163, 74] }
      });

      doc.save(`Inventario_${data.prop}_${data.year || "2026"}.pdf`);
      showToast("Download realizado!", "success");
    } catch (error) {
      showToast("Erro ao gerar PDF", "error");
    }
  };

  const runCalc = () => {
    if (!calc) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      const areaVal = parseFloat(calc.area) || 0;
      const res = { 
        prop: calc.name, 
        emissoes: (areaVal * 0.12).toFixed(2), 
        sequestro: (areaVal * 0.48).toFixed(2), 
        saldo: (areaVal * 0.36).toFixed(2), 
        method: "VM0042", 
        status: "pendente",
        year: 2026
      };
      setResult(res);
      setLoading(false);
      showToast("Cálculo concluído!", "success");
    }, 1000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* SEÇÃO 1: CALCULADORA */}
      <Card>
        <SectionHeader title="Calculadora de Inventário" />
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "20px 0" }}>
          {properties.map((p) => (
            <button key={p.id} onClick={() => { setCalc(p); setResult(null); }}
              style={{ 
                padding: "12px 18px", borderRadius: "12px", 
                border: `2px solid ${calc?.id === p.id ? "#16a34a" : "#e5e7eb"}`, 
                background: calc?.id === p.id ? "#f0fdf4" : "white", cursor: "pointer", 
                fontSize: "14px", fontWeight: "700", color: calc?.id === p.id ? "#15803d" : "#4b5563" 
              }}>
              🌾 {p.name}
            </button>
          ))}
        </div>

        {calc && (
          <div style={{ padding: "20px", background: "#f8fafc", borderRadius: "14px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontWeight: "800" }}>{calc.name} ({calc.area} ha)</p>
            <Btn onClick={runCalc} disabled={loading}>{loading ? "Processando..." : "Gerar Inventário"}</Btn>
          </div>
        )}

        {result && (
          <div style={{ marginTop: "20px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "16px", padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "15px" }}>
              <div style={resStyle}> <p style={labStyle}>EMISSÕES</p> <p style={{color: "#dc2626", fontWeight: "800"}}>-{result.emissoes}</p> </div>
              <div style={resStyle}> <p style={labStyle}>SEQUESTRO</p> <p style={{color: "#16a34a", fontWeight: "800"}}>+{result.sequestro}</p> </div>
              <div style={{...resStyle, background: "#16a34a", color: "white"}}> <p style={{...labStyle, color: "white"}}>SALDO</p> <p style={{fontWeight: "900"}}>{result.saldo} t</p> </div>
            </div>
            <Btn small onClick={() => handleExportPDF(result)}>{Icons.download} Baixar PDF</Btn>
          </div>
        )}
      </Card>

      {/* SEÇÃO 2: HISTÓRICO REGISTRADO (MAIS COMPLETO) */}
      <Card>
        <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#111827", marginBottom: "20px" }}>📚 Inventários Registrados</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {historicoInventarios.map((inv) => (
            <div key={inv.id} style={{ 
              display: "flex", justifyContent: "space-between", alignItems: "center", 
              padding: "16px", background: "#fff", borderRadius: "12px", border: "1px solid #f1f5f9" 
            }}>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <div style={{ fontSize: "20px" }}>📄</div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{inv.prop} — {inv.year}</p>
                  <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700" }}>ID: {inv.id} | {inv.method}</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "800" }}>SALDO</p>
                  <p style={{ fontSize: "14px", fontWeight: "800", color: "#16a34a" }}>+{inv.saldo} t</p>
                </div>
                <Badge label={inv.status.toUpperCase()} color={STATUS_COLORS[inv.status]} />
                <button 
                  onClick={() => handleExportPDF(inv)}
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "8px", cursor: "pointer" }}
                >
                  {Icons.download}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

const resStyle = { background: "#fff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", textAlign: "center" };
const labStyle = { fontSize: "10px", fontWeight: "800", color: "#64748b", marginBottom: "4px" };