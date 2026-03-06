"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { fmtCO2 } from "@/data/constants";

const TIPOS_MON = ["satelite", "sensor_solo", "drone", "campo", "laboratorio"];
const COR_TIPO  = { satelite: "#0ea5e9", sensor_solo: "#16a34a", drone: "#8b5cf6", campo: "#f59e0b", laboratorio: "#ef4444" };

export default function MonitoramentoPage() {
  const { user, showToast } = useApp();
  const [projetos, setProjetos] = useState([]);
  const [items,    setItems]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ projetoId: "", tipo: "satelite", co2: "", area: "", ndvi: "", obs: "" });

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

  const totalCO2  = items.reduce((s, i) => s + (i.co2  || 0), 0);
  const totalArea = items.reduce((s, i) => s + (i.area || 0), 0);

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">Monitoramento</h2>
          <p className="text-sm text-gray-500">Registros de medição e verificação de carbono.</p>
        </div>
        <button onClick={() => setModal(true)}
          className="px-5 py-3 rounded-xl border-none bg-sky-500 text-white font-bold text-sm cursor-pointer font-[inherit] hover:bg-sky-600 transition-colors">
          + Novo Registro
        </button>
      </div>

      {/* KPIs */}
      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
        {[
          { label: "Registros",       value: items.length,              cor: "#0ea5e9" },
          { label: "CO₂ Monitorado",  value: fmtCO2(totalCO2),         cor: "#16a34a" },
          { label: "Área Monitorada", value: `${totalArea.toFixed(1)} ha`, cor: "#8b5cf6" },
          { label: "Projetos",        value: projetos.length,           cor: "#f59e0b" },
        ].map(({ label, value, cor }) => (
          <div key={label} className="bg-white rounded-xl px-5 py-[18px] border border-gray-200" style={{ borderLeft: `4px solid ${cor}` }}>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1.5">{label}</p>
            <p className="text-2xl font-black text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <p className="font-extrabold text-sm">Histórico de Medições</p>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-400">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-4xl mb-3">📡</p>
            <p className="font-semibold">Nenhum monitoramento registrado</p>
            <p className="text-sm mt-1">Registre medições de carbono nos seus projetos.</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {["Data", "Projeto", "Tipo", "CO₂", "Área", "NDVI", "Observação"].map(h => (
                  <th key={h} className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-t border-slate-100" style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td className="px-5 py-3 text-xs text-gray-400">{new Date(item.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-5 py-3 text-sm font-bold text-gray-700">{item.projeto?.nome || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: `${COR_TIPO[item.tipo] || "#6b7280"}15`, color: COR_TIPO[item.tipo] || "#6b7280" }}>
                      {item.tipo}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-bold text-green-600">{fmtCO2(item.co2)}</td>
                  <td className="px-5 py-3 text-xs text-gray-700">{item.area} ha</td>
                  <td className="px-5 py-3 text-xs text-gray-700">{item.ndvi ?? "—"}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{item.obs || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-[500] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-[460px] shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <p className="text-lg font-extrabold">Novo Registro</p>
              <button onClick={() => setModal(false)} className="bg-transparent border-none text-xl cursor-pointer text-gray-400">✕</button>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Projeto</label>
                <select value={form.projetoId} onChange={e => setForm(f => ({ ...f, projetoId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-[inherit] outline-none">
                  <option value="">— Selecione —</option>
                  {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1.5">Tipo de Monitoramento</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-[inherit] outline-none">
                  {TIPOS_MON.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {[
                { label: "CO₂ Sequestrado (t)", key: "co2",  type: "number" },
                { label: "Área Medida (ha)",    key: "area", type: "number" },
                { label: "NDVI (opcional)",     key: "ndvi", type: "number" },
                { label: "Observação",          key: "obs",  type: "text"   },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-[inherit] outline-none box-border" />
                </div>
              ))}
              <div className="flex gap-2.5 mt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 bg-white font-bold cursor-pointer font-[inherit]">Cancelar</button>
                <button onClick={handleRegistrar} className="flex-1 py-3 rounded-xl border-none bg-sky-500 text-white font-bold cursor-pointer font-[inherit] hover:bg-sky-600">Registrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}