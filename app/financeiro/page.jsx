"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";

const fmt    = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtCO2 = (v) => `${(v || 0).toFixed(1)} tCO₂`;

const TIPO_LABEL = {
  saque:    { emoji: "💸", label: "Saque",    cor: "#ef4444" },
  deposito: { emoji: "💵", label: "Depósito", cor: "#16a34a" },
  BUY:      { emoji: "🌿", label: "Compra",   cor: "#0ea5e9" },
  SELL:     { emoji: "💰", label: "Venda",    cor: "#16a34a" },
};

export default function FinanceiroPage() {
  const { user, role, balance, setBalance, transactions, setTx, vendas, showToast } = useApp();

  const [aba,      setAba]     = useState("visao");
  const [valor,    setValor]   = useState("");
  const [tipoOp,   setTipoOp]  = useState("deposito");
  const [salvando, setSalvando]= useState(false);
  const [detalhe,  setDetalhe]  = useState(null); // item selecionado no extrato

  const isVendedor = role === "vendedor";

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const totalRecebido = useMemo(() =>
    vendas?.reduce((s, v) => s + (v.total || v.valorTotal || 0), 0) || 0
  , [vendas]);

  const totalGasto = useMemo(() =>
    transactions?.filter(t => t.type === "BUY" || t.type === "SELL")
                 .reduce((s, t) => s + (t.total || 0), 0) || 0
  , [transactions]);

  const totalCO2 = useMemo(() =>
    transactions?.reduce((s, t) => s + (t.amount || 0), 0) || 0
  , [transactions]);

  const ticketMedio = useMemo(() => {
    if (isVendedor) return vendas?.length ? totalRecebido / vendas.length : 0;
    const compras = transactions?.filter(t => t.type === "BUY");
    return compras?.length ? totalGasto / compras.length : 0;
  }, [isVendedor, vendas, transactions, totalRecebido, totalGasto]);

  // ── Extrato unificado ────────────────────────────────────────────────────
  // Comprador: todas as transacoes (compras + saques + depositos)
  // Vendedor: vendas + saques/depositos das transacoes
  const listaExtrato = useMemo(() => {
    if (isVendedor) {
      const financeiras = (transactions || []).filter(t => t.type === "saque" || t.type === "deposito");
      const vendasFormatadas = (vendas || []).map(v => ({
        ...v,
        _tipo: "venda",
        date: v.data || v.date,
      }));
      return [...vendasFormatadas, ...financeiras]
        .sort((a, b) => {
          const da = a.date || a.data || "";
          const db = b.date || b.data || "";
          return db.localeCompare(da);
        });
    }
    return (transactions || []);
  }, [isVendedor, transactions, vendas]);

  // ── Gráfico por mês ───────────────────────────────────────────────────────
  const meses = useMemo(() => {
    const mapa = {};
    listaExtrato.forEach(t => {
      const raw    = t.data || t.date || "";
      const partes = raw.split(" ")[0]?.split("/");
      if (!partes || partes.length < 3) return;
      const chave  = `${partes[1]}/${partes[2]}`;
      const val    = t.total || t.valorTotal || 0;
      if (t.type === "saque") mapa[chave] = (mapa[chave] || 0) - val;
      else                    mapa[chave] = (mapa[chave] || 0) + val;
    });
    return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [listaExtrato]);

  const maxVal = Math.max(...meses.map(([, v]) => Math.abs(v)), 1);

  // ── Operação financeira ───────────────────────────────────────────────────
  const handleOperacao = async () => {
    const num = parseFloat(String(valor).replace(/\./g, "").replace(",", "."));
    if (!num || num <= 0) return showToast("Informe um valor válido.", "error");

    const ehSaque  = isVendedor || tipoOp === "saque";
    if (ehSaque && num > balance)
      return showToast("Saldo insuficiente para saque.", "error");

    const novoSaldo = ehSaque ? balance - num : balance + num;
    const tipoLabel = ehSaque ? "saque" : "deposito";
    const now       = new Date();
    const dateStr   = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR").slice(0, 5);
    const tempId    = `temp-${Date.now()}`;

    // Mostra imediatamente no extrato
    const novaEntrada = { id: tempId, type: tipoLabel, cert: "Operação", date: dateStr, amount: 0, price: 0, total: num, status: "pago" };
    setBalance(novoSaldo);
    setTx(prev => [novaEntrada, ...(prev || [])]);
    setValor("");
    showToast(ehSaque ? `Saque de ${fmt(num)} solicitado!` : `${fmt(num)} adicionado!`, "success");

    setSalvando(true);
    try {
      // 1. Salva saldo
      await fetch("/api/usuarios/saldo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, saldo: novoSaldo }),
      });

      // 2. Salva no extrato
      const txRes = await fetch("/api/transacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type:   tipoLabel,
          cert:   "Operacao",
          amount: 0,
          price:  0,
          total:  num,
          status: "pago",
        }),
      });

      if (txRes.ok) {
        const salvo = await txRes.json();
        // Troca entrada temporária pelo registro real do banco
        setTx(prev => prev.map(t => t.id === tempId ? { ...salvo, cert: "Operação" } : t));
      } else {
        const err = await txRes.json();
        console.error("Erro ao salvar extrato:", err);
      }

      // 3. Sincroniza sessionStorage
      const saved = sessionStorage.getItem("cleantrade_user");
      if (saved) {
        const p = JSON.parse(saved); p.saldo = novoSaldo;
        sessionStorage.setItem("cleantrade_user", JSON.stringify(p));
      }
    } catch (e) {
      console.error(e);
      showToast("Erro ao sincronizar com o banco.", "error");
      setBalance(balance);
      setTx(prev => prev.filter(t => t.id !== tempId));
    } finally {
      setSalvando(false);
    }
  };

  const abas = [
    { id: "visao",    label: "📊 Visão Geral" },
    { id: "operacao", label: isVendedor ? "💸 Saque" : "➕ Depósito/Saque" },
    { id: "extrato",  label: `📄 Extrato (${listaExtrato.length})` },
  ];

  const themeGrad  = isVendedor ? "linear-gradient(135deg,#0c4a6e,#0284c7)" : "linear-gradient(135deg,#064e3b,#16a34a)";
  const themeColor = isVendedor ? "#0ea5e9" : "#16a34a";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>

      {/* BANNER */}
      <div style={{ background: themeGrad, borderRadius: 20, padding: "28px 32px", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -10, bottom: -20, fontSize: 110, opacity: 0.07 }}>💳</div>
        <div style={{ zIndex: 1 }}>
          <p style={{ opacity: 0.75, fontSize: 13, marginBottom: 4 }}>Módulo Financeiro</p>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 6px" }}>Minha Carteira</h2>
          <p style={{ opacity: 0.8, fontSize: 13 }}>{user?.nome} · {isVendedor ? "Perfil Vendedor" : "Perfil Comprador"}</p>
        </div>
        <div style={{ textAlign: "right", zIndex: 1 }}>
          <p style={{ opacity: 0.7, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
            {isVendedor ? "Receita acumulada" : "Saldo disponível"}
          </p>
          <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: -1 }}>{fmt(balance)}</p>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {[
          { label: isVendedor ? "Total Recebido"    : "Total Investido",  value: fmt(isVendedor ? totalRecebido : totalGasto), color: "#16a34a" },
          { label: isVendedor ? "Vendas Realizadas" : "Compras",          value: isVendedor ? (vendas?.length || 0) : (transactions?.filter(t => t.type === "BUY").length || 0), color: "#0ea5e9" },
          { label: isVendedor ? "Ticket Médio"      : "CO₂ Compensado",   value: isVendedor ? fmt(ticketMedio) : fmtCO2(totalCO2), color: "#8b5cf6" },
          { label: "Saldo Atual",                                          value: fmt(balance), color: "#f59e0b" },
        ].map((k, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "20px 22px", border: "1px solid #e5e7eb" }}>
            <p style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ABAS */}
      <div style={{ display: "flex", gap: 4, background: "#f3f4f6", padding: 4, borderRadius: 12, width: "fit-content" }}>
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            style={{ padding: "8px 20px", borderRadius: 10, border: "none", background: aba === a.id ? "#fff" : "transparent", fontWeight: aba === a.id ? 700 : 500, fontSize: 13, color: aba === a.id ? "#111827" : "#6b7280", cursor: "pointer", boxShadow: aba === a.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* ABA: VISÃO GERAL */}
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
              {meses.map(([mes, val]) => {
                const positivo = val >= 0;
                return (
                  <div key={mes} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: 10, color: positivo ? "#16a34a" : "#ef4444", fontWeight: 700, textAlign: "center" }}>
                      {positivo ? "+" : ""}{fmt(val).replace("R$\u00a0", "R$")}
                    </p>
                    <div style={{ width: "100%", background: positivo ? themeColor : "#ef4444", borderRadius: "6px 6px 0 0", height: `${Math.max((Math.abs(val) / maxVal) * 140, 4)}px`, opacity: 0.85, transition: "height 0.4s" }} />
                    <p style={{ fontSize: 10, color: "#9ca3af" }}>{mes}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA: OPERAÇÃO */}
      {aba === "operacao" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #e5e7eb", maxWidth: 500 }}>
          <p style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>
            {isVendedor ? "Solicitar Saque" : "Gerenciar Fundos"}
          </p>
          <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 24 }}>
            {isVendedor ? "Transfira seus lucros para sua conta PIX cadastrada." : "Simule depósito ou saque na sua carteira CleanTrade."}
          </p>

          {!isVendedor && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[{ id: "deposito", label: "➕ Depósito" }, { id: "saque", label: "➖ Saque" }].map(t => (
                <button key={t.id} onClick={() => setTipoOp(t.id)}
                  style={{ flex: 1, padding: "10px", borderRadius: 10, border: `2px solid ${tipoOp === t.id ? themeColor : "#e5e7eb"}`, background: tipoOp === t.id ? `${themeColor}15` : "#fff", fontWeight: 700, fontSize: 13, color: tipoOp === t.id ? themeColor : "#6b7280", cursor: "pointer" }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {[500, 1000, 5000, 10000].map(v => (
              <button key={v} onClick={() => setValor(String(v))}
                style={{ padding: "8px 16px", borderRadius: 8, border: `2px solid ${valor === String(v) ? themeColor : "#e5e7eb"}`, background: valor === String(v) ? `${themeColor}15` : "#f9fafb", fontWeight: 700, fontSize: 13, color: valor === String(v) ? themeColor : "#374151", cursor: "pointer" }}>
                {fmt(v)}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontWeight: 700, fontSize: 14 }}>R$</span>
              <input type="text" inputMode="decimal" value={valor} onChange={e => { const v = e.target.value.replace(/[^0-9.,]/g, ""); setValor(v); }} placeholder="0,00"
                style={{ width: "100%", padding: "14px 14px 14px 44px", borderRadius: 10, border: "2px solid #e5e7eb", fontSize: 18, fontWeight: 700, boxSizing: "border-box", outline: "none" }} />
            </div>
            <button onClick={handleOperacao} disabled={salvando}
              style={{ padding: "14px 28px", borderRadius: 10, background: themeColor, color: "#fff", border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: salvando ? 0.7 : 1, whiteSpace: "nowrap" }}>
              {salvando ? "Salvando..." : isVendedor ? "Sacar" : tipoOp === "deposito" ? "Depositar" : "Sacar"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 12, textAlign: "center" }}>🔒 Simulação para fins de demonstração</p>
        </div>
      )}

      {/* ABA: EXTRATO */}
      {aba === "extrato" && (
        <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e5e7eb" }}>
          <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>
            Extrato completo ({listaExtrato.length} registros)
          </p>
          {listaExtrato.length === 0 ? (
            <div style={{ padding: 60, textAlign: "center", color: "#9ca3af" }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
              <p>Nenhum registro encontrado.</p>
              <p style={{ fontSize: 12, marginTop: 8, color: "#d1d5db" }}>
                {isVendedor ? "Faça uma venda ou saque para ver aqui." : "Compre créditos ou faça um depósito para ver aqui."}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {listaExtrato.map((t, i) => {
                const tipo     = t.type || t._tipo || "BUY";
                const config   = TIPO_LABEL[tipo] || { emoji: "💳", label: tipo, cor: "#6b7280" };
                const ehSaida  = tipo === "saque";
                const valorItem = t.total || t.valorTotal || 0;
                const dataStr  = t.data || t.date || "—";

                // Título descritivo por tipo
                const titulo = tipo === "saque"    ? `Saque — ${fmt(valorItem)}`
                             : tipo === "deposito"  ? `Depósito — ${fmt(valorItem)}`
                             : tipo === "venda" || t._tipo === "venda"
                               ? `Venda — ${t.lote || t.loteId || "Lote"}`
                             : `Compra — ${t.cert || "Crédito de Carbono"}`;

                const detalheStr = tipo === "saque"    ? "Transferência para conta PIX"
                              : tipo === "deposito"  ? "Depósito na carteira"
                              : tipo === "venda" || t._tipo === "venda"
                                ? `Comprador: ${t.comprador || t.compradorId || "—"} · ${t.quantidade || 0} tCO₂`
                              : `${t.amount || 0} tCO₂ · Certificado: ${t.cert || "—"}`;

                return (
                  <div key={t.id || i} onClick={() => setDetalhe({ t, tipo, config, ehSaida, valorItem, dataStr, titulo, detalhe: detalheStr })}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: "#f9fafb", borderRadius: 12, border: "1px solid #f3f4f6", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f0f4ff"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#f3f4f6"; }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${config.cor}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {config.emoji}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{titulo}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{dataStr}</p>
                        <p style={{ fontSize: 11, color: "#b5bec9", marginTop: 1 }}>{detalheStr}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontWeight: 800, fontSize: 15, color: ehSaida ? "#ef4444" : config.cor }}>
                        {ehSaida ? "-" : "+"}{fmt(valorItem)}
                      </p>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${config.cor}15`, color: config.cor, fontWeight: 600 }}>
                        {config.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* MODAL DETALHE DO EXTRATO */}
      {detalhe && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={() => setDetalhe(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 20, padding: 32, width: "100%", maxWidth: 460, boxShadow: "0 24px 64px rgba(0,0,0,0.2)", animation: "slideIn 0.2s ease-out" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: `${detalhe.config.cor}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  {detalhe.config.emoji}
                </div>
                <div>
                  <p style={{ fontWeight: 900, fontSize: 18, color: "#111827" }}>{detalhe.titulo}</p>
                  <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: `${detalhe.config.cor}15`, color: detalhe.config.cor, fontWeight: 700 }}>
                    {detalhe.config.label}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetalhe(null)}
                style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", flexShrink: 0 }}>
                ✕
              </button>
            </div>

            {/* Valor principal */}
            <div style={{ background: detalhe.ehSaida ? "#fff5f5" : "#f0fdf4", borderRadius: 14, padding: "20px 24px", marginBottom: 20, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 4 }}>Valor da operação</p>
              <p style={{ fontSize: 36, fontWeight: 900, color: detalhe.ehSaida ? "#ef4444" : detalhe.config.cor }}>
                {detalhe.ehSaida ? "-" : "+"}{fmt(detalhe.valorItem)}
              </p>
            </div>

            {/* Detalhes em grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Data e hora",   value: detalhe.dataStr },
                { label: "Tipo",          value: detalhe.config.label },
                { label: "Descrição",     value: detalhe.detalhe },
                detalhe.t.cert && detalhe.t.cert !== "—" && { label: "Certificadora", value: detalhe.t.cert },
                detalhe.t.amount > 0                      && { label: "Volume CO₂",   value: fmtCO2(detalhe.t.amount) },
                detalhe.t.price  > 0                      && { label: "Preço/tCO₂",   value: fmt(detalhe.t.price) },
                detalhe.t.comprador                       && { label: "Comprador",     value: detalhe.t.comprador },
                detalhe.t.vendedor                        && { label: "Vendedor",      value: detalhe.t.vendedor },
                { label: "Status",        value: detalhe.t.status || "pago" },
                detalhe.t.id && !String(detalhe.t.id).startsWith("temp") && { label: "ID da operação", value: String(detalhe.t.id).slice(0, 20) + "..." },
              ].filter(Boolean).map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f9fafb", borderRadius: 10 }}>
                  <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", textAlign: "right", maxWidth: 240, wordBreak: "break-all" }}>{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setDetalhe(null)}
              style={{ width: "100%", marginTop: 20, padding: "14px", borderRadius: 12, border: "none", background: "#f3f4f6", color: "#374151", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}