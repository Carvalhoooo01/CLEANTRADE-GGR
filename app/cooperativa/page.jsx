"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Btn } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { fmt, fmtCO2, STATUS_COLORS } from "@/data/constants";

// --- COMPONENTE DE INPUT DE VALOR (DESIGN ORIGINAL + LÓGICA DE DADOS REAIS) ---
function Input({ label, value, onChange, placeholder, type = "text" }) {
  // Tratamento para aceitar vírgula e ponto corretamente (Lógica de Dados Reais)
  const handleInputChange = (val) => {
    let cleaned = val.replace(",", ".");
    if (/^\d*\.?\d*$/.test(cleaned) || cleaned === "") {
      onChange(cleaned);
    }
  };

  return (
    <div>
      <label style={{ fontSize: "12px", fontWeight: "600", color: "#374151", display: "block", marginBottom: "5px" }}>{label}</label>
      <input 
        type={type} // Usamos "text" para type-safety de decimais, mas com inputMode
        inputMode="decimal"
        value={value} 
        onChange={e => handleInputChange(e.target.value)} 
        placeholder={placeholder}
        style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", outline: "none", fontFamily: "inherit", color: "#111827" }} 
      />
    </div>
  );
}

// --- COMPONENTE DE MODAL (MANTIDO DESIGN ORIGINAL) ---
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "420px", boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#6b7280" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// --- COMPONENTE SPARK (MANTIDO DESIGN ORIGINAL) ---
function Spark({ up }) {
  return <span style={{ fontSize: "12px", color: up ? "#16a34a" : "#dc2626" }}>{up ? "▲" : "▼"}</span>;
}

export default function MarketplacePage() {
  const { user, market, fetchMarket, balance, setBalance, setTx, setVendas, showToast, ready } = useApp();
  const [buying, setBuying] = useState(null);
  const [qty, setQty] = useState("1");
  const [loading, setLoading] = useState(false);

  // --- FUNÇÃO DE COMPRA (LÓGICA DE DADOS REAIS - PERSISTÊNCIA NO BANCO) ---
  const handleBuy = async () => {
    const q = parseFloat(qty);
    if (!q || q <= 0) return showToast("Quantidade inválida", "error");
    if (q > buying.available) return showToast("Quantidade maior que o disponível", "error");
    
    const total = q * buying.price;
    if (total > balance) return showToast("Saldo insuficiente", "error");

    setLoading(true);

    try {
      // 1. Processa a Transação no Banco de Dados (API Real em endpoint unificado)
      // Você precisará criar a API "/api/marketplace/buy" no backend
      const response = await fetch("/api/marketplace/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compradorId: user.id,
          vendedorId: buying.vendedorId,
          loteId: buying.id,
          quantidade: q,
          precoUnitario: buying.price,
          total: total,
          tipo: buying.type,
          cert: buying.cert
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Erro ao processar compra");

      // 2. Só atualiza a interface se o banco de dados confirmou o sucesso
      setBalance(data.novoSaldo);
      setTx(prev => [data.transacao, ...prev]);
      if (data.venda) setVendas(prev => [data.venda, ...prev]);
      
      // 3. Recarrega o mercado para pegar as quantidades atualizadas do banco
      await fetchMarket();

      showToast(`Compra realizada com sucesso: ${fmtCO2(q)}`, "success");
      setBuying(null);
      setQty("1");

    } catch (err) {
      showToast(err.message, "error");
      console.error("Erro na compra:", err);
    } finally {
      setLoading(false);
    }
  };

  // Se o contexto não estiver pronto, mostra carregamento para evitar o erro de "undefined"
  if (!ready) {
    return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Buscando ofertas do mercado...</div>;
  }

  // --- RENDERIZAÇÃO PRINCIPAL (MANTIDO DESIGN ORIGINAL) ---
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Card>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", fontFamily: "'Playfair Display',serif", marginBottom: "4px" }}>
          Marketplace de Créditos de Carbono
        </h2>
        <p style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "20px" }}>Dados sincronizados em tempo real com a rede</p>

        {/* --- LISTA DE CARDS DO MERCADO (DESIGN ORIGINAL) --- */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px" }}>
          {market.map(item => (
            <div key={item.id}
              style={{ border: "1px solid #e5e7eb", borderRadius: "14px", padding: "20px", background: "#fff", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 6px 20px rgba(22,163,74,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >

              {/* Cabeçalho do Card */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#111827" }}>{item.name}</h3>
                  <p style={{ fontSize: "12px", color: "#6b7280" }}>{item.type} · {item.cert}</p>
                </div>
                <Badge label={item.status} color={STATUS_COLORS[item.status]} />
              </div>

              {/* Detalhes do Lote */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {[
                  ["Certificadora", item.cert],
                  ["Origem", item.vendedorId ? "Fazenda Produtora" : "Estoque Verificado"], // Ajuste para Dados Reais
                  ["Local", "Diversas"],
                  ["Disponível", fmtCO2(item.available)],
                  ["Preço", `${fmt(item.price)}/tCO₂`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{k}:</span>
                    <span style={{ fontSize: "12px", fontWeight: "600", color: k === "Disponível" ? "#16a34a" : k === "Preço" ? "#111827" : "#374151" }}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Rodapé do Card (Com Spark e Botão) */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Spark up={item.up} />
                  <span style={{ fontSize: "12px", fontWeight: "600", color: item.up ? "#16a34a" : "#dc2626" }}>
                    {item.up ? "+" : ""}{item.change}%
                  </span>
                </div>
                <Btn onClick={() => { setBuying(item); setQty("1"); }}>Comprar</Btn>
              </div>
            </div>
          ))}

          {market.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#9ca3af" }}>
              Nenhum crédito disponível no banco de dados no momento.
            </div>
          )}
        </div>
      </Card>

      {/* --- MODAL DE COMPRA (DESIGN ORIGINAL) --- */}
      {buying && (
        <Modal title={`Comprar ${buying.name}`} onClose={() => setBuying(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ background: "#f0fdf4", borderRadius: "10px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Preço unitário</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#15803d" }}>{fmt(buying.price)}/tCO₂</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Disponível</span>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>{fmtCO2(buying.available)}</span>
              </div>
            </div>

            {/* Input Tratado para Aceitar Ponto/Vírgula (Lógica de Dados Reais) */}
            <Input label="Quantidade (tCO₂)" value={qty} onChange={setQty} placeholder="ex: 1" />

            {/* Subtotal e Saldo Futuro (Lógica de Dados Reais) */}
            <div style={{ background: "#fafafa", borderRadius: "10px", padding: "14px", border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Subtotal</span>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>{fmt((parseFloat(qty) || 0) * buying.price)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>Saldo após compra</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: balance - (parseFloat(qty) || 0) * buying.price < 0 ? "#dc2626" : "#16a34a" }}>
                  {fmt(balance - (parseFloat(qty) || 0) * buying.price)}
                </span>
              </div>
            </div>

            {/* Ações do Modal */}
            <div style={{ display: "flex", gap: "10px" }}>
              <Btn variant="outline" onClick={() => setBuying(null)} style={{ flex: 1, justifyContent: "center" }}>Cancelar</Btn>
              <Btn onClick={handleBuy} disabled={loading} style={{ flex: 1, justifyContent: "center" }}>
                {loading ? "Processando..." : <>{Icons.check} Confirmar Compra</>}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}