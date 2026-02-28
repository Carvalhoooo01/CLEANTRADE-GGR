"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { fmtCO2 } from "@/data/constants";

const TIPOS_MON = ["satelite", "sensor_solo", "drone", "campo", "laboratorio"];
const COR_TIPO  = { satelite: "#0ea5e9", sensor_solo: "#16a34a", drone: "#8b5cf6", campo: "#f59e0b", laboratorio: "#ef4444" };

export default function MonitoramentoPage() {
  const { user, showToast } = useApp();
  const [projetos,  setProjetos]  = useState([]);
  const [items,     setItems]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState({ projetoId: "", tipo: "satelite", co2: "", area: "", ndvi: "", obs: "" });

  const carregar = async () => {
    setLoading(true);
    try {
      const [pRes, mRes] = await Promise.all([
        fetch(`/api/projetos?userId=${user?.id}`),
        fetch(`/api/monitoramento?userId=${user?.id}`),
      ]);
      const [p, m] = await Promise.all([pRes.json(), mRes.json()]);
      if (Array.isArray(p)) setProjetos(p);
      if (Array.isArray(m)) setItems(m);
    } catch { showToast("Erro ao carregar", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user?.id) carregar(); }, [user]);

  const handleRegistrar = async () => {
    if (!form.projetoId) return showToast("Selecione um projeto", "error");
    try {
      const res = await fetch("/api/monitoramento", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user.id }),
      });
      if (!res.ok) throw new Error();
      setModal(false);
      setForm({ projetoId: "", tipo: "satelite", co2: "", area: "", ndvi: "", obs: "" });
      carregar();
      showToast("Monitoramento registrado!", "success");
    } catch { showToast("Erro ao registrar", "error"); }
  };

  const totalCO2 = items.reduce((s, i) => s + (i.co2 || 0), 0);
  const totalArea = items.reduce((s, i) => s + (i.area || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Monitoramento</h2>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Registros de medição e verificação de carbono.</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding: "11px 22px", borderRadius: 10, border: "none", background: "#0ea5e9", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          + Novo Registro
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
        {[
          { label: "Registros",       value: items.length,         cor: "#0ea5e9" },
          { label: "CO₂ Monitorado",  value: fmtCO2(totalCO2),    cor: "#16a34a" },
          { label: "Área Monitorada", value: `${totalArea.toFixed(1)} ha`, cor: "#8b5cf6" },
          { label: "Projetos",        value: projetos.length,      cor: "#f59e0b" },
        ].map(({ label, value, cor }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", borderLeft: `4px solid ${cor}` }}>
            <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <p style={{ fontWeight: 800, fontSize: 15 }}>Histórico de Medições</p>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9ca3af" }}>Carregando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📡</p>
            <p style={{ fontWeight: 600 }}>Nenhum monitoramento registrado</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Registre medições de carbono nos seus projetos.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Data", "Projeto", "Tipo", "CO₂", "Área", "NDVI", "Observação"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#9ca3af" }}>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 700, color: "#374151" }}>{item.projeto?.nome || "—"}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${COR_TIPO[item.tipo] || "#6b7280"}15`, color: COR_TIPO[item.tipo] || "#6b7280" }}>
                      {item.tipo}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{fmtCO2(item.co2)}</td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{item.area} ha</td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#374151" }}>{item.ndvi ?? "—"}</td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: "#6b7280" }}>{item.obs || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 17, fontWeight: 800 }}>Novo Registro</p>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 }}>Projeto</label>
                <select value={form.projetoId} onChange={e => setForm(f => ({ ...f, projetoId: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                  <option value="">— Selecione —</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 }}>Tipo de Monitoramento</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                  {TIPOS_MON.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {[
                { label: "CO₂ Sequestrado (t)", key: "co2", type: "number" },
                { label: "Área Medida (ha)",    key: "area", type: "number" },
                { label: "NDVI (opcional)",     key: "ndvi", type: "number" },
                { label: "Observação",          key: "obs",  type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleRegistrar} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#0ea5e9", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
