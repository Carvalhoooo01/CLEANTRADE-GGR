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
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Projetos de Carbono</h2>
          <p className="text-sm text-gray-500">Gerencie seus projetos e acompanhe a geração de créditos.</p>
        </div>
        <button onClick={() => setModal(true)}
          className="px-5 py-3 rounded-xl border-none bg-green-600 text-white font-bold text-sm cursor-pointer font-[inherit] hover:bg-green-700 transition-colors">
          + Novo Projeto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        {[
          { label: "Total de Projetos", value: projetos.length, cor: "#0ea5e9" },
          { label: "CO₂ Estimado",      value: fmtCO2(totalCO2Est), cor: "#16a34a" },
          { label: "CO₂ Verificado",    value: fmtCO2(totalCO2Ver), cor: "#8b5cf6" },
          { label: "Projetos Ativos",   value: projetos.filter(p => p.status === "ativo").length, cor: "#f59e0b" },
        ].map(({ label, value, cor }) => (
          <div key={label} className="bg-white rounded-xl px-5 py-[18px] border border-gray-200" style={{ borderLeft: `4px solid ${cor}` }}>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1.5">{label}</p>
            <p className="text-2xl font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : projetos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-4xl mb-3">🌳</p>
          <p className="font-bold text-gray-700 mb-1">Nenhum projeto ainda</p>
          <p className="text-sm text-gray-400">Crie seu primeiro projeto de carbono.</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
          {projetos.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-[18px] py-3.5 border-b border-green-100 flex justify-between items-center"
                style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
                <div>
                  <p className="text-xs font-bold text-green-700 uppercase">{p.tipo}</p>
                  <p className="text-base font-extrabold text-gray-900 mt-0.5">{p.nome}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white"
                  style={{ color: STATUS_COR[p.status] || "#6b7280", border: `1px solid ${STATUS_COR[p.status] || "#e5e7eb"}40` }}>
                  {p.status?.toUpperCase()}
                </span>
              </div>
              <div className="px-[18px] py-3.5 flex flex-col gap-2">
                {p.descricao && <p className="text-sm text-gray-500 mb-1">{p.descricao}</p>}
                {[
                  ["Área",           `${p.area || 0} ha`],
                  ["CO₂ Estimado",   fmtCO2(p.co2Estimado  || 0)],
                  ["CO₂ Verificado", fmtCO2(p.co2Verificado || 0)],
                  ["Propriedade",    p.property?.name || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-xs text-gray-400">{k}</span>
                    <span className="text-xs font-bold text-gray-700">{v}</span>
                  </div>
                ))}

                {/* Barra de progresso */}
                <div className="mt-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">Progresso de verificação</span>
                    <span className="text-xs font-bold text-green-600">
                      {p.co2Estimado > 0 ? ((p.co2Verificado / p.co2Estimado) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full">
                    <div className="h-full bg-green-600 rounded-full"
                      style={{ width: `${Math.min(100, p.co2Estimado > 0 ? (p.co2Verificado / p.co2Estimado) * 100 : 0)}%` }} />
                  </div>
                </div>

                <button onClick={() => handleRemover(p.id)}
                  className="mt-2 py-2 rounded-lg border border-red-200 bg-white text-red-600 text-xs font-bold cursor-pointer font-[inherit] hover:bg-red-50">
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-[480px] shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <p className="text-lg font-extrabold">Novo Projeto</p>
              <button onClick={() => setModal(false)} className="bg-transparent border-none text-xl cursor-pointer text-gray-400">✕</button>
            </div>
            <div className="flex flex-col gap-3.5">
              {[
                { label: "Nome do Projeto",     key: "nome",         type: "text"   },
                { label: "Descrição",           key: "descricao",    type: "text"   },
                { label: "Área (ha)",           key: "area",         type: "number" },
                { label: "CO₂ Estimado (t)",    key: "co2Estimado",  type: "number" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-[inherit] outline-none box-border" />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Tipo</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-[inherit] outline-none">
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {properties?.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">Propriedade (opcional)</label>
                  <select value={form.propertyId} onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-[inherit] outline-none">
                    <option value="">— Nenhuma —</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-2.5 mt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 bg-white font-bold cursor-pointer font-[inherit]">Cancelar</button>
                <button onClick={handleCriar} className="flex-1 py-3 rounded-xl border-none bg-green-600 text-white font-bold cursor-pointer font-[inherit] hover:bg-green-700">Criar Projeto</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}