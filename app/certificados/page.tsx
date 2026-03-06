"use client";
import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";

const STATUS_CORES = {
  disponivel:  "#16a34a",
  transferido: "#6b7280",
  reservado:   "#8b5cf6",
};
const STATUS_LABEL = {
  disponivel:  "Disponivel",
  transferido: "Transferido",
  reservado:   "Reservado p/ Compensacao",
};
const STATUS_EMOJI = {
  disponivel:  "🔓",
  transferido: "🔒",
  reservado:   "♻️",
};

export default function CertificadosPage() {
  const { certs, setCerts, user, showToast, ready } = useApp();

  const [filter,   setFilter]   = useState("todos");
  const [fetching, setFetching] = useState(false);
  const [loading,  setLoading]  = useState<string | null>(null);
  const [detalhe,  setDetalhe]  = useState<any>(null);
  const [viewMode, setViewMode] = useState<"lote" | "individual">("lote");

  useEffect(() => {
    if (!ready || !user?.id) return;
    setFetching(true);
    fetch(`/api/certificados?userId=${user.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setCerts(data); })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [ready, user?.id]);

  // Agrupa por loteId
  const lotesAgrupados = useMemo(() => {
    const mapa: Record<string, any[]> = {};
    certs.forEach((c: any) => {
      const chave = c.loteId || c.projectId || "sem-lote";
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(c);
    });
    return Object.entries(mapa).map(([loteId, lista]) => ({
      loteId,
      nome:         lista[0]?.nomeLote || lista[0]?.projectId || loteId.slice(0, 8).toUpperCase(),
      total:        lista.length,
      disponiveis:  lista.filter((c: any) => c.status === "disponivel").length,
      reservados:   lista.filter((c: any) => c.status === "reservado").length,
      transferidos: lista.filter((c: any) => c.status === "transferido").length,
      certs:        lista,
      standard:     lista[0]?.standard || "VCS",
      year:         lista[0]?.year || "-",
    }));
  }, [certs]);

  const filtered = filter === "todos" ? certs : certs.filter((c: any) => c.status === filter);

  const handleAlterarStatus = async (cert: any, novoStatus: string) => {
    setLoading(cert.id + novoStatus);
    try {
      const res = await fetch("/api/certificados", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: cert.id, status: novoStatus }),
      });
      if (!res.ok) throw new Error();
      const atualizado = await res.json();
      setCerts((prev: any[]) => prev.map((c: any) => c.id === cert.id ? atualizado : c));
      setDetalhe(atualizado);
      showToast("Status atualizado!", "success");
    } catch {
      showToast("Erro ao atualizar status.", "error");
    } finally { setLoading(null); }
  };

  // Altera status de TODOS os certs disponiveis/reservados de um lote
  const handleAlterarLote = async (loteId: string, novoStatus: string) => {
    const alvo = certs.filter((c: any) =>
      (c.loteId || c.projectId || "sem-lote") === loteId &&
      c.status !== "transferido" &&
      c.status !== novoStatus
    );
    if (alvo.length === 0) return showToast("Nenhum certificado para alterar.", "error");

    setLoading(loteId + novoStatus);
    try {
      const resultados = await Promise.all(
        alvo.map((c: any) =>
          fetch("/api/certificados", {
            method:  "PATCH",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ id: c.id, status: novoStatus }),
          }).then(r => r.json())
        )
      );
      setCerts((prev: any[]) =>
        prev.map((c: any) => resultados.find((r: any) => r.id === c.id) || c)
      );
      showToast(`${alvo.length} certificados ${novoStatus === "reservado" ? "reservados" : "liberados"}!`, "success");
    } catch {
      showToast("Erro ao atualizar lote.", "error");
    } finally { setLoading(null); }
  };

  const handleDownloadDiploma = async (cert: any) => {
    try {
      showToast("Gerando diploma...", "info");
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a5" });
      doc.setDrawColor(22, 163, 74); doc.setLineWidth(2); doc.rect(5, 5, 200, 138);
      doc.setFontSize(20); doc.setTextColor(22, 163, 74);
      doc.text("CERTIFICADO DE ATIVO AMBIENTAL", 105, 28, { align: "center" });
      doc.setFontSize(11); doc.setTextColor(60, 60, 60);
      doc.text("Este documento certifica que o ativo abaixo foi verificado e registrado.", 105, 42, { align: "center" });
      doc.setFontSize(10); doc.setTextColor(30, 30, 30);
      const lines = [
        ["ID DO CREDITO:", cert.serial], ["PROPRIETARIO:", user?.nome || "-"],
        ["PADRAO:", `${cert.standard} (${cert.country})`], ["SAFRA:", cert.year],
        ["PROJETO:", cert.projectId], ["VOLUME:", "1.000 KG (1 Tonelada de CO2e)"],
        ["STATUS:", STATUS_LABEL[cert.status as keyof typeof STATUS_LABEL] || cert.status],
        ["EMISSAO:", cert.date || "-"],
      ];
      lines.forEach(([label, value], i) => {
        doc.setFont("helvetica", "bold"); doc.text(label, 20, 60 + i * 9);
        doc.setFont("helvetica", "normal"); doc.text(value, 75, 60 + i * 9);
      });
      doc.setDrawColor(22, 163, 74); doc.circle(173, 95, 16);
      doc.setFontSize(7); doc.setTextColor(22, 163, 74);
      doc.text("VERIFICADO", 173, 93, { align: "center" });
      doc.text("ORIGINAL", 173, 99, { align: "center" });
      doc.save(`Diploma_${cert.serial}.pdf`);
      showToast("Diploma baixado!", "success");
    } catch { showToast("Erro ao gerar PDF.", "error"); }
  };

  if (!ready || fetching) return (
    <div className="py-20 text-center text-gray-500">
      <p className="text-3xl mb-3">🌿</p><p>Carregando certificados...</p>
    </div>
  );

  const corDetalhe = STATUS_CORES[detalhe?.status as keyof typeof STATUS_CORES] || "#6b7280";

  return (
    <div className="flex flex-col gap-5 pb-10">

      {/* Banner */}
      <div className="rounded-2xl p-7 text-white" style={{ background: "linear-gradient(135deg,#16a34a,#14532d)" }}>
        <h2 className="text-2xl font-extrabold mb-1.5">🌿 Meus Creditos de Carbono</h2>
        <p className="text-[13px] opacity-85 mb-5">Unidades individuais de 1 tCO2e rastreaveis e verificadas.</p>
        <div className="flex gap-5 lg:gap-8 flex-wrap">
          {[
            { label: "TOTAL",        value: certs.length },
            { label: "DISPONIVEIS",  value: certs.filter((c: any) => c.status === "disponivel").length },
            { label: "RESERVADOS",   value: certs.filter((c: any) => c.status === "reservado").length },
            { label: "TRANSFERIDOS", value: certs.filter((c: any) => c.status === "transferido").length },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] lg:text-[11px] opacity-70 font-bold uppercase">{label}</p>
              <p className="text-[24px] lg:text-[30px] font-black">{value} t</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle + filtros */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        {viewMode === "individual" && (
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {["todos", "disponivel", "reservado", "transferido"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 border"
                style={{
                  background: filter === f ? (f === "todos" ? "#111827" : STATUS_CORES[f as keyof typeof STATUS_CORES]) : "#fff",
                  color:      filter === f ? "#fff" : "#64748b",
                  borderColor: filter === f ? "transparent" : "#e2e8f0",
                }}>
                {f === "todos" ? "TODOS" : STATUS_LABEL[f as keyof typeof STATUS_LABEL]?.split(" ")[0].toUpperCase()}
              </button>
            ))}
          </div>
        )}
        {viewMode === "lote" && <div />}

        <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1 w-fit self-end sm:self-auto">
          {(["lote", "individual"] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-none transition-all capitalize"
              style={{
                background: viewMode === m ? "#fff" : "transparent",
                color:      viewMode === m ? "#111" : "#6b7280",
                boxShadow:  viewMode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}>
              {m === "lote" ? "Por Lote" : "Individual"}
            </button>
          ))}
        </div>
      </div>

      {/* ── MODO LOTE ── */}
      {viewMode === "lote" && (
        <div className="flex flex-col gap-4">
          {lotesAgrupados.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-slate-400 text-sm">Nenhum certificado ainda. Faca uma compra no marketplace!</p>
            </div>
          ) : lotesAgrupados.map(lote => (
            <div key={lote.loteId} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)" }}>
                <div>
                  <p className="font-extrabold text-slate-800">{lote.nome}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{lote.standard} · Safra {lote.year} · {lote.total} certificados</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-bold">{lote.disponiveis} disponiveis</span>
                  {lote.reservados   > 0 && <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold">{lote.reservados} reservados</span>}
                  {lote.transferidos > 0 && <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-bold">{lote.transferidos} transferidos</span>}
                </div>
              </div>

              {/* Acoes em lote */}
              <div className="px-5 py-3.5 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between border-b border-slate-100 bg-slate-50">
                <p className="text-xs text-slate-500">Alterar todos de uma vez:</p>
                <div className="flex gap-2 flex-wrap">
                  {lote.disponiveis > 0 && (
                    <button onClick={() => handleAlterarLote(lote.loteId, "reservado")}
                      disabled={loading === lote.loteId + "reservado"}
                      className="px-4 py-2 rounded-xl border-2 border-purple-400 bg-purple-50 text-purple-700 font-bold text-xs cursor-pointer disabled:opacity-60">
                      {loading === lote.loteId + "reservado" ? "Salvando..." : `♻️ Reservar ${lote.disponiveis} t`}
                    </button>
                  )}
                  {lote.reservados > 0 && (
                    <button onClick={() => handleAlterarLote(lote.loteId, "disponivel")}
                      disabled={loading === lote.loteId + "disponivel"}
                      className="px-4 py-2 rounded-xl border-2 border-green-600 bg-green-50 text-green-700 font-bold text-xs cursor-pointer disabled:opacity-60">
                      {loading === lote.loteId + "disponivel" ? "Salvando..." : `🔓 Liberar ${lote.reservados} t`}
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de certs */}
              <div className="divide-y divide-slate-50 max-h-[240px] overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {lote.certs.map((cert: any) => {
                  const cor = STATUS_CORES[cert.status as keyof typeof STATUS_CORES] || "#6b7280";
                  return (
                    <div key={cert.id} onClick={() => setDetalhe(cert)}
                      className="px-5 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base shrink-0">{STATUS_EMOJI[cert.status as keyof typeof STATUS_EMOJI] || "📄"}</span>
                        <p className="text-[12px] font-mono font-bold text-slate-700 truncate">{cert.serial}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ml-2"
                        style={{ background: `${cor}15`, color: cor }}>
                        {STATUS_LABEL[cert.status as keyof typeof STATUS_LABEL]?.split(" ")[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODO INDIVIDUAL ── */}
      {viewMode === "individual" && (
        <div className="grid gap-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-slate-400 text-sm">Nenhum certificado para este filtro.</p>
            </div>
          ) : filtered.map((cert: any) => {
            const cor = STATUS_CORES[cert.status as keyof typeof STATUS_CORES] || "#6b7280";
            return (
              <div key={cert.id} onClick={() => setDetalhe(cert)}
                className="bg-white rounded-[14px] px-4 lg:px-5 py-4 border border-slate-200 flex justify-between items-center cursor-pointer hover:bg-green-50 hover:border-green-200 transition-colors">
                <div className="flex gap-3 items-center min-w-0">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center text-xl shrink-0" style={{ background: `${cor}15` }}>
                    {STATUS_EMOJI[cert.status as keyof typeof STATUS_EMOJI] || "📄"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] lg:text-[13px] font-mono font-extrabold text-slate-800 truncate">{cert.serial}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Safra {cert.year} · 1 tCO2e · {cert.date}</p>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-[3px] rounded-full font-bold hidden lg:inline" style={{ background: `${cor}15`, color: cor }}>
                  {STATUS_LABEL[cert.status as keyof typeof STATUS_LABEL] || cert.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Detalhe */}
      {detalhe && (
        <div className="fixed inset-0 bg-black/45 z-[9999] flex justify-center items-end lg:items-center p-0 lg:p-5"
          onClick={() => setDetalhe(null)}>
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}
            className="bg-white w-full shadow-2xl overflow-y-auto rounded-t-3xl lg:rounded-2xl max-h-[92vh] p-6 lg:p-8 lg:w-auto lg:max-w-[480px]">

            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="font-black text-[15px] text-gray-900 font-mono mb-1.5 break-all">{detalhe.serial}</p>
                <span className="text-[11px] px-2.5 py-[3px] rounded-full font-bold"
                  style={{ background: `${corDetalhe}15`, color: corDetalhe }}>
                  {STATUS_EMOJI[detalhe.status as keyof typeof STATUS_EMOJI]} {STATUS_LABEL[detalhe.status as keyof typeof STATUS_LABEL]}
                </span>
              </div>
              <button onClick={() => setDetalhe(null)} className="bg-gray-100 border-none rounded-lg w-8 h-8 cursor-pointer text-gray-500">✕</button>
            </div>

            <div className="bg-green-50 rounded-[14px] py-4 px-5 mb-5 text-center">
              <p className="text-[13px] text-gray-400 mb-1">Volume certificado</p>
              <p className="text-[32px] font-black text-green-600">1 tCO2e</p>
            </div>

            <div className="flex flex-col gap-2 mb-5">
              {[
                { label: "Padrao",  value: `${detalhe.standard} (${detalhe.country})` },
                { label: "Projeto", value: detalhe.projectId },
                { label: "Safra",   value: detalhe.year },
                { label: "Emissao", value: detalhe.date || "-" },
                { label: "Status",  value: `${STATUS_EMOJI[detalhe.status as keyof typeof STATUS_EMOJI]} ${STATUS_LABEL[detalhe.status as keyof typeof STATUS_LABEL]}` },
              ].map(row => (
                <div key={row.label} className="flex justify-between py-2.5 px-3.5 bg-gray-50 rounded-[10px]">
                  <span className="text-xs text-gray-400 font-semibold">{row.label}</span>
                  <span className="text-[13px] font-bold text-gray-900 text-right">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl px-4 py-3 mb-4 text-xs"
              style={{ background: `${corDetalhe}10`, border: `1px solid ${corDetalhe}30`, color: corDetalhe }}>
              {detalhe.status === "disponivel"  && "Este credito esta livre para ser vendido no marketplace ou reservado para compensacao propria."}
              {detalhe.status === "reservado"   && "Este credito esta separado para compensar as emissoes da sua empresa."}
              {detalhe.status === "transferido" && "Este credito foi vendido ou cedido. Nao pode ser alterado."}
            </div>

            {detalhe.status === "disponivel" && (
              <button onClick={() => handleAlterarStatus(detalhe, "reservado")} disabled={!!loading}
                className="w-full py-2.5 rounded-[10px] border-2 border-purple-400 bg-purple-50 text-purple-700 font-bold text-xs cursor-pointer mb-3 disabled:opacity-60">
                {loading ? "Salvando..." : "♻️ Reservar para Compensacao"}
              </button>
            )}
            {detalhe.status === "reservado" && (
              <button onClick={() => handleAlterarStatus(detalhe, "disponivel")} disabled={!!loading}
                className="w-full py-2.5 rounded-[10px] border-2 border-green-600 bg-green-50 text-green-800 font-bold text-xs cursor-pointer mb-3 disabled:opacity-60">
                {loading ? "Salvando..." : "🔓 Liberar para Venda"}
              </button>
            )}

            <div className="flex gap-2">
              <button onClick={() => handleDownloadDiploma(detalhe)}
                className="flex-1 py-3 rounded-[10px] border-none bg-green-600 text-white font-bold text-[13px] cursor-pointer">
                Baixar Diploma PDF
              </button>
              <button onClick={() => setDetalhe(null)}
                className="px-5 py-3 rounded-[10px] border-none bg-gray-100 text-gray-700 font-bold text-[13px] cursor-pointer">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}