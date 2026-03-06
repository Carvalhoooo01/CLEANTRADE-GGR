"use client";
import { useApp } from "@/context/AppContext";
import { Btn, KpiCard } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { fmt, fmtCO2 } from "@/data/constants";
import Link from "next/link";

export default function MeusLotesPage() {
  const { lotes, setLotes, market, setMarket, user, showToast } = useApp();

  const estaEsgotado = (l: any) =>
    (l.quantidade || 0) > 0 && (l.vendidos || 0) >= (l.quantidade || 0);

  // Lotes visiveis: excluir totalmente vendidos, arquivados e vendidos
  const lotesVisiveis = lotes.filter((l: any) =>
    !estaEsgotado(l) && l.status !== "arquivado" && l.status !== "vendido"
  );

  const lotesAtivos   = lotesVisiveis.filter((l: any) => l.status === "ativo");
  const lotesOrdenados = [
    ...lotesAtivos,
    ...lotesVisiveis.filter((l: any) => l.status === "pausado"),
    ...lotesVisiveis.filter((l: any) => l.status === "rascunho"),
  ];

  const totalEstoque  = lotesAtivos.reduce((s: number, l: any) => s + Math.max(0, (l.quantidade || 0) - (l.vendidos || 0)), 0);
  const totalReceita  = lotes.reduce((s: number, l: any) => s + ((l.vendidos || 0) * (l.preco || 0)), 0);
  const totalVendidos = lotes.filter(estaEsgotado).length;

  const toggleStatus = async (id: any) => {
    const lote = lotes.find((l: any) => l.id === id);
    if (!lote) return;
    const novoStatus = lote.status === "ativo" ? "pausado" : "ativo";
    setLotes((ls: any[]) => ls.map((l: any) => l.id === id ? { ...l, status: novoStatus } : l));
    if (novoStatus === "pausado") {
      setMarket((prev: any[]) => prev.filter((m: any) => m.id !== id));
    } else {
      const disponivel = (lote.quantidade || 0) - (lote.vendidos || 0);
      if (disponivel > 0) {
        setMarket((prev: any[]) => prev.some(m => m.id === id) ? prev : [...prev, {
          id: lote.id, name: lote.name || lote.nome, type: lote.type || lote.tipo,
          cert: lote.cert || lote.certificadora, available: disponivel,
          price: lote.preco, change: 0, up: true, status: "ACTIVE", vendedorId: user?.id,
        }]);
      }
    }
    showToast(novoStatus === "pausado" ? "Lote pausado." : "Lote reativado!", "info");
    try {
      await fetch("/api/lotes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: novoStatus }) });
    } catch {
      setLotes((ls: any[]) => ls.map((l: any) => l.id === id ? { ...l, status: lote.status } : l));
      showToast("Erro ao atualizar status", "error");
    }
  };

  const removerLote = async (id: any) => {
    if (!window.confirm("Deseja remover este lote?")) return;
    const backup = lotes.find((l: any) => l.id === id);
    setMarket((prev: any[]) => prev.filter((m: any) => m.id !== id));
    setLotes((ls: any[]) => ls.filter((l: any) => l.id !== id));
    try {
      const res  = await fetch(`/api/lotes?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        if (backup) setLotes((ls: any[]) => [...ls, backup]);
        return showToast(data.error || "Erro ao remover lote", "error");
      }
      showToast(data.arquivado ? "Lote arquivado (possui vendas vinculadas)." : "Lote removido.", data.arquivado ? "info" : "success");
    } catch {
      if (backup) setLotes((ls: any[]) => [...ls, backup]);
      showToast("Erro ao remover lote", "error");
    }
  };

  const publicarRascunho = async (id: any) => {
    const lote = lotes.find((l: any) => l.id === id);
    if (!lote) return;
    setLotes((ls: any[]) => ls.map((l: any) => l.id === id ? { ...l, status: "ativo" } : l));
    const disponivel = (lote.quantidade || 0) - (lote.vendidos || 0);
    setMarket((prev: any[]) => [...prev, {
      id, name: lote.name || lote.nome, type: lote.type || lote.tipo,
      cert: lote.cert || lote.certificadora, available: disponivel,
      price: lote.preco, change: 0, up: true, status: "ACTIVE", vendedorId: user?.id,
    }]);
    showToast("Lote publicado no marketplace!", "success");
    try {
      await fetch("/api/lotes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "ativo" }) });
    } catch {
      setLotes((ls: any[]) => ls.map((l: any) => l.id === id ? { ...l, status: "rascunho" } : l));
      setMarket((prev: any[]) => prev.filter((m: any) => m.id !== id));
      showToast("Erro ao publicar lote", "error");
    }
  };

  const LoteCard = ({ l }: { l: any }) => {
    const isRascunho = l.status === "rascunho";
    const isPausado  = l.status === "pausado";
    const isAtivo    = l.status === "ativo";
    const disponivel = Math.max(0, (l.quantidade || 0) - (l.vendidos || 0));
    const pctVendido = (l.quantidade || 0) > 0 ? ((l.vendidos || 0) / (l.quantidade || 0)) * 100 : 0;
    const cor = isRascunho ? "#8b5cf6" : isPausado ? "#f59e0b" : "#16a34a";

    return (
      <div className="rounded-2xl p-6 relative overflow-hidden transition-shadow hover:shadow-md"
        style={{
          background: isRascunho ? "#faf5ff" : "#fff",
          border:     `1px solid ${isRascunho ? "#e9d5ff" : isAtivo ? "#e7f5e7" : "#fffbeb"}`,
        }}>

        <div className="absolute top-0 right-0 px-4 py-2 rounded-bl-xl text-xs font-bold"
          style={{ background: `${cor}15`, color: cor }}>
          {isRascunho ? "RASCUNHO" : isAtivo ? "DISPONIVEL" : "PAUSADO"}
        </div>

        <div className="mb-4 pr-24">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{l.type || l.tipo}</p>
          <h3 className="text-lg font-extrabold mt-1 mb-1 text-gray-900">{l.name || l.nome}</h3>
          <p className="text-xs text-slate-500">Certificacao: <b>{l.cert || l.certificadora}</b></p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: "DISPONIVEL", value: fmtCO2(disponivel),                   color: "#16a34a" },
            { label: "VENDIDOS",   value: fmtCO2(l.vendidos || 0),             color: "#374151" },
            { label: "RECEITA",    value: fmt((l.vendidos || 0) * (l.preco || 0)), color: "#16a34a" },
          ].map(m => (
            <div key={m.label} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-bold">{m.label}</p>
              <p className="text-[12px] font-extrabold" style={{ color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-slate-500">Preco unitario</span>
          <span className="text-sm font-extrabold">R$ {(l.preco || 0).toFixed(2)}/tCO2</span>
        </div>

        <div className="mb-5">
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-slate-500 font-semibold">Liquidez</span>
            <span className="text-xs font-bold">{pctVendido.toFixed(0)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctVendido}%`, background: cor }} />
          </div>
        </div>

        <div className="flex gap-2.5">
          {isRascunho ? (
            <Btn style={{ flex: 1, fontSize: 12, height: 40, background: "#8b5cf6" }} onClick={() => publicarRascunho(l.id)}>
              Publicar no Marketplace
            </Btn>
          ) : (
            <Btn variant="outline" style={{ flex: 1, fontSize: 12, height: 40 }} onClick={() => toggleStatus(l.id)}>
              {isAtivo ? "Pausar Oferta" : "Reativar Oferta"}
            </Btn>
          )}
          <Btn variant="danger" style={{ width: 45, height: 40, display: "flex", justifyContent: "center" }} onClick={() => removerLote(l.id)}>
            {Icons.trash}
          </Btn>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-10">

      <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h2 className="text-xl font-bold text-sky-900" style={{ fontFamily: "'Playfair Display', serif" }}>Gestao de Lotes</h2>
          <p className="text-sm text-slate-500">Controle seus ativos ambientais e publicacoes no mercado.</p>
        </div>
        <Link href="/nova-oferta" className="w-full lg:w-auto">
          <Btn style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", padding: "12px 24px", borderRadius: 10, boxShadow: "0 4px 12px rgba(22,163,74,0.2)", width: "100%" }}>
            {Icons.plus} Publicar Novo Lote
          </Btn>
        </Link>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <KpiCard label="Lotes Ativos"      value={lotesAtivos.length}   color="#0ea5e9" />
        <KpiCard label="Volume em Estoque" value={fmtCO2(totalEstoque)} color="#16a34a" />
        <KpiCard label="Receita Total"     value={fmt(totalReceita)}    color="#f59e0b" />
        <KpiCard label="Lotes Concluidos"  value={totalVendidos}        color="#6b7280" />
      </div>

      {lotesOrdenados.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {lotesOrdenados.map((l: any) => <LoteCard key={l.id} l={l} />)}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
          <p className="text-4xl mb-3">🌿</p>
          <p className="text-slate-400 text-base">Nenhum lote ativo no momento.</p>
          <Link href="/nova-oferta">
            <button className="mt-4 bg-transparent border-none text-green-600 font-bold cursor-pointer text-sm">
              Publicar meu primeiro lote
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}