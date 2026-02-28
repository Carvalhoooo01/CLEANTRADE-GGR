"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { fmt, fmtCO2, STATUS_COLORS } from "@/data/constants";
import Link from "next/link";

function Modal({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.18)" }}>
        {children}
      </div>
    </div>
  );
}

const TIPOS = ["Todos", "Florestal", "Agrícola", "Energia", "Industrial"];

export default function MarketplacePage() {
  const { user, market, setMarket, balance, setBalance, setTx, setVendas, setCerts, showToast } = useApp();
  const [buying,      setBuying]      = useState(null);
  const [qty,         setQty]         = useState("1");
  const [loading,     setLoading]     = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [success,     setSuccess]     = useState(null);
  const [error,       setError]       = useState(false);
  const [busca,       setBusca]       = useState("");
  const [tipoFiltro,  setTipoFiltro]  = useState("Todos");
  const [ordenar,     setOrdenar]     = useState("preco_asc");

  const fecharTudo = () => { setBuying(null); setQty("1"); setConfirming(false); setSuccess(null); setError(false); };

  const handleBuy = async () => {
    const q = parseFloat(qty);
    if (!q || q <= 0)         return showToast("Quantidade inválida", "error");
    if (q > buying.available) return showToast("Quantidade maior que o disponível", "error");
    const total = q * buying.price;
    if (total > balance)      return showToast("Saldo insuficiente", "error");

    setLoading(true);
    try {
      // REGRA: Seleciona o endpoint baseado se o item é Cooperativa ou Individual
      const endpoint = buying.isCoop ? "/api/cooperativa/buy" : "/api/marketplace/buy";

      const res  = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compradorId:   user.id,
          vendedorId:    buying.vendedorId,
          loteId:        buying.id,
          quantidade:    q,
          precoUnitario: buying.price,
          total,
          tipo:          buying.type || buying.tipo,
          cert:          buying.cert || buying.certificadora,
          isCoop:        buying.isCoop
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(true); setConfirming(false); return; }

      // Atualiza contexto com dados reais do banco
      setBalance(data.novoSaldo);
      if (data.transacao) setTx(t => [data.transacao, ...t]);
      if (data.venda)     setVendas(vs => [data.venda, ...vs]);
      if (data.certificados?.length) setCerts(cs => [...data.certificados, ...cs]);

      // Atualiza market localmente
      setMarket(m =>
        m.map(item => item.id === buying.id ? { ...item, available: item.available - q } : item)
         .filter(item => item.available > 0)
      );

      setSuccess({ qty: q, total });
      setConfirming(false);
    } catch {
      setError(true);
      setConfirming(false);
    } finally { setLoading(false); }
  };

  const marketFiltrado = useMemo(() => {
    let lista = [...market];
    if (busca) lista = lista.filter(i => (i.name || "").toLowerCase().includes(busca.toLowerCase()) || (i.cert || "").toLowerCase().includes(busca.toLowerCase()));
    if (tipoFiltro !== "Todos") lista = lista.filter(i => (i.type || "").toLowerCase().includes(tipoFiltro.toLowerCase()));
    if (ordenar === "preco_asc")  lista.sort((a, b) => a.price - b.price);
    if (ordenar === "preco_desc") lista.sort((a, b) => b.price - a.price);
    if (ordenar === "vol_desc")   lista.sort((a, b) => (b.available || 0) - (a.available || 0));
    return lista;
  }, [market, busca, tipoFiltro, ordenar]);

  const totalDisponivel = market.reduce((s, i) => s + (i.available || 0), 0);
  const precoMedio = market.length ? market.reduce((s, i) => s + i.price, 0) / market.length : 0;
  const menorPreco = market.length ? Math.min(...market.map(i => i.price)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40, fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── BANNER SUPERIOR ── */}
      <div style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 60%, #047857 100%)", borderRadius: 16, padding: "28px 32px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Mercado de Carbono Verificado</p>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.5px" }}>Marketplace de Créditos</h1>
          <p style={{ fontSize: 14, opacity: 0.8 }}>Adquira créditos certificados diretamente de produtores verificados</p>
        </div>
        <div style={{ display: "flex", gap: 32 }}>
          {[
            { label: "Oferta disponível", value: fmtCO2(totalDisponivel) },
            { label: "Preço médio",       value: `R$ ${precoMedio.toFixed(2)}/t` },
            { label: "Menor preço",       value: `R$ ${menorPreco.toFixed(2)}/t` },
            { label: "Lotes ativos",      value: market.length },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p style={{ fontSize: 20, fontWeight: 800 }}>{value}</p>
              <p style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FILTROS ── */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        {/* Busca */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#9ca3af" }}>🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou certificadora..."
            style={{ width: "100%", paddingLeft: 38, paddingRight: 14, paddingTop: 10, paddingBottom: 10, border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, background: "#fff", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>

        {/* Tipo */}
        <div style={{ display: "flex", gap: 6 }}>
          {TIPOS.map(t => (
            <button key={t} onClick={() => setTipoFiltro(t)}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${tipoFiltro === t ? "#16a34a" : "#e5e7eb"}`, background: tipoFiltro === t ? "#f0fdf4" : "#fff", color: tipoFiltro === t ? "#16a34a" : "#6b7280", fontWeight: tipoFiltro === t ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Ordenar */}
        <select value={ordenar} onChange={e => setOrdenar(e.target.value)}
          style={{ padding: "9px 12px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 13, background: "#fff", color: "#374151", fontFamily: "inherit", cursor: "pointer" }}>
          <option value="preco_asc">Menor preço</option>
          <option value="preco_desc">Maior preço</option>
          <option value="vol_desc">Maior volume</option>
        </select>
      </div>

      {/* ── RESULTADO ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          {marketFiltrado.length === 0 ? "Nenhum resultado" : `${marketFiltrado.length} lote${marketFiltrado.length > 1 ? "s" : ""} encontrado${marketFiltrado.length > 1 ? "s" : ""}`}
        </p>
      </div>

      {/* ── GRID DE CARDS ── */}
      {marketFiltrado.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 16, border: "2px dashed #e5e7eb" }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🌿</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Nenhum crédito encontrado</p>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Tente ajustar os filtros ou aguarde novos lotes.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 16 }}>
          {marketFiltrado.map(item => (
            <div key={item.id}
              style={{ 
                background: "#fff", 
                borderRadius: 14, 
                border: item.isCoop ? "2px solid #16a34a" : "1px solid #e5e7eb", // REGRA VISUAL
                overflow: "hidden", 
                transition: "all 0.2s", 
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                position: "relative"
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; e.currentTarget.style.borderColor = item.isCoop ? "#16a34a" : "#bbf7d0"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = item.isCoop ? "#16a34a" : "#e5e7eb"; }}>

              {item.isCoop && (
                 <div style={{ position: "absolute", top: 10, right: 10, background: "#16a34a", color: "#fff", fontSize: 9, fontWeight: 900, padding: "2px 8px", borderRadius: 10, zIndex: 1 }}>
                   COLETIVO
                 </div>
              )}

              {/* Topo colorido */}
              <div style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", padding: "14px 18px", borderBottom: "1px solid #d1fae5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#15803d", textTransform: "uppercase", letterSpacing: "0.06em" }}>{item.type || "Florestal"}</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginTop: 2 }}>{item.name}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#fff", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                  ATIVO
                </span>
              </div>

              {/* Corpo */}
              <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  ["Certificadora", item.cert],
                  ["Origem",         <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />Estoque Verificado</span>],
                  ["Local",          "Diversas"],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{v}</span>
                  </div>
                ))}

                {/* Divisor */}
                <div style={{ height: 1, background: "#f3f4f6", margin: "4px 0" }} />

                {/* Destaque: disponível e preço */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Disponível</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>{fmtCO2(item.available)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 2 }}>Preço</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>R$ {(item.price || 0).toFixed(2)}<span style={{ fontSize: 11, fontWeight: 500, color: "#9ca3af" }}>/tCO₂</span></p>
                  </div>
                </div>

                <button onClick={() => { setBuying(item); setQty("1"); setConfirming(false); setSuccess(null); }}
                  style={{ marginTop: 8, width: "100%", padding: "11px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.02em" }}>
                  {item.isCoop ? "Comprar do Pool" : "Comprar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL DE COMPRA ── */}
      {buying && !success && (
        <Modal onClose={fecharTudo}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>Comprar {buying.name}</p>
            <button onClick={fecharTudo} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
          </div>

          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Preço unitário</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>{fmt(buying.price)}/tCO₂</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Disponível</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{fmtCO2(buying.available)}</span>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Quantidade (tCO₂)</label>
            <input type="number" min="0.1" step="0.1" max={buying.available} value={qty} onChange={e => setQty(e.target.value)} placeholder="ex: 1"
              style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>

          <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, border: "1px solid #e5e7eb", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Subtotal</span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{fmt((parseFloat(qty) || 0) * buying.price)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "#6b7280" }}>Saldo após compra</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: balance - (parseFloat(qty) || 0) * buying.price < 0 ? "#dc2626" : "#16a34a" }}>
                {fmt(balance - (parseFloat(qty) || 0) * buying.price)}
              </span>
            </div>
          </div>

          {!confirming ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={fecharTudo} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>Cancelar</button>
              <button onClick={() => setConfirming(true)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" }}>Comprar</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>⚠️ Deseja mesmo comprar?</p>
                <p style={{ fontSize: 13, color: "#78350f" }}><strong>{fmtCO2(parseFloat(qty) || 0)}</strong> por <strong>{fmt((parseFloat(qty) || 0) * buying.price)}</strong></p>
                <p style={{ fontSize: 11, color: "#92400e", marginTop: 4, opacity: 0.8 }}>Esta ação não pode ser desfeita.</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>Voltar</button>
                <button onClick={handleBuy} disabled={loading} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
                  {loading ? "Processando..." : "✅ Confirmar"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* ── MODAL DE SUCESSO ── */}
      {success && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", textAlign: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{ background: "#f0fdf4", borderRadius: "50%", padding: 20 }}>
                <svg width="64" height="64" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Compra Realizada!</p>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>
              Seus créditos foram adquiridos com sucesso e já estão disponíveis no seu inventário.<br />
              <strong style={{ color: "#16a34a" }}>{fmtCO2(success.qty)}</strong> · <strong>{fmt(success.total)}</strong>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/certificados" onClick={fecharTudo} style={{ display: "block", padding: "13px", borderRadius: 12, background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                Ver Meus Créditos
              </Link>
              <button onClick={fecharTudo} style={{ padding: "13px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE ERRO ── */}
      {error && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.18)", textAlign: "center", fontFamily: "Inter, system-ui, sans-serif" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div style={{ background: "#fef2f2", borderRadius: "50%", padding: 20 }}>
                <svg width="64" height="64" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8 }}>Falha na Compra</p>
            <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7, marginBottom: 28 }}>
              Ocorreu um erro ao processar sua transação. Verifique se há volume disponível e tente novamente.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={() => setError(false)} style={{ padding: "13px", borderRadius: 12, border: "none", background: "#16a34a", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "inherit" }}>
                Tentar Novamente
              </button>
              <Link href="/" style={{ display: "block", padding: "13px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                Voltar ao Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}