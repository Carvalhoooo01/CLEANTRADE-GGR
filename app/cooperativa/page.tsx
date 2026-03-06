"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Btn } from "@/components/ui";

const fmt    = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtCO2 = (v: number) => `${Number(v || 0).toFixed(2)} tCO2`;
const fmtPct = (v: number) => `${Number(v || 0).toFixed(1)}%`;
const COTACAO    = 88.42;
const CAPACIDADE = 100;

export default function CooperativaPage() {
  const { user, lotes, setLotes, showToast } = useApp();

  const [coop,     setCoop]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [lotesSel, setLotesSel] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const recarregar = () => {
    setLoading(true);
    fetch("/api/cooperativa")
      .then(r => r.json())
      .then(data => { if (data?.id) setCoop(data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { recarregar(); }, [user]);

  const lotesCarbon      = coop?.lotesCarbon || [];
  const loteAtivo        = lotesCarbon.find((l: any) => l.quantidade < CAPACIDADE) || lotesCarbon[0];
  const poolTotal        = loteAtivo?.quantidade || 0;
  const contribs         = loteAtivo?.contribuicoes || [];
  const minhasContribs   = contribs.filter((c: any) => c.userId === user?.id);
  const minhaQtd         = minhasContribs.reduce((s: number, c: any) => s + c.quantidade, 0);
  const minhaPct         = poolTotal > 0 ? (minhaQtd / poolTotal) * 100 : 0;
  const minhaReceita     = minhaQtd * COTACAO;
  const espacoDisponivel = CAPACIDADE - poolTotal;

  // Lotes do usuario com disponivel > 0, excluindo CarbonCorp
  const lotesDisponiveis = lotes.filter((l: any) =>
    l.status === "ativo" &&
    (l.quantidade - (l.vendidos || 0)) > 0 &&
    l.certificadora !== "CarbonCorp"
  );

  const handleUnificar = async (loteId: string) => {
    const qtd = parseFloat(lotesSel[loteId]);
    if (!qtd || qtd <= 0) return showToast("Informe uma quantidade valida", "error");
    const lote    = lotes.find((l: any) => l.id === loteId);
    const dispLote = (lote?.quantidade || 0) - (lote?.vendidos || 0);
    if (qtd > dispLote) return showToast(`Disponivel no lote: ${fmtCO2(dispLote)}`, "error");

    setEnviando(true);
    try {
      const res = await fetch("/api/cooperativa/contribuir", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ userId: user.id, loteId, quantidade: qtd }),
      });
      const data = await res.json();

      if (res.ok) {
        // Atualiza o lote no contexto subtraindo a quantidade contribuida
        setLotes((prev: any[]) => prev.map((l: any) =>
          l.id === loteId
            ? { ...l, vendidos: (l.vendidos || 0) + qtd }
            : l
        ));

        const msg = data.data?.loteEncheu
          ? `${fmtCO2(qtd)} adicionados! Lote CarbonCorp cheio — proximo ja foi criado.`
          : `${fmtCO2(qtd)} adicionados ao Pool CarbonCorp!`;
        showToast(msg, "success");
        setLotesSel(prev => ({ ...prev, [loteId]: "" }));
        recarregar();
      } else {
        showToast(data.error || "Erro ao contribuir", "error");
      }
    } catch { showToast("Erro de conexao", "error"); }
    finally  { setEnviando(false); }
  };

  if (loading) return (
    <div className="py-20 text-center text-slate-500">
      <p className="text-3xl mb-3">🌿</p>
      <p>Carregando Pool CarbonCorp...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 pb-10">

      {/* Banner */}
      <div className="rounded-2xl p-7 text-white"
        style={{ background: "linear-gradient(135deg,#064e3b,#065f46)" }}>
        <div className="flex flex-col gap-3 lg:flex-row lg:justify-between lg:items-start">
          <div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 uppercase">
              Pool Coletivo
            </span>
            <h1 className="text-[28px] font-black mt-3">CarbonCorp</h1>
            <p className="opacity-75 text-sm mt-1">
              Varios produtores, 1 lote no marketplace. Receita distribuida proporcional a sua contribuicao.
            </p>
            <p className="text-xs opacity-50 mt-1">Cotacao: {fmt(COTACAO)}/tCO2</p>
          </div>
          <div className="lg:text-right shrink-0">
            <p className="text-xs opacity-60 uppercase font-bold">Lotes ativos</p>
            <p className="text-4xl font-black">{lotesCarbon.length || 0}</p>
            <p className="text-xs opacity-50">{lotesCarbon.length === 0 ? "Seja o primeiro a contribuir" : "no marketplace"}</p>
          </div>
        </div>

        {/* Progress do lote ativo */}
        {loteAtivo && (
          <div className="mt-6 bg-white/5 rounded-xl p-4">
            <div className="flex justify-between text-xs opacity-70 mb-2">
              <span>{loteAtivo.nome} — {poolTotal.toFixed(1)} / {CAPACIDADE} tCO2</span>
              <span>{((poolTotal / CAPACIDADE) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full">
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min((poolTotal / CAPACIDADE) * 100, 100)}%` }} />
            </div>
            <p className="text-xs opacity-50 mt-1.5">
              {espacoDisponivel > 0
                ? `${fmtCO2(espacoDisponivel)} disponiveis para contribuicao`
                : "Lote cheio — aguardando compras para liberar espaco"}
            </p>
          </div>
        )}

        {/* Minha posicao */}
        {minhaQtd > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 bg-white/5 p-4 rounded-xl">
            <div>
              <p className="text-[11px] opacity-60 uppercase">Minha Contribuicao</p>
              <p className="text-lg font-extrabold">{fmtCO2(minhaQtd)}</p>
            </div>
            <div>
              <p className="text-[11px] opacity-60 uppercase">Participacao</p>
              <p className="text-lg font-extrabold">{fmtPct(minhaPct)}</p>
            </div>
            <div>
              <p className="text-[11px] opacity-60 uppercase">Receita Estimada</p>
              <p className="text-lg font-extrabold text-emerald-400">{fmt(minhaReceita)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Como funciona */}
      <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5">
        <p className="font-extrabold text-sky-800 mb-3">Como funciona</p>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {[
            { n: "1", titulo: "Contribua",      desc: "Adicione creditos do seu estoque ao pool CarbonCorp" },
            { n: "2", titulo: "Lote publicado",  desc: "Seus creditos aparecem no marketplace como lote CarbonCorp" },
            { n: "3", titulo: "Comprador paga",  desc: "Qualquer comprador pode adquirir creditos do lote" },
            { n: "4", titulo: "Voce recebe",     desc: `Valor distribuido proporcionalmente a ${fmt(COTACAO)}/tCO2` },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-sky-600 text-white text-xs font-black flex items-center justify-center shrink-0">{s.n}</div>
              <div>
                <p className="text-sm font-bold text-sky-800">{s.titulo}</p>
                <p className="text-xs text-sky-600">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Contribuir */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-extrabold text-base mb-1">Contribuir com Meus Lotes</h3>
          <p className="text-xs text-slate-500 mb-5">
            Os creditos saem do seu inventario e entram no lote CarbonCorp do marketplace.
          </p>

          {lotesDisponiveis.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm">Nenhum lote ativo com saldo disponivel.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {lotesDisponiveis.map((l: any) => {
                const disp = (l.quantidade || 0) - (l.vendidos || 0);
                return (
                  <div key={l.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[13px] font-bold">{l.nome || l.name}</p>
                        <p className="text-[11px] text-slate-500">{l.tipo || l.type} · {l.certificadora || l.cert}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className="text-xs text-green-600 font-bold block">{fmtCO2(disp)} disponivel</span>
                        <span className="text-[10px] text-slate-400">de {fmtCO2(l.quantidade || 0)} total</span>
                      </div>
                    </div>

                    {/* Barra de uso do lote */}
                    <div className="mb-3">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-500 transition-all"
                          style={{ width: `${Math.min(((l.vendidos || 0) / (l.quantidade || 1)) * 100, 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {fmtCO2(l.vendidos || 0)} ja alocados ({(((l.vendidos || 0) / (l.quantidade || 1)) * 100).toFixed(0)}%)
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input type="number" placeholder="Qtd tCO2" min="0.01" step="0.01" max={disp}
                        value={lotesSel[l.id] || ""}
                        onChange={e => setLotesSel(prev => ({ ...prev, [l.id]: e.target.value }))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-[13px] outline-none focus:border-green-500" />
                      <Btn small onClick={() => handleUnificar(l.id)} disabled={enviando}>
                        Adicionar ao Pool
                      </Btn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Composicao do lote ativo */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200">
          <h3 className="font-extrabold text-base mb-1">Composicao do Lote Ativo</h3>
          <p className="text-xs text-slate-500 mb-5">Produtores que contribuiram para o lote atual.</p>

          {contribs.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-3xl mb-2">⏳</p>
              <p className="text-sm">Aguardando contribuicoes...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {contribs.slice(0, 10).map((c: any, i: number) => {
                const pct    = poolTotal > 0 ? (c.quantidade / poolTotal) * 100 : 0;
                const isVoce = c.userId === user?.id;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className={`font-semibold ${isVoce ? "text-green-600" : "text-slate-600"}`}>
                        {isVoce ? "Voce" : (c.user?.nome || "Produtor")}
                      </span>
                      <div className="text-right">
                        <span className="text-slate-500">{fmtCO2(c.quantidade)}</span>
                        <span className="text-slate-400 ml-1.5">{fmtPct(pct)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: isVoce ? "#16a34a" : "#0ea5e9" }} />
                    </div>
                    {isVoce && (
                      <p className="text-[10px] text-green-600 mt-0.5">
                        Receita estimada: {fmt(c.quantidade * COTACAO)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Todos os lotes */}
          {lotesCarbon.length > 1 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 mb-2">Todos os lotes CarbonCorp</p>
              <div className="flex flex-col gap-1.5">
                {lotesCarbon.map((l: any) => (
                  <div key={l.id} className="flex justify-between text-xs">
                    <span className="text-slate-600">{l.nome}</span>
                    <span className="text-slate-400">{fmtCO2(l.quantidade - (l.vendidos || 0))} disponivel</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}