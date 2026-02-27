"use client";
import { useApp } from "@/context/AppContext";
import { Btn, Badge, KpiCard } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { fmt, fmtCO2 } from "@/data/constants";
import Link from "next/link";
import { useState } from "react";

export default function MeusLotesPage() {
  const { lotes, setLotes, showToast } = useApp();
  // Marca esgotados mas mantém tudo na mesma lista, esgotados no final
  const lotesAtivos    = lotes.filter(l => (l.quantidade || 0) > 0);
  const lotesEsgotados = lotes.filter(l => (l.quantidade || 0) <= 0);
  const lotesOrdenados = [...lotesAtivos, ...lotesEsgotados];

  const toggleStatus = async (id) => {
    const lote = lotes.find(l => l.id === id);
    if (!lote) return;
    const novoStatus = lote.status === "ativo" ? "pausado" : "ativo";
    setLotes(ls => ls.map(l => l.id === id ? { ...l, status: novoStatus } : l));
    showToast("Status atualizado!", "info");
    try {
      const res = await fetch("/api/lotes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: novoStatus }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLotes(ls => ls.map(l => l.id === id ? { ...l, status: lote.status } : l));
      showToast("Erro ao atualizar status", "error");
    }
  };

// ... (mantenha os imports e o início do componente iguais)

  const removerLote = async (id) => {
    if (!window.confirm("Deseja remover este lote do inventário? Isso não pode ser desfeito.")) return;
    
    const backup = lotes.find(l => l.id === id);
    
    // Atualização otimista na UI
    setLotes(ls => ls.filter(l => l.id !== id));

    try {
      const res = await fetch(`/api/lotes?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        // Se a API retornar erro (como o P2003 de vendas vinculadas), lança exceção
        throw new Error(data.error || "Erro ao remover lote");
      }

      showToast("Lote removido com sucesso!", "success");
    } catch (err) {
      // Reverte a interface caso a API falhe
      if (backup) setLotes(ls => [...ls, backup]);
      showToast(err.message, "error");
    }
  };

// ... (mantenha o restante do componente LoteCard e o return iguais)

  const totalEstoque = lotesAtivos.reduce((s, l) => s + (l.quantidade || 0), 0);
  const totalReceita = lotes.reduce((s, l) => s + ((l.vendidos || 0) * (l.preco || 0)), 0);

  const LoteCard = ({ l, esgotado = false }) => {
    const isAtivo     = l.status === "ativo" && !esgotado;
    const corPrimaria = esgotado ? "#6b7280" : isAtivo ? "#16a34a" : "#f59e0b";
    const totalUnits  = (l.quantidade || 0) + (l.vendidos || 0);
    const pctVendido  = totalUnits > 0 ? ((l.vendidos || 0) / totalUnits) * 100 : 100;

    return (
      <div style={{
        background: esgotado ? "#f9fafb" : "#fff",
        borderRadius: 16,
        border: `1px solid ${esgotado ? "#e5e7eb" : isAtivo ? "#e7f5e7" : "#fffbeb"}`,
        padding: 24,
        boxShadow: esgotado ? "none" : `0 4px 15px ${isAtivo ? "rgba(22,163,74,0.04)" : "rgba(245,158,11,0.04)"}`,
        position: "relative", overflow: "hidden",
        opacity: esgotado ? 0.75 : 1,
      }}>
        {/* Badge status */}
        <div style={{ position: "absolute", top: 0, right: 0, padding: "8px 16px", background: esgotado ? "#f3f4f6" : isAtivo ? "#f0fdf4" : "#fffbeb", color: corPrimaria, fontSize: 10, fontWeight: 700, borderRadius: "0 0 0 12px" }}>
          {esgotado ? "ESGOTADO" : isAtivo ? "DISPONÍVEL" : "PAUSADO"}
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{l.type}</p>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: esgotado ? "#6b7280" : "#111827", margin: "4px 0" }}>{l.name}</h3>
          <p style={{ fontSize: 12, color: "#64748b" }}>Certificação: <b>{l.cert}</b></p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div style={{ padding: 12, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>VENDIDOS</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{fmtCO2(l.vendidos || 0)}</p>
          </div>
          <div style={{ padding: 12, background: "#f8fafc", borderRadius: 12, border: "1px solid #f1f5f9" }}>
            <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>RECEITA</p>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>{fmt((l.vendidos || 0) * (l.preco || 0))}</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div style={{ marginBottom: esgotado ? 0 : 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Liquidez do Lote</span>
            <span style={{ fontSize: 11, color: "#111827", fontWeight: 700 }}>{pctVendido.toFixed(0)}%</span>
          </div>
          <div style={{ width: "100%", height: 6, background: "#f1f5f9", borderRadius: 10 }}>
            <div style={{ width: `${pctVendido}%`, height: "100%", background: corPrimaria, borderRadius: 10, transition: "width 1s" }} />
          </div>
        </div>

        {/* Ações — só para não esgotados */}
        {!esgotado && (
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <Btn variant="outline" style={{ flex: 1, fontSize: 12, height: 40 }} onClick={() => toggleStatus(l.id)}>
              {isAtivo ? "Pausar Oferta" : "Reativar Oferta"}
            </Btn>
            <Btn variant="danger" style={{ width: 45, height: 40, display: "flex", justifyContent: "center" }} onClick={() => removerLote(l.id)}>
              {Icons.trash}
            </Btn>
          </div>
        )}

        {/* Esgotado — só botão remover */}
        {esgotado && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button onClick={() => removerLote(l.id)}
              style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}>
              {Icons.trash} Remover
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>

      {/* CABEÇALHO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0c4a6e", fontFamily: "'Playfair Display', serif" }}>
            Gestão de Lotes
          </h2>
          <p style={{ fontSize: 13, color: "#64748b" }}>Controle seus ativos ambientais e publicações no mercado.</p>
        </div>
        <Link href="/nova-oferta">
          <Btn style={{ background: "linear-gradient(135deg,#16a34a,#22c55e)", color: "#fff", padding: "12px 24px", borderRadius: 10, boxShadow: "0 4px 12px rgba(22,163,74,0.2)" }}>
            {Icons.plus} Publicar Novo Lote
          </Btn>
        </Link>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <KpiCard label="Lotes Ativos"      value={lotesAtivos.length}         color="#0ea5e9" />
        <KpiCard label="Volume em Estoque" value={fmtCO2(totalEstoque)}       color="#16a34a" />
        <KpiCard label="Receita Total"     value={fmt(totalReceita)}           color="#f59e0b" />
        <KpiCard label="Lotes Esgotados"   value={lotesEsgotados.length}      color="#6b7280" />
      </div>

      {/* LISTA UNIFICADA */}
      {lotesOrdenados.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {lotesOrdenados.map(l => (
            <LoteCard key={l.id} l={l} esgotado={(l.quantidade || 0) <= 0} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: 80, background: "#fff", borderRadius: 20, border: "2px dashed #e2e8f0" }}>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>Nenhum lote publicado no momento.</p>
          <Link href="/nova-oferta">
            <button style={{ marginTop: 16, background: "none", border: "none", color: "#16a34a", fontWeight: 700, cursor: "pointer" }}>
              Clique aqui para publicar seu primeiro lote
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}