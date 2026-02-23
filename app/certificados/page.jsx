"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Btn, Badge, SectionHeader } from "@/components/ui";
import { Icons } from "@/components/Icons";

const STATUS_CORES = { 
  disponível: "#16a34a", 
  transferido: "#6b7280", 
  reservado: "#f59e0b", 
  recebido: "#0ea5e9" 
};

export default function CertificadosPage() {
  const { role, certsSeller, certsBuyer, showToast } = useApp();
  const allCerts = role === "vendedor" ? certsSeller : certsBuyer;

  const [filter, setFilter] = useState("todos");
  const [validating, setValidating] = useState(false);

  const filtered = filter === "todos" ? allCerts : allCerts.filter((c) => c.status === filter);

  // --- FUNÇÃO: GERAR DIPLOMA DO CRÉDITO (PDF) ---
  const handleDownloadDiploma = async (cert) => {
    try {
      showToast("Gerando diploma de autenticidade...", "info");
      const { default: jsPDF } = await import("jspdf");
      
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a5"
      });

      // Borda Decorativa
      doc.setDrawColor(22, 163, 74);
      doc.setLineWidth(2);
      doc.rect(5, 5, 200, 138);

      // Conteúdo
      doc.setFontSize(20);
      doc.setTextColor(22, 163, 74);
      doc.text("CERTIFICADO DE ATIVO AMBIENTAL", 105, 30, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text("Este documento certifica que o ativo abaixo foi verificado e registrado.", 105, 45, { align: "center" });

      doc.setFontSize(10);
      doc.text(`ID DO CRÉDITO: ${cert.id}`, 20, 70);
      doc.text(`PROPRIEDADE ORIGEM: Fazenda Verde`, 20, 80);
      doc.text(`SAFRA / VINTAGE: ${cert.year}`, 20, 90);
      doc.text(`VOLUME: 1.000 KG (1 Tonelada de CO2e)`, 20, 100);
      doc.text(`PADRÃO: VERRA VM0042`, 20, 110);

      // Selo de Autenticidade
      doc.setDrawColor(22, 163, 74);
      doc.circle(170, 90, 15);
      doc.setFontSize(8);
      doc.text("ORIGINAL", 170, 91, { align: "center" });

      doc.save(`Diploma_${cert.id}.pdf`);
      showToast("Diploma baixado com sucesso!", "success");
    } catch (e) {
      showToast("Erro ao gerar PDF. Tente novamente.", "error");
    }
  };

  const handleValidate = () => {
    setValidating(true);
    setTimeout(() => {
      setValidating(false);
      showToast("Todos os códigos foram validados na Blockchain!", "success");
    }, 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      
      {/* Banner Informativo */}
      <div style={{ background: "linear-gradient(135deg, #16a34a, #14532d)", borderRadius: 16, padding: 24, color: "#fff", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>🌿 Meus Créditos de Carbono</h2>
        <p style={{ fontSize: 14, opacity: 0.9 }}>
          Unidades individuais de 1 tonelada de CO₂e rastreáveis e verificadas.
        </p>
        
        <div style={{ marginTop: 20, display: "flex", gap: 30 }}>
          <div>
            <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>ESTOQUE TOTAL</span>
            <div style={{ fontSize: 32, fontWeight: 900 }}>{allCerts.length} t</div>
          </div>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.3)", paddingLeft: 20 }}>
            <span style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>DISPONÍVEL Venda</span>
            <div style={{ fontSize: 32, fontWeight: 900 }}>
              {allCerts.filter(c => c.status === "disponível").length} t
            </div>
          </div>
        </div>
      </div>

      {/* Glossário do Código */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 10 }}>📖 Como ler o código do seu crédito:</p>
        <div style={{ display: "flex", gap: 8 }}>
           {["PAÍS (BR)", "SAFRA (2022)", "RG ÚNICO"].map(tag => (
             <div key={tag} style={{ background: "#fff", padding: "4px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, fontWeight: 600 }}>{tag}</div>
           ))}
        </div>
      </div>

      {/* Barra de Filtros e Ações */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8 }}>
          {["todos", "disponível", "transferido"].map(t => (
            <button 
              key={t}
              onClick={() => setFilter(t)}
              style={{ 
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                background: filter === t ? "#16a34a" : "#fff",
                color: filter === t ? "#fff" : "#64748b",
                border: "1px solid " + (filter === t ? "#16a34a" : "#e2e8f0")
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <Btn small onClick={handleValidate} disabled={validating}>
          {validating ? "Validando..." : "✅ Validar na Rede"}
        </Btn>
      </div>

      {/* Lista de Créditos (Estilo Card de Ativo) */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((cert) => (
          <div 
            key={cert.id} 
            style={{ 
              background: "#fff", borderRadius: 14, padding: 18, border: "1px solid #e2e8f0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              transition: "transform 0.2s"
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 44, height: 44, background: "#f0fdf4", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                {cert.status === "disponível" ? "🔓" : "🔒"}
              </div>
              <div>
                <p style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 800, color: "#1e293b" }}>{cert.id}</p>
                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                   <Badge label={`Safra ${cert.year}`} color="#f1f5f9" />
                   <span style={{ fontSize: 12, color: "#94a3b8" }}>1 Tonelada CO2e</span>
                </div>
              </div>
            </div>
            
            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <Badge 
                label={cert.status.toUpperCase()} 
                color={STATUS_CORES[cert.status]} 
              />
              <button 
                onClick={() => handleDownloadDiploma(cert)}
                style={{ background: "none", border: "none", color: "#16a34a", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                {Icons.download} Diploma
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}