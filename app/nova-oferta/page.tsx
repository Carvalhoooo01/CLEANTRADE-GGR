"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Btn, Badge } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { fmt, fmtCO2 } from "@/data/constants";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function NovaOfertaPage() {
  const { user, publicarLote, showToast, cotacao } = useApp();
  const router = useRouter();

  const [modalidade,  setModalidade]  = useState("A");
  const [serialVerra, setSerialVerra] = useState("");
  const [numeroCAR,   setNumeroCAR]   = useState("");
  const [tipo,        setTipo]        = useState("Florestal");
  const [cert,        setCert]        = useState("Verra");
  const [nome,        setNome]        = useState("");
  const [qty,         setQty]         = useState("10");
  const [pub,         setPub]         = useState(true);
  const [desc,        setDesc]        = useState("");
  const [loading,     setLoading]     = useState(false);

  const receita   = (parseFloat(qty) || 0) * cotacao;
  const chartData = [
    { l: "25%",  v: receita * 0.25 },
    { l: "50%",  v: receita * 0.5  },
    { l: "100%", v: receita        },
  ];

  const handleNumericInput = (val: string, setter: (v: string) => void) => {
    const cleaned = val.replace(",", ".");
    if (/^\d*\.?\d*$/.test(cleaned) || cleaned === "") setter(cleaned);
  };

  const handleSubmit = async () => {
    if (!nome || !qty) { showToast("Preencha os campos obrigatorios", "error"); return; }
    if (modalidade === "A" && !serialVerra) return showToast("Informe o Serial Verra", "error");
    if (modalidade === "B" && !numeroCAR)   return showToast("Informe o Numero do CAR", "error");
    setLoading(true);
    const novoLote = {
      nome, tipo, certificadora: modalidade === "A" ? cert : "CleanTrade Coop",
      descricao: desc || `Projeto ${modalidade === "A" ? "Verificado" : "via CAR/Originacao"}`,
      quantidade: parseFloat(qty), preco: cotacao, userId: user.id,
      status: pub ? "ativo" : "rascunho", tipoCert: modalidade === "A" ? "EXISTENTE" : "ORIGINACAO",
      serialVerra: modalidade === "A" ? serialVerra : null,
      urlMapa: modalidade === "B" ? numeroCAR : null,
      vendidos: 0,
    };
    try {
      const salvo = await publicarLote(novoLote);
      if (salvo) {
        showToast(pub ? "Lote publicado!" : "Rascunho salvo!", "success");
        router.push("/meus-lotes");
      }
    } catch {
      showToast("Erro ao conectar com o servidor", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 items-start grid-cols-1 lg:[grid-template-columns:1.1fr_0.9fr]">


      {/* Formulario */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <p className="text-base font-bold text-gray-900 mb-1">Nova Oferta de Ativo</p>
        <p className="text-xs text-gray-400 mb-5">Escolha como deseja certificar seu estoque de carbono</p>

        <div className="flex flex-col gap-3.5">

          {/* Modalidade A/B */}
          <div className="grid grid-cols-2 gap-2.5 mb-1">
            {[
              { id: "A", icon: "📜", title: "Credito Existente",   sub: "Ja possuo Serial Verra",      color: "#16a34a" },
              { id: "B", icon: "🛡️", title: "Originacao via CAR", sub: "Validar area documentalmente", color: "#0ea5e9" },
            ].map(opt => (
              <div key={opt.id} onClick={() => setModalidade(opt.id)}
                className="p-3 rounded-xl text-center cursor-pointer transition-all"
                style={{ border: `2px solid ${modalidade === opt.id ? opt.color : "#e5e7eb"}`, background: modalidade === opt.id ? `${opt.color}08` : "#fff" }}>
                <p className="text-lg">{opt.icon}</p>
                <p className="font-bold text-sm">{opt.title}</p>
                <p className="text-[10px] opacity-70">{opt.sub}</p>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Nome do Projeto / Fazenda *</label>
            <input value={nome} onChange={e => setNome(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none text-gray-900 font-[inherit] box-border"
              placeholder="Ex: Fazenda Santa Maria" />
          </div>

          {modalidade === "A" ? (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Numero de Serie Verra (VCU) *</label>
              <input value={serialVerra} onChange={e => setSerialVerra(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none font-[inherit] box-border"
                placeholder="Ex: 1234-56789-VCU-BR-..." />
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1.5">Numero do Registro CAR *</label>
              <input value={numeroCAR} onChange={e => setNumeroCAR(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none font-[inherit] box-border"
                placeholder="Ex: BR-SP-3550308-..." />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Quantidade Estimada (tCO2) *</label>
            <input type="text" inputMode="decimal" value={qty} onChange={e => handleNumericInput(e.target.value, setQty)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none font-[inherit] box-border" />
          </div>

          {/* Cotacao */}
          <div className="bg-green-50 rounded-xl px-3.5 py-3 border border-green-200 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-green-700 uppercase mb-0.5">Cotacao de Mercado</p>
              <p className="text-xs text-gray-500">Preco garantido no momento da unificacao</p>
            </div>
            <p className="text-xl font-black text-green-700">{fmt(cotacao)}<span className="text-xs font-medium text-gray-500">/t</span></p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Tipo de Credito</label>
            <div className="flex gap-1.5 flex-wrap">
              {["Florestal", "Energia", "Biodiversidade", "Rec. Hidricos"].map(t => (
                <button key={t} onClick={() => setTipo(t)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all font-[inherit]"
                  style={{ border: tipo === t ? "1px solid #0ea5e9" : "1px solid #e5e7eb", background: tipo === t ? "#0ea5e915" : "white", color: tipo === t ? "#0ea5e9" : "#6b7280" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border transition-all"
            style={{ background: pub ? "#f0fdf4" : "#f8fafc", border: pub ? "1px solid #bbf7d0" : "1px solid #e2e8f0" }}>
            <input type="checkbox" checked={pub} onChange={e => setPub(e.target.checked)} className="w-4 h-4 accent-green-600" />
            <div>
              <p className="text-sm font-semibold" style={{ color: pub ? "#0c4a6e" : "#475569" }}>
                {pub ? "Publicar no Marketplace" : "Salvar apenas como rascunho"}
              </p>
              <p className="text-xs text-gray-500">Visivel para todos ou apenas no seu inventario</p>
            </div>
          </label>

          <Btn
            style={{ justifyContent: "center", width: "100%", height: 45, fontWeight: 700, borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", background: pub ? "linear-gradient(135deg,#16a34a,#22c55e)" : "#64748b" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processando..." : (pub ? "Criar e Publicar" : "Salvar Rascunho")}
          </Btn>
        </div>
      </div>

      {/* Preview + estimativa */}
      <div className="flex flex-col gap-3">
        <div className="bg-white rounded-2xl p-[18px] shadow-sm border border-gray-200">
          <p className="text-sm font-bold text-gray-900 mb-3.5">Preview do Card</p>
          <div className="border border-slate-100 rounded-xl p-3.5 bg-slate-50">
            <div className="flex justify-between mb-2.5">
              <div>
                <p className="text-sm font-extrabold">{nome || "Nome do Projeto"}</p>
                <p className="text-xs text-slate-500">{tipo} - {modalidade === "A" ? cert : "Coop"}</p>
              </div>
              <Badge label={modalidade === "A" ? "VERIFIED" : "CAR-ORIGIN"} color={modalidade === "A" ? "#16a34a" : "#0ea5e9"} />
            </div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Volume:</span>
              <span className="font-semibold">{fmtCO2(parseFloat(qty) || 0)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Validacao:</span>
              <span className="font-semibold">{modalidade === "A" ? "Inviavel" : "Documental"}</span>
            </div>
          </div>
        </div>

        {receita > 0 && (
          <div className="rounded-2xl p-[18px] border border-green-200" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
            <p className="text-sm font-semibold text-green-700 mb-3">Receita Estimada</p>
            {chartData.map(({ l, v }) => (
              <div key={l} className="flex justify-between px-2.5 py-1.5 mb-1 rounded-lg" style={{ background: "rgba(255,255,255,0.6)" }}>
                <span className="text-xs text-gray-500">Se vender {l}</span>
                <span className="text-sm font-bold text-green-700">{fmt(v)}</span>
              </div>
            ))}
            <div className="w-full h-16 mt-2.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barSize={22}>
                  <Bar dataKey="v" fill="#16a34a" radius={[4, 4, 0, 0]} />
                  <XAxis dataKey="l" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}