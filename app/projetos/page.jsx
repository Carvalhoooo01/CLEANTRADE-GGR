"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Btn, SectionHeader, downloadCSV } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { STATUS_COLORS } from "@/data/constants";

const INIT_PROJECTS = [
  { id: 1, name: "Reflorestamento Mata Atlântica", cert: "Verra", method: "REDD+", region: "Cascavel/PR", area: 280, credits: 42, participants: 12, start: "2022", end: "2032", status: "ativo" },
  { id: 2, name: "Energia Solar Cooperativa Sul", cert: "Gold Standard", method: "Renovável", region: "RS/SC", area: 0, credits: 30, participants: 8, start: "2023", end: "2030", status: "ativo" },
  { id: 3, name: "Preservação Cerrado", cert: "Verra", method: "IFM", region: "GO/MT", area: 150, credits: 15, participants: 5, start: "2021", end: "2031", status: "ativo" },
];

export default function ProjetosPage() {
  const { showToast } = useApp();
  const [projects, setProjects] = useState(INIT_PROJECTS);
  const [selected, setSelected] = useState(null);
  
  // Estados para Modal e Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({ name: "", region: "", area: "", method: "REDD+", cert: "Verra", credits: "", participants: "" });

  // --- LÓGICA DE FUNCIONAMENTO ---

  const openModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setFormData({ ...project });
    } else {
      setEditingProject(null);
      setFormData({ name: "", region: "PR", area: "", method: "REDD+", cert: "Verra", credits: "10", participants: "1", start: "2026", end: "2036", status: "ativo" });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? { ...formData, id: p.id } : p));
      showToast("Projeto atualizado!", "success");
    } else {
      const newProj = { ...formData, id: Date.now() };
      setProjects([...projects, newProj]);
      showToast("Novo projeto criado com sucesso!", "success");
    }
    setIsModalOpen(false);
  };

  const handleDownloadDossie = (e, p) => {
    e.stopPropagation();
    const headers = ["CAMPO", "VALOR"];
    const rows = Object.entries(p).map(([k, v]) => [k.toUpperCase(), v]);
    downloadCSV([headers, ...rows], `Dossie_${p.name}.csv`);
    showToast("Baixando dossiê técnico...");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "slideIn 0.3s ease-out" }}>

      {/* Resumo Gerencial (KPIs) - Visual Original */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          ["Projetos Ativos", `${projects.length}`, "#16a34a", "🌱"],
          ["Área Protegida", `${projects.reduce((s,p) => s + (Number(p.area) || 0), 0)} ha`, "#22c55e", "🗺️"],
          ["Estoque de Créditos", `${projects.reduce((s,p) => s + (Number(p.credits) || 0), 0)} tCO₂`, "#3b82f6", "💰"],
        ].map(([label, value, color, icon]) => (
          <Card key={label} style={{ borderLeft: `4px solid ${color}`, padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "600", textTransform: "uppercase" }}>{label}</p>
                <p style={{ fontSize: "24px", fontWeight: "800", color: "#111827", marginTop: "4px" }}>{value}</p>
              </div>
              <span style={{ fontSize: "24px" }}>{icon}</span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeader 
          title="Projetos de Carbono" 
          description="Gestão de projetos agregados e metodologias aplicadas."
          action={<Btn small onClick={() => openModal()}>{Icons.plus} Novo Projeto</Btn>}
        />

        <div style={{ marginTop: "20px" }}>
          {projects.map((p) => (
            <div key={p.id}
              style={{ 
                border: "1px solid #e5e7eb", borderRadius: "16px", padding: "20px", marginBottom: "12px", cursor: "pointer", 
                background: selected?.id === p.id ? "#f9fafb" : "#fff", transition: "all 0.2s ease" 
              }}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                    {p.method === "REDD+" ? "🌳" : p.method === "IFM" ? "🌿" : "☀️"}
                  </div>
                  <div>
                    <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>{p.name}</h3>
                    <p style={{ fontSize: "12px", color: "#6b7280" }}>{p.cert} · {p.method} · <span style={{ color: "#16a34a", fontWeight: "600" }}>{p.region}</span></p>
                  </div>
                </div>
                <Badge label={p.status.toUpperCase()} color={STATUS_COLORS[p.status]} />
              </div>

              {/* Grid de Detalhes - O visual que você gosta */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px", marginTop: "18px" }}>
                {[
                  ["ÁREA", p.area ? `${p.area} ha` : "—"],
                  ["CRÉDITOS", `${p.credits} tCO₂`],
                  ["PRODUTORES", `${p.participants}`],
                  ["VIGÊNCIA", `${p.start}-${p.end}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ background: "#f1f5f9", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                    <p style={{ fontSize: "10px", color: "#64748b", fontWeight: "800", marginBottom: "2px" }}>{k}</p>
                    <p style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b" }}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Ações ao Selecionar */}
              {selected?.id === p.id && (
                <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <Btn small variant="outline" onClick={(e) => { e.stopPropagation(); openModal(p); }}>{Icons.edit} Editar</Btn>
                    <Btn variant="outline" small onClick={(e) => handleDownloadDossie(e, p)}>{Icons.download} Dossiê</Btn>
                  </div>
                  <Btn style={{ background: "#111827" }} small onClick={(e) => { e.stopPropagation(); showToast("Monitorando via Satélite..."); }}>
                    {Icons.satellite} Monitorar
                  </Btn>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* MODAL DE FORMULÁRIO - Mantendo o estilo Clean */}
      {isModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <Card style={{ width: "100%", maxWidth: "450px", animation: "fadeIn 0.2s ease" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "20px" }}>{editingProject ? "Editar Projeto" : "Novo Projeto"}</h2>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input style={inputS} placeholder="Nome do Projeto" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <div style={{ display: "flex", gap: "10px" }}>
                <input style={inputS} placeholder="Região" value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} />
                <input style={inputS} placeholder="Área (ha)" type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} />
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <input style={inputS} placeholder="Créditos" type="number" value={formData.credits} onChange={e => setFormData({...formData, credits: e.target.value})} />
                <input style={inputS} placeholder="Participantes" type="number" value={formData.participants} onChange={e => setFormData({...formData, participants: e.target.value})} />
              </div>
              <select style={inputS} value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})}>
                <option value="REDD+">REDD+ (Florestal)</option>
                <option value="IFM">IFM (Manejo)</option>
                <option value="Renovável">Energia Renovável</option>
              </select>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <Btn type="submit" style={{ flex: 2 }}>{editingProject ? "Salvar Alterações" : "Criar Projeto"}</Btn>
                <Btn type="button" variant="outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>Cancelar</Btn>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

const inputS = { width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", outline: "none", background: "#f8fafc" };