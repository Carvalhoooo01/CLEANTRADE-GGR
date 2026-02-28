"use client";
import { useApp } from "@/context/AppContext";
import { fmt, fmtCO2 } from "@/data/constants";

const STATUS_COR = { disponivel: "#16a34a", reservado: "#f59e0b", transferido: "#6b7280" };

export default function InventarioPage() {
  const { certs, properties, lotes, transactions } = useApp();

  const totalCO2Certs    = certs.length;
  const totalCO2Comprado = transactions?.filter(t => t.type !== "deposito" && t.type !== "saque").reduce((s, t) => s + (t.amount || 0), 0) || 0;
  const totalPropriedades = properties?.reduce((s, p) => s + (p.co2 || 0), 0) || 0;
  const totalLotes        = lotes?.reduce((s, l) => s + (l.quantidade || 0), 0) || 0;

  const porStatus = certs.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#064e3b,#065f46)", borderRadius: 16, padding: "28px 32px", color: "#fff" }}>
        <p style={{ opacity: 0.7, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Inventário de Carbono</p>
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Seus Ativos CO₂</h2>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          {[
            { label: "Certificados",    value: totalCO2Certs },
            { label: "CO₂ Adquirido",  value: fmtCO2(totalCO2Comprado) },
            { label: "CO₂ Propriedades", value: fmtCO2(totalPropriedades) },
            { label: "Em Estoque (lotes)", value: fmtCO2(totalLotes) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: 22, fontWeight: 900 }}>{value}</p>
              <p style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Status dos certificados */}
      {certs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {Object.entries(porStatus).map(([status, qtd]) => (
            <div key={status} style={{ background: "#fff", borderRadius: 14, padding: 20, border: `1px solid ${STATUS_COR[status] || "#e5e7eb"}30`, borderLeft: `4px solid ${STATUS_COR[status] || "#6b7280"}` }}>
              <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>{status}</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: STATUS_COR[status] || "#374151" }}>{qtd}</p>
              <p style={{ fontSize: 12, color: "#6b7280" }}>{qtd === 1 ? "certificado" : "certificados"}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabela de certificados */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 800, fontSize: 15 }}>Certificados ({certs.length})</p>
        </div>
        {certs.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🌿</p>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Nenhum certificado ainda</p>
            <p style={{ fontSize: 13 }}>Faça uma compra no marketplace para gerar seus créditos.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Serial", "Padrão", "Projeto", "Ano", "Status", "Emitido em"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {certs.map((c, i) => (
                <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: "#374151" }}>{c.serial}</td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{c.standard}</td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{c.projectId}</td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{c.year}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${STATUS_COR[c.status] || "#6b7280"}15`, color: STATUS_COR[c.status] || "#6b7280", border: `1px solid ${STATUS_COR[c.status] || "#6b7280"}30` }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#9ca3af" }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : c.date || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Propriedades */}
      {properties?.length > 0 && (
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
            <p style={{ fontWeight: 800, fontSize: 15 }}>Propriedades Registradas</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14, padding: 20 }}>
            {properties.map(p => (
              <div key={p.id} style={{ padding: 16, background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{p.name}</p>
                <p style={{ fontSize: 12, color: "#6b7280" }}>Área: <strong>{p.area} ha</strong></p>
                <p style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginTop: 4 }}>CO₂: {fmtCO2(p.co2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
