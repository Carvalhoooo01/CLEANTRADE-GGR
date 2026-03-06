"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";

const TIPOS  = ["Certificacao VCS", "Certificacao Gold Standard", "CAR", "REDD+", "ISO 14064", "Licenca Ambiental", "RPPN", "Outro"];
const STATUS: Record<string, { cor: string; label: string }> = {
  pendente:  { cor: "#f59e0b", label: "Pendente"  },
  ativo:     { cor: "#16a34a", label: "Ativo"      },
  vencido:   { cor: "#ef4444", label: "Vencido"    },
  renovacao: { cor: "#0ea5e9", label: "Renovacao"  },
};

const inputCls = "w-full px-3 py-[9px] border border-gray-200 rounded-lg text-sm font-[inherit] outline-none focus:border-violet-500 box-border";

export default function CompliancePage() {
  const { user, showToast } = useApp();
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState({ tipo: "Certificacao VCS", nome: "", status: "pendente", validade: "", obs: "" });

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
    if (!form.nome) return showToast("Nome obrigatorio", "error");
    try {
      const res = await fetch("/api/compliance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId: user.id }),
      });
      if (!res.ok) throw new Error();
      setModal(false);
      setForm({ tipo: "Certificacao VCS", nome: "", status: "pendente", validade: "", obs: "" });
      carregar();
      showToast("Documento adicionado!", "success");
    } catch { showToast("Erro ao criar", "error"); }
  };

  const handleStatus = async (id: string, status: string) => {
    await fetch("/api/compliance", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    setItems(prev => prev.map(i => i.id === id ? { ...i, status } : i));
    showToast("Status atualizado!", "success");
  };

  const handleRemover = async (id: string) => {
    if (!confirm("Remover documento?")) return;
    await fetch(`/api/compliance?id=${id}`, { method: "DELETE" });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const porStatus = items.reduce((acc: Record<string, number>, i: any) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Header
          Mobile: empilha, botao largura total | Desktop: lado a lado (original) */}
      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center lg:gap-0">
        <div>
          <h2 className="text-[22px] font-extrabold text-gray-900">Compliance & Certificacoes</h2>
          <p className="text-[13px] text-gray-500">Controle documentos, certificacoes e obrigacoes regulatorias.</p>
        </div>
        <button onClick={() => setModal(true)}
          className="w-full lg:w-auto px-[22px] py-[11px] rounded-[10px] border-none bg-violet-700 text-white font-bold text-sm cursor-pointer font-[inherit]">
          + Novo Documento
        </button>
      </div>

      {/* KPIs
          Mobile: grid 2 colunas | Desktop: auto-cols flow-col (original) */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-none lg:auto-cols-[minmax(160px,1fr)] lg:grid-flow-col">
        <div className="bg-white rounded-xl px-5 py-[18px] border border-gray-200 border-l-4 border-l-violet-700">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-1.5">Total</p>
          <p className="text-[28px] font-black text-gray-900">{items.length}</p>
        </div>
        {Object.entries(STATUS).map(([key, { cor, label }]) => (
          <div key={key} className="bg-white rounded-xl px-5 py-[18px] border border-gray-200"
            style={{ borderLeft: `4px solid ${cor}` }}>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide mb-1.5">{label}</p>
            <p className="text-[28px] font-black" style={{ color: cor }}>{porStatus[key] || 0}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-bold text-gray-700 mb-1">Nenhum documento ainda</p>
            <p className="text-[13px] text-gray-400">Adicione certificacoes e documentos regulatorios.</p>
          </div>
        ) : items.map((item: any) => {
          const st = STATUS[item.status] || { cor: "#9ca3af", label: item.status };
          const vencida = item.validade && new Date(item.validade) < new Date();
          return (
            <div key={item.id}
              className="bg-white rounded-[14px] border border-gray-200 px-[22px] py-[18px]
                         flex flex-col gap-3
                         lg:flex-row lg:justify-between lg:items-center lg:gap-4">

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-[3px] rounded-full border"
                    style={{ background: `${st.cor}15`, color: st.cor, borderColor: `${st.cor}30` }}>
                    {st.label}
                  </span>
                  <span className="text-[11px] text-gray-400 font-semibold">{item.tipo}</span>
                </div>
                <p className="text-[15px] font-bold text-gray-900 mb-1">{item.nome}</p>
                <p className={`text-xs ${vencida ? "text-red-500" : "text-gray-400"}`}>
                  {item.validade
                    ? `Validade: ${new Date(item.validade).toLocaleDateString("pt-BR")}${vencida ? " VENCIDA" : ""}`
                    : "Sem validade definida"}
                </p>
                {item.obs && <p className="text-xs text-gray-500 mt-1">{item.obs}</p>}
              </div>

              {/* Acoes
                  Mobile: lado a lado em baixo | Desktop: flex-shrink-0 (original) */}
              <div className="flex gap-2 shrink-0">
                <select value={item.status} onChange={e => handleStatus(item.id, e.target.value)}
                  className="flex-1 lg:flex-none px-2.5 py-[7px] border border-gray-200 rounded-lg text-xs font-[inherit] cursor-pointer outline-none">
                  {Object.entries(STATUS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
                </select>
                <button onClick={() => handleRemover(item.id)}
                  className="px-3 py-[7px] border border-red-200 rounded-lg bg-white text-red-600 text-xs font-bold cursor-pointer font-[inherit] whitespace-nowrap">
                  Remover
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal
          Mobile: bottom sheet | Desktop: centralizado (original) */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-[500] flex justify-center items-end lg:items-center p-0 lg:p-4"
          onClick={() => setModal(false)}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white w-full shadow-[0_20px_60px_rgba(0,0,0,0.18)] overflow-y-auto
                       rounded-t-3xl lg:rounded-2xl
                       max-h-[92vh] lg:max-h-none
                       p-6 lg:p-8
                       lg:w-full lg:max-w-[460px]">

            <div className="flex justify-between items-center mb-5">
              <p className="text-[17px] font-extrabold">Novo Documento</p>
              <button onClick={() => setModal(false)} className="bg-none border-none text-xl cursor-pointer text-gray-400">✕</button>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { label: "Tipo",                        key: "tipo",     isSelect: true, options: TIPOS },
                { label: "Nome / Numero do Documento",  key: "nome",     type: "text"  },
                { label: "Validade",                    key: "validade", type: "date"  },
                { label: "Observacao",                  key: "obs",      type: "text"  },
              ].map(({ label, key, type, isSelect, options }: any) => (
                <div key={key}>
                  <label className="text-xs font-bold text-gray-500 block mb-1.5">{label}</label>
                  {isSelect ? (
                    <select value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={inputCls}>
                      {options.map((o: string) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type} value={(form as any)[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className={inputCls} />
                  )}
                </div>
              ))}

              <div className="flex gap-2.5 mt-2">
                <button onClick={() => setModal(false)}
                  className="flex-1 py-[11px] rounded-[10px] border border-gray-200 bg-white font-bold cursor-pointer font-[inherit]">
                  Cancelar
                </button>
                <button onClick={handleCriar}
                  className="flex-1 py-[11px] rounded-[10px] border-none bg-violet-700 text-white font-bold cursor-pointer font-[inherit]">
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}