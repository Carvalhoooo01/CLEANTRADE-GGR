"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Btn, Badge } from "@/components/ui";

const STATUS_CORES  = { disponivel: "#16a34a", transferido: "#6b7280", reservado: "#f59e0b", recebido: "#0ea5e9" };
const STATUS_LABEL  = { disponivel: "Disponível", transferido: "Transferido", reservado: "Reservado", recebido: "Recebido" };
const STATUS_EMOJI  = { disponivel: "🔓", transferido: "🔒", reservado: "⏳", recebido: "✅" };

export default function CertificadosPage() {
  const { certs, setCerts, user, showToast, ready } = useApp();

  const [filter,     setFilter]     = useState("todos");
  const [validating, setValidating] = useState(false);
  const [detalhe,    setDetalhe]    = useState(null);
  const [fetching,   setFetching]   = useState(false);

  // Garante que busca do banco ao entrar na página
  useEffect(() => {
    if (!ready || !user?.id) return;
    setFetching(true);
    fetch(`/api/certificados?userId=${user.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCerts(data); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [ready, user?.id]);

  const filtered = filter === "todos" ? certs : certs.filter(c => c.status === filter);

  const handleDownloadDiploma = async (cert) => {
    try {
      showToast("Gerando diploma...", "info");
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });

      doc.setDrawColor(22, 163, 74);
      doc.setLineWidth(2);
      doc.rect(5, 5, 200, 138);

      doc.setFontSize(20);
      doc.setTextColor(22, 163, 74);
      doc.text("CERTIFICADO DE ATIVO AMBIENTAL", 105, 28, { align: "center" });

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text("Este documento certifica que o ativo abaixo foi verificado e registrado.", 105, 42, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(30, 30, 30);
      const lines = [
        ["ID DO CRÉDITO:", cert.serial],
        ["PROPRIETÁRIO:",  user?.nome || "—"],
        ["PADRÃO:",        `${cert.standard} (${cert.country})`],
        ["SAFRA:",         cert.year],
        ["PROJETO:",       cert.projectId],
        ["VOLUME:",        "1.000 KG (1 Tonelada de CO₂e)"],
        ["STATUS:",        STATUS_LABEL[cert.status] || cert.status],
        ["EMISSÃO:",       cert.date || "—"],
      ];
      lines.forEach(([label, value], i) => {
        doc.setFont(undefined, "bold");
        doc.text(label, 20, 60 + i * 9);
        doc.setFont(undefined, "normal");
        doc.text(value, 75, 60 + i * 9);
      });

      doc.setDrawColor(22, 163, 74);
      doc.circle(173, 95, 16);
      doc.setFontSize(7);
      doc.setTextColor(22, 163, 74);
      doc.text("VERIFICADO", 173, 93, { align: "center" });
      doc.text("ORIGINAL",   173, 99, { align: "center" });

      doc.save(`Diploma_${cert.serial}.pdf`);
      showToast("Diploma baixado!", "success");
    } catch {
      showToast("Erro ao gerar PDF.", "error");
    }
  };

  const handleAlterarStatus = async (cert, novoStatus) => {
    try {
      const res = await fetch("/api/certificados", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: cert.id, status: novoStatus }),
      });
      if (!res.ok) throw new Error();
      const atualizado = await res.json();
      setCerts(prev => prev.map(c => c.id === cert.id ? atualizado : c));
      setDetalhe(atualizado);
      showToast("Status atualizado!", "success");
    } catch {
      showToast("Erro ao atualizar status.", "error");
    }
  };

  const handleValidate = () => {
    setValidating(true);
    setTimeout(() => { setValidating(false); showToast("Todos os códigos validados na Blockchain!", "success"); }, 2000);
  };

  if (!ready || fetching) return (
    <div style={{ padding: 60, textAlign: "center", color: "#6b7280" }}>
      <p style={{ fontSize: 32, marginBottom: 12 }}>🌿</p>
      <p>Carregando certificados...</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>

      {/* BANNER */}
      <div style={{ background: "linear-gradient(135deg,#16a34a,#14532d)", borderRadius: 16, padding: 28, color: "#fff" }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>🌿 Meus Créditos de Carbono</h2>
        <p style={{ fontSize: 13, opacity: 0.85, marginBottom: 20 }}>Unidades individuais de 1 tCO₂e rastreáveis e verificadas.</p>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "TOTAL",        value: certs.length },
            { label: "DISPONÍVEIS",  value: certs.filter(c => c.status === "disponivel").length },
            { label: "TRANSFERIDOS", value: certs.filter(c => c.status === "transferido").length },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 11, opacity: 0.7, fontWeight: 700 }}>{label}</p>
              <p style={{ fontSize: 30, fontWeight: 900 }}>{value} t</p>
            </div>
          ))}
        </div>
      </div>

      {/* GLOSSÁRIO */}
      <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>📖 Como ler o código:</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["PAÍS (BR)", "PADRÃO (VCS)", "PROJETO", "ANO", "Nº SERIAL"].map(tag => (
            <div key={tag} style={{ background: "#fff", padding: "4px 10px", borderRadius: 6, border: "1px solid #cbd5e1", fontSize: 11, fontWeight: 600 }}>{tag}</div>
          ))}
        </div>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["todos", "disponivel", "transferido", "reservado"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer", background: filter === f ? "#16a34a" : "#fff", color: filter === f ? "#fff" : "#64748b", border: "1px solid " + (filter === f ? "#16a34a" : "#e2e8f0"), fontFamily: "inherit" }}>
              {f === "todos" ? "TODOS" : STATUS_LABEL[f]?.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={handleValidate} disabled={validating}
          style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "#111827", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: validating ? 0.7 : 1, fontFamily: "inherit" }}>
          {validating ? "Validando..." : "✅ Validar na Rede"}
        </button>
      </div>

      {/* LISTA */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "2px dashed #e2e8f0" }}>
          <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            {certs.length === 0
              ? "Nenhum certificado ainda. Faça uma compra no marketplace!"
              : "Nenhum certificado para este filtro."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {filtered.map(cert => (
            <div key={cert.id} onClick={() => setDetalhe(cert)}
              style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f0fdf4"; e.currentTarget.style.borderColor = "#86efac"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "#e2e8f0"; }}>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, background: `${STATUS_CORES[cert.status] || "#6b7280"}15`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  {STATUS_EMOJI[cert.status] || "📄"}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 800, color: "#1e293b" }}>{cert.serial}</p>
                  <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Safra {cert.year} · 1 tCO₂e · {cert.date}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${STATUS_CORES[cert.status] || "#6b7280"}15`, color: STATUS_CORES[cert.status] || "#6b7280", fontWeight: 700 }}>
                  {STATUS_LABEL[cert.status] || cert.status}
                </span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>Ver detalhes →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETALHE */}
      {detalhe && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setDetalhe(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <p style={{ fontWeight: 900, fontSize: 15, color: "#111827", fontFamily: "monospace", marginBottom: 6 }}>{detalhe.serial}</p>
                <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${STATUS_CORES[detalhe.status]}15`, color: STATUS_CORES[detalhe.status], fontWeight: 700 }}>
                  {STATUS_LABEL[detalhe.status]}
                </span>
              </div>
              <button onClick={() => setDetalhe(null)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "16px 20px", marginBottom: 20, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Volume certificado</p>
              <p style={{ fontSize: 32, fontWeight: 900, color: "#16a34a" }}>1 tCO₂e</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {[
                { label: "Padrão",  value: `${detalhe.standard} (${detalhe.country})` },
                { label: "Projeto", value: detalhe.projectId },
                { label: "Safra",   value: detalhe.year },
                { label: "Emissão", value: detalhe.date || "—" },
                { label: "Status",  value: STATUS_LABEL[detalhe.status] },
              ].map(row => (
                <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f9fafb", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {detalhe.status === "disponivel" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={() => handleAlterarStatus(detalhe, "reservado")}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "2px solid #f59e0b", background: "#fffbeb", color: "#b45309", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  ⏳ Reservar
                </button>
                <button onClick={() => handleAlterarStatus(detalhe, "transferido")}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "2px solid #6b7280", background: "#f9fafb", color: "#374151", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  🔒 Transferir
                </button>
              </div>
            )}
            {detalhe.status === "reservado" && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button onClick={() => handleAlterarStatus(detalhe, "disponivel")}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "2px solid #16a34a", background: "#f0fdf4", color: "#166534", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  🔓 Liberar
                </button>
                <button onClick={() => handleAlterarStatus(detalhe, "transferido")}
                  style={{ flex: 1, padding: 10, borderRadius: 10, border: "2px solid #6b7280", background: "#f9fafb", color: "#374151", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  🔒 Transferir
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => handleDownloadDiploma(detalhe)}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                📄 Baixar Diploma PDF
              </button>
              <button onClick={() => setDetalhe(null)}
                style={{ padding: "12px 20px", borderRadius: 10, border: "none", background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}