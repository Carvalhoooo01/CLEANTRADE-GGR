"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";

const fmt    = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtCO2 = (v: number) => `${(v || 0).toFixed(1)} tCO2`;

export default function VendasPage() {
  const { user, role, balance, setBalance, transactions, setTx, vendas, showToast } = useApp();

  const [aba,      setAba]      = useState("visao");
  const [valor,    setValor]    = useState("");
  const [tipoOp,   setTipoOp]   = useState("deposito");
  const [salvando, setSalvando] = useState(false);
  const [detalhe,  setDetalhe]  = useState<any>(null);

  const isVendedor = role === "vendedor";

  const totalRecebido = useMemo(() =>
    vendas?.reduce((s: number, v: any) => s + (v.valorTotal || v.total || 0), 0) || 0
  , [vendas]);

  const totalGasto = useMemo(() =>
    transactions?.reduce((s: number, t: any) => s + (t.total || 0), 0) || 0
  , [transactions]);

  const totalCO2 = useMemo(() =>
    transactions?.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0
  , [transactions]);

  const ticketMedio = useMemo(() => {
    const lista = isVendedor ? vendas : transactions;
    return lista?.length ? (isVendedor ? totalRecebido : totalGasto) / lista.length : 0;
  }, [isVendedor, vendas, transactions, totalRecebido, totalGasto]);

  const meses = useMemo(() => {
    const mapa: Record<string, number> = {};
    const lista = isVendedor ? vendas : transactions;
    lista?.forEach((t: any) => {
      const raw    = t.data || t.date || "";
      const partes = raw.split(" ")[0]?.split("/");
      if (!partes || partes.length < 3) return;
      const chave  = `${partes[1]}/${partes[2]}`;
      mapa[chave]  = (mapa[chave] || 0) + (isVendedor ? (t.valorTotal || t.total || 0) : (t.total || 0));
    });
    return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [isVendedor, vendas, transactions]);

  const maxVal = Math.max(...meses.map(([, v]) => v as number), 1);

  const handleOperacao = async () => {
    const num = parseFloat(String(valor).replace(/\./g, "").replace(",", "."));
    if (!num || num <= 0) return showToast("Informe um valor valido.", "error");

    const ehSaque   = isVendedor || tipoOp === "saque";
    if (ehSaque && num > balance) return showToast("Saldo insuficiente para saque.", "error");

    const novoSaldo = ehSaque ? balance - num : balance + num;
    const tipoLabel = ehSaque ? "saque" : "deposito";
    const now       = new Date();
    const dateStr   = now.toLocaleDateString("pt-BR") + " " + now.toLocaleTimeString("pt-BR").slice(0, 5);
    const tempId    = `temp-${Date.now()}`;

    const novaEntrada = { id: tempId, type: tipoLabel, cert: "Operacao", date: dateStr, amount: 0, price: 0, total: num, status: "pago" };
    setBalance(novoSaldo);
    setTx((prev: any[]) => [novaEntrada, ...(prev || [])]);
    setValor("");
    showToast(ehSaque ? `Saque de ${fmt(num)} solicitado!` : `${fmt(num)} adicionado!`, "success");

    setSalvando(true);
    try {
      await fetch("/api/usuarios/saldo", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, saldo: novoSaldo }),
      });
      const txRes = await fetch("/api/transacoes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, type: tipoLabel, cert: "Operacao", amount: 0, price: 0, total: num, status: "pago" }),
      });
      if (txRes.ok) {
        const salvo = await txRes.json();
        setTx((prev: any[]) => prev.map((t: any) => t.id === tempId ? { ...salvo, cert: "Operacao" } : t));
      }
      const saved = sessionStorage.getItem("cleantrade_user");
      if (saved) {
        const p = JSON.parse(saved); p.saldo = novoSaldo;
        sessionStorage.setItem("cleantrade_user", JSON.stringify(p));
      }
    } catch {
      showToast("Erro ao sincronizar com o banco.", "error");
      setBalance(balance);
      setTx((prev: any[]) => prev.filter((t: any) => t.id !== tempId));
    } finally {
      setSalvando(false);
    }
  };

  // Extrato unificado: vendas + transacoes financeiras
  const listaExtrato = useMemo(() => {
    if (isVendedor) {
      const financeiras = (transactions || []).filter((t: any) => t.type === "saque" || t.type === "deposito");
      const vendasFmt   = (vendas || []).map((v: any) => ({ ...v, _isVenda: true }));
      return [...vendasFmt, ...financeiras].sort((a: any, b: any) => {
        const da = a.data || a.date || "";
        const db = b.data || b.date || "";
        return db.localeCompare(da);
      });
    }
    return transactions || [];
  }, [isVendedor, vendas, transactions]);

  const abas = [
    { id: "visao",    label: "Visao Geral" },
    { id: "operacao", label: isVendedor ? "Saque" : "Deposito" },
    { id: "extrato",  label: `Extrato (${listaExtrato.length})` },
  ];

  const themeGrad  = isVendedor ? "linear-gradient(135deg,#0c4a6e,#0284c7)" : "linear-gradient(135deg,#064e3b,#16a34a)";
  const themeColor = isVendedor ? "#0ea5e9" : "#16a34a";

  return (
    <div className="flex flex-col gap-5 pb-10">

      {/* Banner
          Mobile: empilha em coluna | Desktop: lado a lado (original) */}
      <div style={{ background: themeGrad }}
        className="rounded-2xl px-8 py-7 text-white relative overflow-hidden
                   flex flex-col gap-3
                   lg:flex-row lg:justify-between lg:items-center lg:gap-0">
        <div className="absolute -right-2.5 -bottom-5 text-[110px] opacity-[0.07] pointer-events-none">💳</div>
        <div className="z-10">
          <p className="opacity-75 text-sm mb-1">Modulo Financeiro</p>
          <h2 className="text-2xl font-black m-0 mb-1.5">Minha Carteira</h2>
          <p className="opacity-80 text-sm">{user?.nome} · {isVendedor ? "Perfil Vendedor" : "Perfil Comprador"}</p>
        </div>
        <div className="z-10 lg:text-right">
          <p className="opacity-70 text-xs uppercase tracking-widest">{isVendedor ? "Receita acumulada" : "Saldo disponivel"}</p>
          <p className="text-[38px] font-black tracking-tight">{fmt(balance)}</p>
        </div>
      </div>

      {/* KPIs
          Mobile: 2 colunas | Desktop: 4 colunas (original) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[
          { label: isVendedor ? "Total Recebido"    : "Total Investido",  value: fmt(isVendedor ? totalRecebido : totalGasto),                    color: "#16a34a" },
          { label: isVendedor ? "Vendas Realizadas" : "Compras",          value: isVendedor ? (vendas?.length || 0) : (transactions?.length || 0), color: "#0ea5e9" },
          { label: isVendedor ? "Ticket Medio"      : "CO2 Compensado",   value: isVendedor ? fmt(ticketMedio) : fmtCO2(totalCO2),                 color: "#8b5cf6" },
          { label: "Saldo Atual",                                          value: fmt(balance),                                                      color: "#f59e0b" },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl px-[22px] py-5 border border-gray-200">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 truncate">{k.label}</p>
            <p className="text-xl font-black truncate" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Abas
          Mobile: scroll horizontal | Desktop: w-fit (original) */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto scrollbar-none lg:w-fit">
        {abas.map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className="px-5 py-2 rounded-xl border-none text-sm cursor-pointer transition-all whitespace-nowrap shrink-0"
            style={{ background: aba === a.id ? "#fff" : "transparent", fontWeight: aba === a.id ? 700 : 500, color: aba === a.id ? "#111827" : "#6b7280", boxShadow: aba === a.id ? "0 2px 8px rgba(0,0,0,0.08)" : "none" }}>
            {a.label}
          </button>
        ))}
      </div>

      {/* Aba Visao Geral */}
      {aba === "visao" && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="font-extrabold text-base mb-5">Evolucao financeira (ultimos 6 meses)</p>
          {meses.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p>Nenhuma movimentacao registrada ainda.</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-[180px] px-2">
              {meses.map(([mes, val]) => (
                <div key={mes} className="flex-1 flex flex-col items-center gap-1.5">
                  <p className="text-[10px] text-gray-500 font-bold text-center">
                    {fmt(val as number).replace("R$\u00a0", "R$")}
                  </p>
                  <div className="w-full rounded-t-[6px] opacity-85 transition-all duration-400"
                    style={{ background: themeColor, height: `${Math.max(((val as number) / maxVal) * 140, 4)}px` }} />
                  <p className="text-[10px] text-gray-400">{mes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba Operacao
          Mobile: input+botao empilham | Desktop: lado a lado (original) */}
      {aba === "operacao" && (
        <div className="bg-white rounded-2xl p-8 border border-gray-200 max-w-[500px]">
          <p className="font-extrabold text-lg mb-1">{isVendedor ? "Solicitar Saque" : "Adicionar Fundos"}</p>
          <p className="text-gray-500 text-sm mb-6">
            {isVendedor ? "Transfira seus lucros para sua conta PIX cadastrada." : "Simule um deposito na sua carteira CleanTrade."}
          </p>

          {!isVendedor && (
            <div className="flex gap-2 mb-5">
              {[{ id: "deposito", label: "Deposito" }, { id: "saque", label: "Saque" }].map(t => (
                <button key={t.id} onClick={() => setTipoOp(t.id)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all"
                  style={{ border: `2px solid ${tipoOp === t.id ? themeColor : "#e5e7eb"}`, background: tipoOp === t.id ? `${themeColor}15` : "#fff", color: tipoOp === t.id ? themeColor : "#6b7280" }}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-5">
            {[500, 1000, 5000, 10000].map(v => (
              <button key={v} onClick={() => setValor(String(v))}
                className="px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all"
                style={{ border: `2px solid ${valor === String(v) ? themeColor : "#e5e7eb"}`, background: valor === String(v) ? `${themeColor}15` : "#f9fafb", color: valor === String(v) ? themeColor : "#374151" }}>
                {fmt(v)}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 lg:flex-row">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
              <input type="text" inputMode="decimal" value={valor}
                onChange={e => { const v = e.target.value.replace(/[^0-9.,]/g, ""); setValor(v); }}
                placeholder="0,00"
                className="w-full pl-11 pr-3.5 py-3.5 rounded-xl border-2 border-gray-200 text-lg font-bold box-border outline-none" />
            </div>
            <button onClick={handleOperacao} disabled={salvando}
              className="w-full lg:w-auto px-7 py-3.5 rounded-xl border-none text-white font-bold text-sm cursor-pointer whitespace-nowrap disabled:opacity-70"
              style={{ background: themeColor }}>
              {salvando ? "Salvando..." : isVendedor ? "Solicitar Saque" : tipoOp === "deposito" ? "Depositar" : "Sacar"}
            </button>
          </div>
          <p className="text-xs text-gray-300 mt-3 text-center">Simulacao para fins de demonstracao</p>
        </div>
      )}

      {/* Aba Extrato */}
      {aba === "extrato" && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="font-extrabold text-base mb-4">Extrato completo ({listaExtrato.length} registros)</p>
          {listaExtrato.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-3xl mb-2">📭</p>
              <p>Nenhum registro encontrado.</p>
              <p className="text-xs mt-2 text-gray-300">
                {isVendedor ? "Faca uma venda ou saque para ver aqui." : "Compre creditos ou faca um deposito para ver aqui."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {listaExtrato.map((t: any, i: number) => {
                const isVenda   = t._isVenda;
                const isSaque   = t.type === "saque";
                const isDeposito = t.type === "deposito";
                const valorItem = t.total || t.valorTotal || 0;
                const dataStr   = t.data || t.date || "-";

                const titulo = isVenda
                  ? `Venda - ${t.lote || t.loteId || "Lote"}`
                  : isSaque   ? `Saque - ${fmt(valorItem)}`
                  : isDeposito ? `Deposito - ${fmt(valorItem)}`
                  : `${t.type || "Compra"} - ${t.cert || "Credito de Carbono"}`;

                const emoji = isVenda ? "💰" : isSaque ? "💸" : isDeposito ? "💵" : "🌿";
                const cor   = isSaque ? "#ef4444" : isVenda ? themeColor : "#16a34a";
                const sinal = isSaque ? "-" : "+";

                return (
                  <div key={t.id || i}
                    className="flex justify-between items-center px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer transition-all"
                    onClick={() => setDetalhe({ t, titulo, emoji, cor, sinal, valorItem, dataStr, isVenda, isSaque, isDeposito })}
                    onMouseEnter={e => { e.currentTarget.style.background = "#f0f4ff"; e.currentTarget.style.borderColor = "#c7d2fe"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#f9fafb"; e.currentTarget.style.borderColor = "#f3f4f6"; }}>
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ background: `${cor}15` }}>
                        {emoji}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm mb-0.5 truncate">{titulo}</p>
                        <p className="text-xs text-gray-400">{dataStr}</p>
                        {isVenda && t.quantidade && (
                          <p className="text-xs text-gray-400">{fmtCO2(t.quantidade)} tCO2</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-extrabold text-[15px]" style={{ color: cor }}>
                        {sinal}{fmt(valorItem)}
                      </p>
                      {!isVenda && !isSaque && !isDeposito && t.amount > 0 && (
                        <p className="text-xs text-gray-400">{fmtCO2(t.amount)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Modal Detalhe
          Mobile: bottom sheet | Desktop: centralizado */}
      {detalhe && (
        <div
          className="fixed inset-0 bg-black/45 z-[9999] flex justify-center items-end lg:items-center p-0 lg:p-5"
          onClick={() => setDetalhe(null)}>
          <div
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white w-full shadow-2xl overflow-y-auto rounded-t-3xl lg:rounded-2xl max-h-[90vh] lg:max-h-none p-6 lg:p-8 lg:w-auto lg:max-w-[460px]"
            style={{ animation: "slideIn 0.2s ease-out" }}>

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3.5">
                <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: `${detalhe.cor}15` }}>
                  {detalhe.emoji}
                </div>
                <div>
                  <p className="font-black text-lg text-gray-900">{detalhe.titulo}</p>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold"
                    style={{ background: `${detalhe.cor}15`, color: detalhe.cor }}>
                    {detalhe.isVenda ? "Venda" : detalhe.isSaque ? "Saque" : detalhe.isDeposito ? "Deposito" : "Compra"}
                  </span>
                </div>
              </div>
              <button onClick={() => setDetalhe(null)}
                className="bg-gray-100 border-none rounded-lg w-8 h-8 cursor-pointer flex items-center justify-center text-gray-500 shrink-0">
                ✕
              </button>
            </div>

            {/* Valor destaque */}
            <div className="rounded-2xl px-6 py-5 mb-5 text-center"
              style={{ background: detalhe.isSaque ? "#fff5f5" : "#f0fdf4" }}>
              <p className="text-sm text-gray-400 mb-1">Valor da operacao</p>
              <p className="text-[36px] font-black" style={{ color: detalhe.cor }}>
                {detalhe.sinal}{fmt(detalhe.valorItem)}
              </p>
            </div>

            {/* Detalhes */}
            <div className="flex flex-col gap-2.5">
              {[
                { label: "Data e hora",    value: detalhe.dataStr },
                detalhe.isVenda && detalhe.t.lote      && { label: "Lote",         value: detalhe.t.lote },
                detalhe.isVenda && detalhe.t.comprador && { label: "Comprador",     value: detalhe.t.comprador },
                detalhe.isVenda && detalhe.t.vendedor  && { label: "Vendedor",      value: detalhe.t.vendedor },
                detalhe.isVenda && detalhe.t.quantidade && { label: "Volume",       value: fmtCO2(detalhe.t.quantidade) },
                !detalhe.isVenda && detalhe.t.cert && detalhe.t.cert !== "Operacao" && { label: "Certificadora", value: detalhe.t.cert },
                !detalhe.isVenda && detalhe.t.amount > 0 && { label: "Volume CO2", value: fmtCO2(detalhe.t.amount) },
                !detalhe.isVenda && detalhe.t.price  > 0 && { label: "Preco/tCO2", value: fmt(detalhe.t.price) },
                { label: "Status", value: detalhe.t.status || "pago" },
                detalhe.t.id && !String(detalhe.t.id).startsWith("temp") && { label: "ID", value: String(detalhe.t.id).slice(0, 24) + "..." },
              ].filter(Boolean).map((row: any, i: number) => (
                <div key={i} className="flex justify-between items-center px-3.5 py-2.5 bg-gray-50 rounded-xl">
                  <span className="text-xs text-gray-400 font-semibold">{row.label}</span>
                  <span className="text-sm font-bold text-gray-900 text-right max-w-[240px] break-all">{row.value}</span>
                </div>
              ))}
            </div>

            <button onClick={() => setDetalhe(null)}
              className="w-full mt-5 py-3.5 rounded-xl border-none bg-gray-100 text-gray-700 font-bold text-sm cursor-pointer">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}