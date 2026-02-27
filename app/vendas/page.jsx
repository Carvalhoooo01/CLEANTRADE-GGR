"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";

const fmt    = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtCO2 = (v) => `${(v || 0).toFixed(1)} tCO₂`;

export default function FinanceiroPage() {
  const { user, role, balance, setBalance, transactions, vendas, showToast } = useApp();

  const [aba,        setAba]       = useState("visao");
  const [valor,      setValor]     = useState("");
  const [tipoOp,     setTipoOp]    = useState("deposito");
  const [salvando,   setSalvando]  = useState(false);

  const isVendedor = role === "vendedor";

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalRecebido = useMemo(() =>
    vendas?.reduce((s, v) => s + (v.valorTotal || v.total || 0), 0) || 0
  , [vendas]);

  const totalGasto = useMemo(() =>
    transactions?.reduce((s, t) => s + (t.total || 0), 0) || 0
  , [transactions]);

  const totalCO2 = useMemo(() =>
    transactions?.reduce((s, t) => s + (t.amount || 0), 0) || 0
  , [transactions]);

  const ticketMedio = useMemo(() => {
    const lista = isVendedor ? vendas : transactions;
    return lista?.length ? (isVendedor ? totalRecebido : totalGasto) / lista.length : 0;
  }, [isVendedor, vendas, transactions, totalRecebido, totalGasto]);

  // ── Gráfico por mês ───────────────────────────────────────────────────────
  const meses = useMemo(() => {
    const mapa = {};
    const lista = isVendedor ? vendas : transactions;
    lista?.forEach(t => {
      const raw  = t.data || t.date || "";
      const partes = raw.split(" ")[0]?.split("/");
      if (!partes || partes.length < 3) return;
      const chave = `${partes[1]}/${partes[2]}`; // mm/aaaa
      mapa[chave] = (mapa[chave] || 0) + (isVendedor ? (t.valorTotal || t.total || 0) : (t.total || 0));
    });
    return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [isVendedor, vendas, transactions]);

  const maxVal = Math.max(...meses.map(([, v]) => v), 1);

  // ── Operação financeira ───────────────────────────────────────────────────
  const handleOperacao = async () => {
    const num = parseFloat(valor.replace(",", "."));
    if (!num || num <= 0) return showToast("Informe um valor válido.", "error");
    if (tipoOp === "saque" && num > balance)
      return showToast("Saldo insuficiente para saque.", "error");

    // Vendedor sempre saca; comprador depende do toggle
    const ehSaque = isVendedor || tipoOp === "saque";
    const novoSaldo = ehSaque ? balance - num : balance + num;

    // Otimista
    setBalance(novoSaldo);
    setValor("");
    showToast(
      ehSaque
        ? `Saque de ${fmt(num)} solicitado!`
        : `${fmt(num)} adicionado com sucesso!`,
      "success"
    );

    // Persistir no banco
    setSalvando(true);
    try {
      const res = await fetch("/api/usuarios/saldo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, saldo: novoSaldo }),
      });
      if (!res.ok) throw new Error();

      // Atualiza localStorage
      const saved = localStorage.getItem("cleantrade_user");
      if (saved) {
        const p = JSON.parse(saved);
        p.saldo = novoSaldo;
        localStorage.setItem("cleantrade_user", JSON.stringify(p));
      }
    } catch {
      showToast("Erro ao sincronizar com o banco.", "error");
      setBalance(balance); // reverte
    } finally {
      setSalvando(false);
    }
  };

  // ── Aba de extrato: lista unificada ───────────────────────────────────────
  const listaExtrato = isVendedor ? vendas : transactions;

  const abas = [
    { id: "visao",    label: "📊 Visão Geral" },
    { id: "operacao", label: isVendedor ? "💸 Saque" : "➕ Depósito" },
    { id: "extrato",  label: "📄 Extrato" },
  ];

  const themeGrad  = isVendedor
    ? "linear-gradient(135deg,#0c4a6e,#0284c7)"
    : "linear-gradient(135deg,#064e3b,#16a34a)";
  const themeColor = isVendedor ? "#0ea5e9" : "#16a34a";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>

      {/* ── BANNER ─────────────────────────────────────────────────────────── */}
      <div style={{ background: themeGrad, borderRadius: 20, padding: "28px 32px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -10, bottom: -20, fontSize: 110, opacity: 0.07 }}>💳</div>
        <div style={{ zIndex: 1 }}>
          <p style={{ opacity: 0.75, fontSize: 13, marginBottom: 4 }}>Módulo Financeiro</p>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>Minha Carteira</h2>
          <p style={{ opacity: 0.8, fontSize: 13 }}>
            {user?.nome} · {isVendedor ? "Perfil Vendedor" : "Perfil Comprador"}
          </p>
        </div>
        <div style={{ textAlign: "right", zIndex: 1 }}>
          <p style={{ opacity: 0.7, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
            {isVendedor ? "Receita acumulada" : "Saldo disponível"}
          </p>
          <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1 }}>{fmt(balance)}</p>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: isVendedor ? "Total Recebido"     : "Total Investido",
            value: fmt(isVendedor ? totalRecebido : totalGasto),       color: "#16a34a" },
          { label: isVendedor ? "Vendas Realizadas"  : "Compras",
            value: isVendedor ? (vendas?.length || 0) : (transactions?.length || 0), color: "#0ea5e9" },
          { label: isVendedor ? "Ticket Médio"       : "CO₂ Compensado",
            value: isVendedor ? fmt(ticketMedio) : fmtCO2(totalCO2),   color: "#8b5cf6" },
          { label: "Saldo Atual",
            value: fmt(balance),                                         color: "#f59e0b" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── ABAS ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 4, background: "#f3f4f6", padding: 4, borderRadius: 12, width: "fit-content" }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: aba === a.id ? "#fff" : "transparent", fontWeight: aba === a.id ? 700 : 500, fontSize: 13, color: aba === a.id ? "#111827" : "#6b7280", cursor: "pointer", boxShadow: aba === a.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ── ABA: VISÃO GERAL ───────────────────────────────────────────────── */}
      {aba === "visao" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 20 }}>Evolução financeira (últimos 6 meses)</p>
          {meses.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
              <p>Nenhuma movimentação registrada ainda.</p>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, padding: "0 8px" }}>
              {meses.map(([mes, val]) => (
                <div key={mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <p style={{ fontSize: 10, color: "#6b7280", fontWeight: 700, textAlign: "center" }}>
                    {fmt(val).replace("R$\u00a0", "R$")}
                  </p>
                  <div style={{ width: "100%", background: themeColor, borderRadius: "6px 6px 0 0", height: `${Math.max((val / maxVal) * 140, 4)}px`, opacity: 0.85, transition: "height 0.4s" }} />
                  <p style={{ fontSize: 10, color: "#9ca3af" }}>{mes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ABA: OPERAÇÃO ─────────────────────────────────────────────────── */}
      {aba === "operacao" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e5e7eb", maxWidth: 500 }}>
          <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
            {isVendedor ? "Solicitar Saque" : "Adicionar Fundos"}
          </p>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>
            {isVendedor
              ? "Transfira seus lucros para sua conta PIX cadastrada."
              : "Simule um depósito na sua carteira CleanTrade."}
          </p>

          {/* Toggle depósito/saque — só para comprador */}
          {!isVendedor && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { id: "deposito", label: "➕ Depósito" },
                { id: "saque",    label: "➖ Saque"    },
              ].map(t => (
                <button key={t.id} onClick={() => setTipoOp(t.id)}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${tipoOp === t.id ? themeColor : "#e5e7eb"}`, background: tipoOp === t.id ? `${themeColor}15` : "#fff", fontWeight: 700, fontSize: 13, color: tipoOp === t.id ? themeColor : "#6b7280", cursor: "pointer" }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Valores rápidos */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {[500, 1000, 5000, 10000].map(v => (
              <button key={v} onClick={() => setValor(String(v))}
                style={{ padding: "8px 16px", borderRadius: 8, border: `2px solid ${valor === String(v) ? themeColor : "#e5e7eb"}`, background: valor === String(v) ? `${themeColor}15` : "#f9fafb", fontWeight: 700, fontSize: 13, color: valor === String(v) ? themeColor : "#374151", cursor: "pointer" }}>
                {fmt(v)}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontWeight: 700, fontSize: 14 }}>R$</span>
              <input
                type="number"
                value={valor}
                onChange={e => setValor(e.target.value)}
                placeholder="0,00"
                style={{ width: "100%", padding: "14px 14px 14px 44px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 18, fontWeight: 700, boxSizing: "border-box", outline: "none" }}
              />
            </div>
            <button onClick={handleOperacao} disabled={salvando}
              style={{ padding: "14px 28px", borderRadius: 10, background: themeColor, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: salvando ? 0.7 : 1, whiteSpace: "nowrap" }}>
              {salvando ? "Salvando..." : isVendedor ? "Solicitar Saque" : tipoOp === "deposito" ? "Depositar" : "Sacar"}
            </button>
          </div>

          <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 12, textAlign: "center" }}>
            🔒 Simulação para fins de demonstração
          </p>
        </div>
      )}

      {/* ── ABA: EXTRATO ──────────────────────────────────────────────────── */}
      {aba === "extrato" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
            Extrato completo ({listaExtrato?.length || 0} registros)
          </p>

          {!listaExtrato?.length ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
              <p>Nenhum registro encontrado.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {listaExtrato.map((t, i) => {
                const titulo = isVendedor
                  ? `Venda — ${t.lote || t.loteId || "Lote"}`
                  : `${t.type || "Compra"} — ${t.cert || ""}`;
                const dataStr = t.data || t.date || "—";
                const valorItem = t.total || t.valorTotal || 0;

                return (
                  <div key={t.id || i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#f9fafb", borderRadius: 12, border: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: isVendedor ? "#e0f2fe" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {isVendedor ? "💰" : "🌿"}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{titulo}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{dataStr}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontWeight: 800, fontSize: 15, color: themeColor }}>+{fmt(valorItem)}</p>
                      {!isVendedor && t.amount && (
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{fmtCO2(t.amount)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}