"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { fmtCO2 } from "@/data/constants";

const TIPOS = ["Florestal", "Agrícola", "Energia Renovável", "Eficiência Energética", "Resíduos"];
const STATUS_COR = { ativo: "#16a34a", pausado: "#f59e0b", encerrado: "#6b7280" };

export default function ProjetosPage() {
  const { user, properties, showToast } = useApp();
  const [projetos, setProjetos] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ nome: "", descricao: "", tipo: "Florestal", area: "", co2Estimado: "", propertyId: "" });

  const carregar = () => {
    setLoading(true);
    fetch(`/api/projetos?userId=${user?.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjetos(data); })
      .catch(() => showToast("Erro ao carregar projetos", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (user?.id) carregar(); }, [user]);

  const handleCriar = async () => {
    if (!form.nome) return showToast("Nome obrigatório", "error");
    try {
      const res = await fetch("/api/projetos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user.id, area: parseFloat(form.area) || 0, co2Estimado: parseFloat(form.co2Estimado) || 0 }),
      });
      if (!res.ok) throw new Error();
      setModal(false);
      setForm({ nome: "", descricao: "", tipo: "Florestal", area: "", co2Estimado: "", propertyId: "" });
      carregar();
      showToast("Projeto criado!", "success");
    } catch { showToast("Erro ao criar projeto", "error"); }
  };

  const handleRemover = async (id) => {
    if (!confirm("Remover projeto?")) return;
    await fetch(`/api/projetos?id=${id}`, { method: "DELETE" });
    setProjetos(p => p.filter(x => x.id !== id));
    showToast("Projeto removido.", "success");
  };

  const totalCO2Est = projetos.reduce((s, p) => s + (p.co2Estimado || 0), 0);
  const totalCO2Ver = projetos.reduce((s, p) => s + (p.co2Verificado || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827" }}>Projetos de Carbono</h2>
          <p style={{ fontSize: 13, color: "#6b7280" }}>Gerencie seus projetos e acompanhe a geração de créditos.</p>
        </div>
        <button onClick={() => setModal(true)}
          style={{ padding: "11px 22px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>
          + Novo Projeto
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
        {[
          { label: "Total de Projetos",  value: projetos.length,      cor: "#0ea5e9" },
          { label: "CO₂ Estimado",       value: fmtCO2(totalCO2Est),  cor: "#16a34a" },
          { label: "CO₂ Verificado",     value: fmtCO2(totalCO2Ver),  cor: "#8b5cf6" },
          { label: "Projetos Ativos",    value: projetos.filter(p => p.status === "ativo").length, cor: "#f59e0b" },
        ].map(({ label, value, cor }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e5e7eb", borderLeft: `4px solid ${cor}` }}>
            <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#9ca3af" }}>Carregando...</div>
      ) : projetos.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", borderRadius: 16, border: "2px dashed #e5e7eb" }}>
          <p style={{ fontSize: 36, marginBottom: 12 }}>🌳</p>
          <p style={{ fontWeight: 700, color: "#374151", marginBottom: 4 }}>Nenhum projeto ainda</p>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Crie seu primeiro projeto de carbono.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
          {projetos.map(p => (
            <div key={p.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", padding: "14px 18px", borderBottom: "1px solid #d1fae5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>{p.tipo}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginTop: 2 }}>{p.nome}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fff", color: STATUS_COR[p.status] || "#6b7280", border: `1px solid ${STATUS_COR[p.status] || "#e5e7eb"}40` }}>
                  {p.status?.toUpperCase()}
                </span>
              </div>
              <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                {p.descricao && <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>{p.descricao}</p>}
                {[
                  ["Área", `${p.area || 0} ha`],
                  ["CO₂ Estimado",  fmtCO2(p.co2Estimado  || 0)],
                  ["CO₂ Verificado", fmtCO2(p.co2Verificado || 0)],
                  ["Propriedade",   p.property?.name || "—"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>{v}</span>
                  </div>
                ))}

                {/* Barra de progresso */}
                <div style={{ marginTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>Progresso de verificação</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                      {p.co2Estimado > 0 ? ((p.co2Verificado / p.co2Estimado) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10 }}>
                    <div style={{ width: `${Math.min(100, p.co2Estimado > 0 ? (p.co2Verificado / p.co2Estimado) * 100 : 0)}%`, height: "100%", background: "#16a34a", borderRadius: 10 }} />
                  </div>
                </div>

                <button onClick={() => handleRemover(p.id)}
                  style={{ marginTop: 8, padding: "8px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff", color: "#dc2626", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 480, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <p style={{ fontSize: 17, fontWeight: 800 }}>Novo Projeto</p>
              <button onClick={() => setModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Nome do Projeto", key: "nome", type: "text" },
                { label: "Descrição",       key: "descricao", type: "text" },
                { label: "Área (ha)",       key: "area", type: "number" },
                { label: "CO₂ Estimado (t)", key: "co2Estimado", type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 }}>Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {properties?.length > 0 && (
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 5 }}>Propriedade (opcional)</label>
                  <select value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                    style={{ width: "100%", padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontFamily: "inherit" }}>
                    <option value="">— Nenhuma —</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                <button onClick={() => setModal(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
                <button onClick={handleCriar} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Criar Projeto</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
