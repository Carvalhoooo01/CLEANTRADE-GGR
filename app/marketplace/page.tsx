"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { fmt, fmtCO2 } from "@/data/constants";
import Link from "next/link";

function Modal({ onClose, children }: any) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e: any) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-2xl p-6 sm:p-8 w-full sm:max-w-[440px] shadow-2xl max-h-[92vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

const TIPOS = ["Todos", "Florestal", "Agricola", "Energia", "Industrial", "Coletivo"];

export default function MarketplacePage() {
  const { user, market, setMarket, balance, setBalance, setTx, setVendas, setCerts, showToast } = useApp();

  const [buying,     setBuying]     = useState<any>(null);
  const [qty,        setQty]        = useState("1");
  const [loading,    setLoading]    = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success,    setSuccess]    = useState<any>(null);
  const [error,      setError]      = useState(false);
  const [busca,      setBusca]      = useState("");
  const [tipoFiltro, setTipoFiltro] = useState("Todos");
  const [ordenar,    setOrdenar]    = useState("preco_asc");
  const [refreshing, setRefreshing] = useState(false);

  const fecharTudo = () => { setBuying(null); setQty("1"); setConfirming(false); setSuccess(null); setError(false); };

  // Busca marketplace do servidor
  const refreshMarket = useCallback(async (silencioso = true) => {
    if (!silencioso) setRefreshing(true);
    try {
      const res  = await fetch("/api/marketplace");
      const data = await res.json();
      if (Array.isArray(data)) setMarket(data);
    } catch {}
    finally { setRefreshing(false); }
  }, [setMarket]);

  // Carrega ao montar e atualiza a cada 30s
  useEffect(() => {
    refreshMarket(false);
    const interval = setInterval(() => refreshMarket(true), 30000);
    return () => clearInterval(interval);
  }, [refreshMarket]);

  const handleBuy = async () => {
    const q = parseFloat(qty);
    if (!q || q <= 0)         return showToast("Quantidade invalida", "error");
    if (q > buying.available) return showToast("Quantidade maior que o disponivel", "error");
    const total = q * buying.price;
    if (total > balance)      return showToast("Saldo insuficiente", "error");

    setLoading(true);
    try {
      const res = await fetch("/api/marketplace/buy", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          compradorId:   user.id,
          vendedorId:    buying.vendedorId,
          loteId:        buying.id,
          quantidade:    q,
          precoUnitario: buying.price,
          total,
          tipo:          buying.type || buying.tipo,
          cert:          buying.cert || buying.certificadora,
          isCoop:        buying.isCoop,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(true); setConfirming(false); return; }

      setBalance(data.novoSaldo);
      if (data.transacao)            setTx((t: any[]) => [data.transacao, ...t]);
      if (data.venda)                setVendas((vs: any[]) => [data.venda, ...vs]);
      if (data.certificados?.length) setCerts((cs: any[]) => [...data.certificados, ...cs]);

      // Atualiza disponivel ou remove se esgotado
      setMarket((m: any[]) =>
        m.map(item => item.id === buying.id ? { ...item, available: item.available - q } : item)
          .filter(item => (item.available || 0) > 0)
      );

      setSuccess({ qty: q, total });
      setConfirming(false);

      // Refresh silencioso para sincronizar com servidor
      setTimeout(() => refreshMarket(true), 1500);
    } catch {
      setError(true);
      setConfirming(false);
    } finally { setLoading(false); }
  };

  const marketFiltrado = useMemo(() => {
    let lista = market.filter((i: any) => (i.available || 0) > 0); // garante sem esgotados
    if (busca)                lista = lista.filter((i: any) => (i.name || "").toLowerCase().includes(busca.toLowerCase()) || (i.cert || "").toLowerCase().includes(busca.toLowerCase()));
    if (tipoFiltro !== "Todos") lista = lista.filter((i: any) => (i.type || "").toLowerCase().includes(tipoFiltro.toLowerCase()));
    if (ordenar === "preco_asc")  lista = [...lista].sort((a, b) => a.price - b.price);
    if (ordenar === "preco_desc") lista = [...lista].sort((a, b) => b.price - a.price);
    if (ordenar === "vol_desc")   lista = [...lista].sort((a, b) => (b.available || 0) - (a.available || 0));
    return lista;
  }, [market, busca, tipoFiltro, ordenar]);

  const totalDisponivel = marketFiltrado.reduce((s: number, i: any) => s + (i.available || 0), 0);
  const precoMedio      = marketFiltrado.length ? marketFiltrado.reduce((s: number, i: any) => s + i.price, 0) / marketFiltrado.length : 0;
  const menorPreco      = marketFiltrado.length ? Math.min(...marketFiltrado.map((i: any) => i.price)) : 0;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 pb-10 font-[Inter,system-ui,sans-serif] px-4 sm:px-0">

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg,#064e3b 0%,#065f46 60%,#047857 100%)" }}
        className="rounded-2xl px-4 sm:px-8 py-5 sm:py-7 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-xs font-semibold opacity-70 tracking-widest uppercase mb-1.5">Mercado de Carbono Verificado</p>
            <h1 className="text-xl sm:text-2xl font-extrabold mb-1">Marketplace de Creditos</h1>
            <p className="text-xs sm:text-sm opacity-80">Adquira creditos certificados de produtores verificados</p>
          </div>
          <button onClick={() => refreshMarket(false)} disabled={refreshing}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-bold cursor-pointer disabled:opacity-50 shrink-0">
            {refreshing ? "Atualizando..." : "⟳ Atualizar"}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: "Oferta disponivel", value: fmtCO2(totalDisponivel) },
            { label: "Preco medio",       value: `R$ ${precoMedio.toFixed(2)}/t` },
            { label: "Menor preco",       value: `R$ ${menorPreco.toFixed(2)}/t` },
            { label: "Lotes ativos",      value: marketFiltrado.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5">
              <p className="text-base sm:text-xl font-extrabold">{value}</p>
              <p className="text-[10px] sm:text-xs opacity-65 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por nome ou certificadora..."
            className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-white outline-none box-border" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {TIPOS.map(t => (
            <button key={t} onClick={() => setTipoFiltro(t)}
              className="px-3 py-2 rounded-lg text-xs cursor-pointer whitespace-nowrap shrink-0 transition-all"
              style={{
                border:      `1px solid ${tipoFiltro === t ? "#16a34a" : "#e5e7eb"}`,
                background:  tipoFiltro === t ? "#f0fdf4" : "#fff",
                color:       tipoFiltro === t ? "#16a34a" : "#6b7280",
                fontWeight:  tipoFiltro === t ? 700 : 500,
              }}>
              {t}
            </button>
          ))}
        </div>
        <select value={ordenar} onChange={e => setOrdenar(e.target.value)}
          className="py-2.5 px-3 border border-gray-200 rounded-xl text-sm bg-white text-gray-700 cursor-pointer outline-none w-full sm:w-auto">
          <option value="preco_asc">Menor preco</option>
          <option value="preco_desc">Maior preco</option>
          <option value="vol_desc">Maior volume</option>
        </select>
      </div>

      <p className="text-sm text-gray-500">
        {marketFiltrado.length === 0 ? "Nenhum resultado" : `${marketFiltrado.length} lote${marketFiltrado.length !== 1 ? "s" : ""} encontrado${marketFiltrado.length !== 1 ? "s" : ""}`}
      </p>

      {/* Grid */}
      {marketFiltrado.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-3xl mb-3">🌿</p>
          <p className="text-base font-semibold text-gray-700 mb-1.5">Nenhum credito encontrado</p>
          <p className="text-sm text-gray-400">Tente ajustar os filtros ou aguarde novos lotes.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {marketFiltrado.map((item: any) => (
            <div key={item.id} className="bg-white rounded-2xl overflow-hidden relative transition-all"
              style={{ border: item.isCoop ? "2px solid #16a34a" : "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}>

              {item.isCoop && (
                <div className="absolute top-2.5 right-2.5 bg-green-600 text-white text-[9px] font-black px-2 py-0.5 rounded-[10px] z-10">
                  COLETIVO
                </div>
              )}

              <div className="px-4 py-3.5 border-b border-green-100 flex justify-between items-center"
                style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
                <div>
                  <p className="text-xs font-bold text-green-700 uppercase tracking-wide">{item.type || "Florestal"}</p>
                  <p className="text-base font-extrabold text-gray-900 mt-0.5">{item.name}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white text-green-600 border border-green-200">ATIVO</span>
              </div>

              <div className="p-4 flex flex-col gap-2">
                {[
                  ["Certificadora", item.cert],
                  ["Tipo", item.type || "Florestal"],
                  item.isCoop && item.produtores ? ["Produtores", `${item.produtores} no pool`] : ["Origem", "Estoque Verificado"],
                ].filter(Boolean).map(([k, v]: any) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{k}</span>
                    <span className="text-xs font-semibold text-gray-700">{v}</span>
                  </div>
                ))}

                <div className="h-px bg-gray-100 my-1" />

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Disponivel</p>
                    <p className="text-[15px] font-extrabold text-green-600">{fmtCO2(item.available)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 mb-0.5">Preco</p>
                    <p className="text-[15px] font-extrabold text-gray-900">
                      R$ {(item.price || 0).toFixed(2)}<span className="text-xs font-medium text-gray-400">/tCO₂</span>
                    </p>
                  </div>
                </div>

                <button onClick={() => { setBuying(item); setQty("1"); setConfirming(false); setSuccess(null); }}
                  className="mt-2 w-full py-3 rounded-xl border-none bg-green-600 text-white font-bold text-sm cursor-pointer hover:bg-green-700 transition-colors">
                  {item.isCoop ? "Comprar do Pool" : "Comprar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal compra */}
      {buying && !success && (
        <Modal onClose={fecharTudo}>
          <div className="flex justify-between items-center mb-5">
            <p className="text-lg font-bold">{buying.name}</p>
            <button onClick={fecharTudo} className="bg-transparent border-none text-xl cursor-pointer text-gray-400">✕</button>
          </div>

          <div className="bg-green-50 rounded-xl p-3.5 mb-4">
            <div className="flex justify-between mb-1.5">
              <span className="text-sm text-gray-500">Preco unitario</span>
              <span className="text-sm font-bold text-green-700">{fmt(buying.price)}/tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Disponivel</span>
              <span className="text-sm font-semibold">{fmtCO2(buying.available)}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Quantidade (tCO₂)</label>
            <input type="number" min="0.1" step="0.1" max={buying.available} value={qty}
              onChange={e => setQty(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none box-border" />
          </div>

          <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 mb-5">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Subtotal</span>
              <span className="text-sm font-semibold">{fmt((parseFloat(qty) || 0) * buying.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Saldo apos compra</span>
              <span className="text-sm font-bold" style={{ color: balance - (parseFloat(qty) || 0) * buying.price < 0 ? "#dc2626" : "#16a34a" }}>
                {fmt(balance - (parseFloat(qty) || 0) * buying.price)}
              </span>
            </div>
          </div>

          {!confirming ? (
            <div className="flex gap-2.5">
              <button onClick={fecharTudo} className="flex-1 py-3 rounded-xl border border-gray-200 bg-white font-bold text-sm cursor-pointer">Cancelar</button>
              <button onClick={() => setConfirming(true)} className="flex-1 py-3 rounded-xl border-none bg-green-600 text-white font-bold text-sm cursor-pointer hover:bg-green-700">Comprar</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-center">
                <p className="text-sm font-bold text-amber-800 mb-1">⚠️ Confirmar compra?</p>
                <p className="text-sm text-amber-900"><strong>{fmtCO2(parseFloat(qty) || 0)}</strong> por <strong>{fmt((parseFloat(qty) || 0) * buying.price)}</strong></p>
                <p className="text-xs text-amber-700 mt-1">Esta acao nao pode ser desfeita.</p>
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => setConfirming(false)} className="flex-1 py-3 rounded-xl border border-gray-200 bg-white font-bold text-sm cursor-pointer">Voltar</button>
                <button onClick={handleBuy} disabled={loading}
                  className="flex-1 py-3 rounded-xl border-none bg-green-600 text-white font-bold text-sm cursor-pointer disabled:opacity-70">
                  {loading ? "Processando..." : "✅ Confirmar"}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Modal sucesso */}
      {success && (
        <div className="fixed inset-0 bg-black/40 z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-9 w-full max-w-[440px] shadow-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-50 rounded-full p-5">
                <svg width="64" height="64" fill="none" stroke="#16a34a" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold mb-2">Compra Realizada!</p>
            <p className="text-sm text-gray-500 mb-7 leading-7">
              <strong className="text-green-600">{fmtCO2(success.qty)}</strong> adquiridos por <strong>{fmt(success.total)}</strong>.<br />
              Creditos disponiveis no seu inventario.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link href="/certificados" onClick={fecharTudo}
                className="block py-3.5 rounded-xl bg-green-600 text-white font-bold text-[15px] no-underline hover:bg-green-700 text-center">
                Ver Meus Creditos
              </Link>
              <button onClick={fecharTudo}
                className="py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold text-[15px] cursor-pointer">
                Continuar Comprando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal erro */}
      {error && (
        <div className="fixed inset-0 bg-black/40 z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-9 w-full max-w-[440px] shadow-2xl text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-red-50 rounded-full p-5">
                <svg width="64" height="64" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-extrabold mb-2">Falha na Compra</p>
            <p className="text-sm text-gray-500 mb-7">Verifique se ha volume disponivel e tente novamente.</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => setError(false)} className="py-3.5 rounded-xl border-none bg-green-600 text-white font-bold cursor-pointer">Tentar Novamente</button>
              <Link href="/" className="block py-3.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-bold no-underline text-center">Voltar ao Dashboard</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}