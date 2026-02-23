"use client";
import { useApp } from "@/context/AppContext";
import { Btn, Badge, KpiCard } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { fmt, fmtCO2 } from "@/data/constants";
import Link from "next/link";

export default function MeusLotesPage() {
  const { lotes, setLotes, showToast } = useApp();

  // --- Funções de Gestão ---
  const toggleStatus = (id) => {
    setLotes((ls) => ls.map((l) => 
      l.id === id ? { ...l, status: l.status === "ativo" ? "pausado" : "ativo" } : l
    ));
    showToast("Status atualizado com sucesso!", "info");
  };

  const removerLote = (id) => {
    if (window.confirm("Deseja remover este lote do inventário?")) {
      setLotes((ls) => ls.filter((l) => l.id !== id));
      showToast("Lote removido.", "error");
    }
  };

  // KPIs baseados no seu primeiro layout
  const totalEstoque = lotes.reduce((s, l) => s + (l.quantidade || 0), 0);
  const totalReceita = lotes.reduce((s, l) => s + (l.receita || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      
      {/* ── CABEÇALHO DE AÇÕES ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", color: "#0c4a6e", fontFamily: "'Playfair Display', serif" }}>
            Gestão de Lotes
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b" }}>Controle seus ativos ambientais e publicações no mercado.</p>
        </div>
        <Link href="/nova-oferta">
          <Btn style={{ 
            background: "linear-gradient(135deg,#16a34a,#22c55e)", 
            color: "#fff", padding: "12px 24px", borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(22,163,74,0.2)"
          }}>
            {Icons.plus} Publicar Novo Lote
          </Btn>
        </Link>
      </div>

      {/* ── KPIs (Estilo original) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <KpiCard label="Lotes Cadastrados" value={lotes.length} color="#0ea5e9" />
        <KpiCard label="Volume em Estoque" value={fmtCO2(totalEstoque)} color="#16a34a" />
        <KpiCard label="Receita Estimada" value={fmt(totalReceita)} color="#f59e0b" />
      </div>

      {/* ── GRID DE LOTES (Visual do primeiro Layout) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {lotes.map((l) => {
          const isAtivo = l.status === "ativo";
          const corPrimaria = isAtivo ? "#16a34a" : "#f59e0b";
          const pctVendido = (l.vendidos / (l.quantidade + l.vendidos || 1)) * 100;

          return (
            <div key={l.id} style={{
              background: "#fff",
              borderRadius: "16px",
              border: `1px solid ${isAtivo ? "#e7f5e7" : "#fffbeb"}`,
              padding: "24px",
              boxShadow: `0 4px 15px ${isAtivo ? "rgba(22,163,74,0.04)" : "rgba(245,158,11,0.04)"}`,
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Badge de Status sutil */}
              <div style={{ position: "absolute", top: 0, right: 0, padding: "8px 16px", background: isAtivo ? "#f0fdf4" : "#fffbeb", color: corPrimaria, fontSize: "10px", fontWeight: "700", borderRadius: "0 0 0 12px" }}>
                {isAtivo ? "DISPONÍVEL" : "PAUSADO"}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>{l.type}</p>
                <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#111827", margin: "4px 0" }}>{l.name}</h3>
                <p style={{ fontSize: "12px", color: "#64748b" }}>Certificação: <b>{l.cert}</b></p>
              </div>

              {/* Informações de Mercado */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700" }}>ESTOQUE ATUAL</p>
                  <p style={{ fontSize: "15px", fontWeight: "800", color: "#1e293b" }}>{fmtCO2(l.quantidade)}</p>
                </div>
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                  <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: "700" }}>VALOR UNITÁRIO</p>
                  <p style={{ fontSize: "15px", fontWeight: "800", color: "#16a34a" }}>{fmt(l.preco)}</p>
                </div>
              </div>

              {/* Barra de Progresso (Visual Clean) */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>Liquidez do Lote</span>
                  <span style={{ fontSize: "11px", color: "#111827", fontWeight: "700" }}>{pctVendido.toFixed(0)}%</span>
                </div>
                <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "10px" }}>
                  <div style={{ width: `${pctVendido}%`, height: "100%", background: corPrimaria, borderRadius: "10px", transition: "width 1s" }} />
                </div>
              </div>

              {/* Ações (Estilo Sidebar original) */}
              <div style={{ display: "flex", gap: "10px" }}>
                <Btn 
                  variant="outline" 
                  style={{ flex: 1, fontSize: "12px", height: "40px" }} 
                  onClick={() => toggleStatus(l.id)}
                >
                  {isAtivo ? "Pausar Oferta" : "Reativar Oferta"}
                </Btn>
                <Btn 
                  variant="danger" 
                  style={{ width: "45px", height: "40px", display: "flex", justifyContent: "center" }} 
                  onClick={() => removerLote(l.id)}
                >
                  {Icons.trash}
                </Btn>
              </div>
            </div>
          );
        })}
      </div>

      {lotes.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px", background: "#fff", borderRadius: "20px", border: "2px dashed #e2e8f0" }}>
          <p style={{ color: "#94a3b8", fontSize: "16px" }}>Nenhum lote publicado no momento.</p>
          <Link href="/nova-oferta">
            <button style={{ marginTop: "16px", background: "none", border: "none", color: "#16a34a", fontWeight: "700", cursor: "pointer" }}>
              Clique aqui para publicar seu primeiro lote
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}