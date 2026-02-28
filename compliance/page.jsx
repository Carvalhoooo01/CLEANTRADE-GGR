"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";

const TIPOS = ["Certificação VCS", "Certificação Gold Standard", "CAR", "REDD+", "ISO 14064", "Licença Ambiental", "RPPN", "Outro"];
const STATUS = { pendente: { cor: "#f59e0b", label: "Pendente" }, ativo: { cor: "#16a34a", label: "Ativo" }, vencido: { cor: "#ef4444", label: "Vencido" }, renovacao: { cor: "#0ea5e9", label: "Renovação" } };

export default function CompliancePage() {
  const { user, showToast } = useApp();
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ tipo: "Certificação VCS", nome: "", status: "pendente", validade: "", obs: "" });

  const carregar = () => {
    setLoading(true);
    fetch(`/api/compliance?userId=${user?.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setItems(data); })
      .catch(() => showToast("Erro ao carregar", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user?.id) carregar(); }, [user]);

  const handleCriar = async () => {
    if (!form.nome) return showToast("Nome obrigatório", "error");
    try {
      const res = await fetch("/api/compliance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user.id }),
      });
      if (!res.ok) throw new Error();
      setModal(false);
      setForm({ tipo: "Certificação VCS", nome: "", status: "pendente", validade: "", obs: "" });
      carregar();
      showToast("Documento adicionado!", "success");
    } catch { showToast("Erro ao criar", "error"); }
  };

  const handleStatus = async (id, status) => {
    await fetch("/api/compliance", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    showToast("Status atualizado!", "success");
  };

  const handleRemover = async (id) => {
    if (!confirm("Remover documento?")) return;
    await fetch(`/api/compliance?id=${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const porStatus = items.reduce((acc, i) => { acc[i.status] = (acc[i.status] || 0) + 1; return acc; }, {});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Compliance & Certificações</h2>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Controle documentos, certificações e obrigações regulatórias.</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding: "11px 22px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          + Novo Documento
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
        <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", borderLeft: "4px solid #7c3aed" }}>
          <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Total</p>
          <p style={{ fontSize: 28, fontWeight: 900, color: "#111827" }}>{items.length}</p>
        </div>
        {Object.entries(STATUS).map(([key, { cor, label }]) => (
          <div key={key} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", borderLeft: `4px solid ${cor}` }}>
            <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: cor }}>{porStatus[key] || 0}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#9ca3af" }}>Carregando...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "2px dashed #e5e7eb" }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>📋</p>
            <p style={{ fontWeight: 700, color: "#374151", marginBottom: 4 }}>Nenhum documento ainda</p>
            <p style={{ fontSize: 13, color: "#9ca3af" }}>Adicione certificações e documentos regulatórios.</p>
          </div>
        ) : items.map(item => {
          const st = STATUS[item.status] || { cor: "#9ca3af", label: item.status };
          const vencida = item.validade && new Date(item.validade) < new Date();
          return (
            <div key={item.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${st.cor}15`, color: st.cor, border: `1px solid ${st.cor}30` }}>
                    {st.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{item.tipo}</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{item.nome}</p>
                <p style={{ fontSize: 12, color: vencida ? "#ef4444" : "#9ca3af" }}>
                  {item.validade ? `Validade: ${new Date(item.validade).toLocaleDateString("pt-BR")}${vencida ? " ⚠️ VENCIDA" : ""}` : "Sem validade definida"}
                </p>
                {item.obs && <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{item.obs}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <select value={item.status} onChange={e => handleStatus(item.id, e.target.value)}
                  style={{ padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 12, fontFamily: "inherit", cursor: "pointer" }}>
                  {Object.entries(STATUS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
                </select>
                <button onClick={() => handleRemover(item.id)}
                  style={{ padding: "7px 12px", border: "1px solid #fecaca", borderRadius: 8, background: "#fff", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 460, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 17, fontWeight: 800 }}>Novo Documento</p>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { label: "Tipo", key: "tipo", isSelect: true, options: TIPOS },
                { label: "Nome / Número do Documento", key: "nome", type: "text" },
                { label: "Validade", key: "validade", type: "date" },
                { label: "Observação", key: "obs", type: "text" },
              ].map(({ label, key, type, isSelect, options }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 }}>{label}</label>
                  {isSelect ? (
                    <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                      {options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                  )}
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleCriar} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#7c3aed", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Adicionar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
