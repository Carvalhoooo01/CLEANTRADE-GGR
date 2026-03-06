"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { fmt, fmtCO2 } from "@/data/constants";
import Link from "next/link";
import PixDeposito from "@/components/PixDeposito";

const TIPO_LABEL: Record<string, { emoji: string; label: string; cor: string }> = {
  saque:          { emoji: "💸", label: "Saque",          cor: "#ef4444" },
  deposito:       { emoji: "💵", label: "Deposito",       cor: "#16a34a" },
  BUY:            { emoji: "🌿", label: "Compra",         cor: "#0ea5e9" },
  SELL:           { emoji: "💰", label: "Venda",          cor: "#16a34a" },
  venda_coletiva: { emoji: "🤝", label: "Venda Coletiva", cor: "#8b5cf6" },
};

export default function FinanceiroPage() {
  const { user, role, balance, setBalance, transactions, setTx, vendas, showToast } = useApp();

  const [aba,        setAba]        = useState("extrato");
  const [detalhe,    setDetalhe]    = useState<any>(null);
  const [pixModal,   setPixModal]   = useState(false); // modal PIX

  const isVendedor = role === "vendedor";

  const metricas = useMemo(() => {
    const receitaTotal    = vendas?.reduce((s: number, v: any) => s + (v.total || v.valorTotal || 0), 0) || 0;
    const gastoTotal      = transactions?.filter((t: any) => t.type === "BUY").reduce((s: number, t: any) => s + (t.total || 0), 0) || 0;
    const totalTransacoes = transactions?.length || 0;
    return { receitaTotal, gastoTotal, totalTransacoes };
  }, [transactions, vendas]);

  const dadosGrafico = useMemo(() => {
    const ultimos30d = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toLocaleDateString("pt-BR").slice(0, 5);
    }).reverse();
    return ultimos30d.map(data => {
      const dia = transactions?.filter((t: any) => t.date?.startsWith(data) && (t.type === "BUY" || t.type === "SELL")) || [];
      return {
        data,
        entradas: dia.filter((t: any) => t.type === "SELL").reduce((s: number, t: any) => s + (t.total || 0), 0),
        saidas:   dia.filter((t: any) => t.type === "BUY" ).reduce((s: number, t: any) => s + (t.total || 0), 0),
      };
    });
  }, [transactions]);

  const maxValor = Math.max(...dadosGrafico.flatMap(d => [d.entradas, d.saidas]), 1);

  return (
    <div className="flex flex-col gap-6 pb-10 font-[Inter,system-ui,sans-serif] px-4 sm:px-0">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Financeiro</h1>
          <p className="text-sm text-gray-400">Gestao de saldo e transacoes</p>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-green-600 flex items-center gap-1">
          &larr; Voltar ao Dashboard
        </Link>
      </div>

      {/* Cards de saldo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-2xl p-6 text-white">
          <p className="text-sm opacity-90 mb-2">Saldo Disponivel</p>
          <p className="text-3xl font-black mb-3">{fmt(balance)}</p>
          <button
            onClick={() => isVendedor ? setAba("operacao") : setPixModal(true)}
            className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/30 transition-colors border-none cursor-pointer text-white">
            + {isVendedor ? "Solicitar Saque" : "Depositar via PIX"}
          </button>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Total Recebido</p>
          <p className="text-2xl font-bold text-green-600 mb-2">{fmt(metricas.receitaTotal)}</p>
          <p className="text-xs text-gray-400">{vendas?.length || 0} vendas realizadas</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Total em Compras</p>
          <p className="text-2xl font-bold text-blue-600 mb-2">{fmt(metricas.gastoTotal)}</p>
          <p className="text-xs text-gray-400">{metricas.totalTransacoes} transacoes</p>
        </div>
      </div>

      {/* Grafico */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div>
            <h3 className="font-extrabold text-lg">Fluxo Financeiro</h3>
            <p className="text-xs text-gray-400">Ultimos 30 dias</p>
          </div>
          <div className="flex gap-4 text-xs">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full" /><span>Entradas</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-400 rounded-full" /><span>Saidas</span></div>
          </div>
        </div>
        <div className="h-48 flex items-end gap-1 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {dadosGrafico.map((dia, i) => (
            <div key={i} className="flex-1 min-w-[30px] flex flex-col items-center gap-1">
              <div className="w-full flex flex-col gap-0.5">
                <div className="w-full bg-green-500 rounded-t-sm transition-all duration-300"
                  style={{ height: `${(dia.entradas / maxValor) * 120}px` }} />
                <div className="w-full bg-red-400 rounded-b-sm transition-all duration-300"
                  style={{ height: `${(dia.saidas / maxValor) * 120}px` }} />
              </div>
              <span className="text-[8px] text-gray-400 rotate-45 origin-left">{dia.data}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Abas */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-none">
          {[
            { id: "extrato",  label: "Extrato",                                 icon: "📋" },
            { id: "operacao", label: isVendedor ? "Saque" : "Deposito via PIX", icon: "💳" },
            { id: "resumo",   label: "Resumo",                                  icon: "📊" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 border-none cursor-pointer bg-transparent
                ${aba === tab.id ? "text-green-600 border-b-2 border-green-600" : "text-gray-400 hover:text-gray-600"}`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
          {aba === "extrato"  && <ExtratoView  transactions={transactions} vendas={vendas} isVendedor={isVendedor} onDetalhe={setDetalhe} />}
          {aba === "operacao" && <OperacaoView isVendedor={isVendedor} balance={balance} setBalance={setBalance} setTx={setTx} showToast={showToast} user={user} onAbrirPix={() => setPixModal(true)} />}
          {aba === "resumo"   && <ResumoView   transactions={transactions} vendas={vendas} metricas={metricas} />}
        </div>
      </div>

      {detalhe && <DetalheModal detalhe={detalhe} onClose={() => setDetalhe(null)} />}

      {/* Modal PIX — abre ao clicar no botao do card ou na aba */}
      {pixModal && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex items-end lg:items-center justify-center p-0 lg:p-5"
          onClick={() => setPixModal(false)}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white w-full rounded-t-3xl lg:rounded-2xl max-h-[92vh] overflow-y-auto p-6 lg:p-8 lg:max-w-[460px]">
            <PixDeposito onClose={() => setPixModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Extrato ───────────────────────────────────────────────────────────────────
function ExtratoView({ transactions, vendas, isVendedor, onDetalhe }: any) {
  const listaExtrato = useMemo(() => {
    if (isVendedor) {
      const financeiras      = (transactions || []).filter((t: any) => ["saque","deposito","venda_coletiva"].includes(t.type));
      const vendasFormatadas = (vendas || []).map((v: any) => ({ ...v, _tipo: "venda", date: v.data || v.date, total: v.total || v.valorTotal || 0 }));
      return [...vendasFormatadas, ...financeiras].sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
    }
    return transactions || [];
  }, [isVendedor, transactions, vendas]);

  if (listaExtrato.length === 0) return (
    <div className="text-center py-12">
      <p className="text-4xl mb-3">📭</p>
      <p className="text-gray-400 mb-2">Nenhuma transacao encontrada</p>
      <p className="text-xs text-gray-300">Suas movimentacoes aparecerao aqui</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {listaExtrato.map((t: any, i: number) => {
        const tipo    = t.type || t._tipo || "BUY";
        const config  = TIPO_LABEL[tipo] || { emoji: "💳", label: tipo, cor: "#6b7280" };
        const ehSaida = tipo === "saque" || tipo === "BUY";
        const valor   = t.total || t.valorTotal || 0;
        const titulo  = tipo === "saque"         ? "Saque"
                      : tipo === "deposito"       ? "Deposito PIX"
                      : tipo === "BUY"            ? "Compra de Creditos"
                      : tipo === "venda_coletiva" ? "Venda Coletiva"
                      : tipo === "venda" || t._tipo === "venda" ? `Venda - ${t.lote || "Lote"}`
                      : "Transacao";
        return (
          <div key={t.id || i} onClick={() => onDetalhe({ t, tipo, config, ehSaida, valor })}
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: `${config.cor}15` }}>
              {config.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{titulo}</p>
              <p className="text-xs text-gray-400">{t.date || t.data || "-"}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-extrabold text-sm" style={{ color: ehSaida ? "#ef4444" : config.cor }}>
                {ehSaida ? "-" : "+"}{fmt(valor)}
              </p>
              <span className="text-[10px] px-2 py-0.5 rounded-full hidden sm:inline"
                style={{ background: `${config.cor}15`, color: config.cor }}>
                {config.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Operacao ──────────────────────────────────────────────────────────────────
function OperacaoView({ isVendedor, balance, setBalance, setTx, showToast, user, onAbrirPix }: any) {
  const [valor,    setValor]    = useState("");
  const [salvando, setSalvando] = useState(false);

  const handleSaque = async () => {
    const num = parseFloat(String(valor).replace(/\./g, "").replace(",", "."));
    if (!num || num <= 0) return showToast("Informe um valor valido.", "error");
    if (num > balance)    return showToast("Saldo insuficiente.", "error");

    const novoSaldo = balance - num;
    const dateStr   = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR").slice(0, 5);
    const tempId    = `saque-${Date.now()}`;

    setBalance(novoSaldo);
    setTx((prev: any[]) => [{ id: tempId, type: "saque", cert: "PIX", date: dateStr, amount: 0, price: 0, total: num, status: "pago" }, ...(prev || [])]);
    setValor("");
    showToast(`Saque de ${fmt(num)} solicitado!`, "success");

    setSalvando(true);
    try {
      await fetch("/api/usuarios/saldo", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, saldo: novoSaldo }) });
      await fetch("/api/transacoes",      { method: "POST",  headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, type: "saque", cert: "PIX", amount: 0, price: 0, total: num, status: "pago" }) });
      const saved = sessionStorage.getItem("cleantrade_user");
      if (saved) { const p = JSON.parse(saved); p.saldo = novoSaldo; sessionStorage.setItem("cleantrade_user", JSON.stringify(p)); }
    } catch {
      showToast("Erro ao sincronizar.", "error");
      setBalance(balance);
      setTx((prev: any[]) => prev.filter((t: any) => t.id !== tempId));
    } finally { setSalvando(false); }
  };

  // Comprador: botao que abre o modal PIX
  if (!isVendedor) return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="text-5xl">💳</div>
      <p className="font-bold text-lg text-gray-800">Depositar via PIX</p>
      <p className="text-sm text-gray-400 text-center max-w-xs">Gere um QR Code PIX e deposite instantaneamente na sua carteira CleanTrade.</p>
      <button onClick={onAbrirPix}
        className="px-8 py-4 rounded-xl bg-green-600 text-white font-bold text-sm cursor-pointer border-none hover:bg-green-700 transition-colors">
        Gerar QR Code PIX
      </button>
    </div>
  );

  // Vendedor: saque
  return (
    <div className="max-w-md mx-auto">
      <p className="font-bold text-lg mb-1">Solicitar Saque</p>
      <p className="text-gray-500 text-sm mb-5">Transfira seus lucros para sua conta PIX cadastrada.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {[500, 1000, 5000, 10000].map(v => (
          <button key={v} onClick={() => setValor(String(v))}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer border-none
              ${valor === String(v) ? "bg-sky-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {fmt(v)}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
          <input type="text" inputMode="decimal" value={valor}
            onChange={e => setValor(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="0,00"
            className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 text-lg font-bold outline-none focus:border-sky-500" />
        </div>
        <button onClick={handleSaque} disabled={salvando}
          className="w-full py-4 rounded-xl bg-sky-600 text-white font-bold text-sm disabled:opacity-70 hover:bg-sky-700 transition-colors border-none cursor-pointer">
          {salvando ? "Processando..." : "Solicitar Saque"}
        </button>
      </div>
      <p className="text-xs text-gray-300 mt-4 text-center">O saque sera processado em ate 1 dia util.</p>
    </div>
  );
}

// ── Resumo ────────────────────────────────────────────────────────────────────
function ResumoView({ transactions, vendas, metricas }: any) {
  const meses = useMemo(() => {
    const mapa: Record<string, { receitas: number; despesas: number }> = {};
    [...(transactions || []), ...(vendas || [])].forEach((t: any) => {
      const partes = (t.data || t.date || "").split(" ")[0]?.split("/");
      if (!partes || partes.length < 3) return;
      const chave = `${partes[1]}/${partes[2]}`;
      if (!mapa[chave]) mapa[chave] = { receitas: 0, despesas: 0 };
      const valor = t.total || t.valorTotal || 0;
      const tipo  = t.type || t._tipo;
      if (["SELL","venda","deposito"].includes(tipo)) mapa[chave].receitas += valor;
      else if (["BUY","saque"].includes(tipo))        mapa[chave].despesas += valor;
    });
    return Object.entries(mapa).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [transactions, vendas]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 p-4 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Media de Receitas</p>
          <p className="text-xl font-bold text-green-600">{fmt(metricas.receitaTotal / (vendas?.length || 1))}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl">
          <p className="text-xs text-gray-500 mb-1">Media de Compras</p>
          <p className="text-xl font-bold text-blue-600">{fmt(metricas.gastoTotal / (transactions?.length || 1))}</p>
        </div>
      </div>
      <div>
        <p className="font-bold text-sm mb-3">Resumo Mensal</p>
        <div className="flex flex-col gap-2">
          {meses.map(([mes, valores]: [string, any]) => (
            <div key={mes} className="flex items-center gap-2 text-sm">
              <span className="w-12 text-xs text-gray-400 shrink-0">{mes}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full"
                  style={{ width: `${(valores.receitas / (metricas.receitaTotal || 1)) * 100}%` }} />
              </div>
              <span className="text-xs font-bold text-green-600 shrink-0">{fmt(valores.receitas)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Modal Detalhe ─────────────────────────────────────────────────────────────
function DetalheModal({ detalhe, onClose }: any) {
  const { t, tipo, config, ehSaida, valor } = detalhe;
  return (
    <div className="fixed inset-0 bg-black/45 z-[9998] flex items-end lg:items-center justify-center p-0 lg:p-5"
      onClick={onClose}>
      <div onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="bg-white w-full rounded-t-3xl lg:rounded-2xl max-h-[90vh] overflow-y-auto p-6 lg:p-8 lg:max-w-[460px]">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: `${config.cor}15` }}>
              {config.emoji}
            </div>
            <div>
              <p className="font-black text-lg">Detalhes da Transacao</p>
              <span className="text-xs px-2 py-1 rounded-full"
                style={{ background: `${config.cor}15`, color: config.cor }}>
                {config.label}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-100 border-none cursor-pointer flex items-center justify-center text-gray-500">✕</button>
        </div>
        <div className={`p-6 rounded-xl mb-5 text-center ${ehSaida ? "bg-red-50" : "bg-green-50"}`}>
          <p className="text-sm text-gray-500 mb-2">Valor</p>
          <p className="text-3xl font-black" style={{ color: ehSaida ? "#ef4444" : config.cor }}>
            {ehSaida ? "-" : "+"}{fmt(valor)}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { label: "Data",           value: t.date || t.data },
            { label: "Tipo",           value: config.label },
            { label: "Descricao",      value: t.descricao || t.detalhe || "-" },
            t.amount > 0 && { label: "Volume CO2",     value: fmtCO2(t.amount) },
            t.price  > 0 && { label: "Preco unitario", value: fmt(t.price) },
            t.comprador  && { label: "Comprador",       value: t.comprador },
            t.vendedor   && { label: "Vendedor",        value: t.vendedor },
            { label: "Status",         value: t.status || "Concluido" },
          ].filter(Boolean).map((item: any, i: number) => (
            <div key={i} className="flex justify-between items-center py-2.5 px-3.5 bg-gray-50 rounded-[10px]">
              <span className="text-xs text-gray-400 font-semibold">{item.label}</span>
              <span className="text-[13px] font-bold text-gray-900 text-right max-w-[240px] break-all">{item.value}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose}
          className="w-full mt-5 py-3.5 rounded-xl border-none bg-gray-100 text-gray-700 font-bold text-sm cursor-pointer">
          Fechar
        </button>
      </div>
    </div>
  );
}