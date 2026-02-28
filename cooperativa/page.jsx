"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Icons } from "@/components/Icons";
import { Btn, Badge } from "@/components/ui";

const fmt = (v) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtCO2 = (v) => `${Number(v || 0).toFixed(2)} tCO₂`;
const fmtPct = (v) => `${Number(v || 0).toFixed(1)}%`;

export default function CooperativaPage() {
  const { user, lotes, showToast } = useApp();
  const [coop, setCoop] = useState(null);
  const [membro, setMembro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lotesSel, setLotesSel] = useState({}); // { loteId: quantidade }
  const [enviando, setEnviando] = useState(false);

  const recarregar = () => {
    setLoading(true);
    fetch("/api/cooperativa")
      .then(r => r.json())
      .then(data => {
        if (data?.id) {
          setCoop(data);
          setMembro(data.membros?.find(m => m.userId === user?.id) || null);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { recarregar(); }, [user]);

  const poolTotal = coop?.poolTotal || 0;
  const minhasContribs = coop?.contribuicoes?.filter(c => c.userId === user?.id) || [];
  const minhaQtdTotal = minhasContribs.reduce((s, c) => s + c.quantidade, 0);

  const handleUnificar = async (loteId) => {
    const qtd = parseFloat(lotesSel[loteId]);
    if (!qtd || qtd <= 0) return showToast("Informe uma quantidade válida", "error");

    setEnviando(true);
    try {
      const res = await fetch("/api/cooperativa/contribuir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, loteId, quantidade: qtd }),
      });

      if (res.ok) {
        showToast("Créditos unificados ao Lote Mestre! 🌿", "success");
        setLotesSel(prev => ({ ...prev, [loteId]: "" }));
        recarregar();
      } else {
        const d = await res.json();
        showToast(d.error || "Erro ao unificar", "error");
      }
    } catch (err) {
      showToast("Erro de conexão", "error");
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>🌿 Sincronizando com o Pool Coletivo...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      
      {/* 1. STATUS DO LOTE MESTRE (VISÃO DO COMPRADOR NO MARKETPLACE) */}
      <div style={{ background: "linear-gradient(135deg, #064e3b, #065f46)", borderRadius: 20, padding: 30, color: "#fff", boxShadow: "0 10px 30px rgba(6,78,70,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Badge label="LOTE MESTRE UNIFICADO" color="#10b981" />
            <h1 style={{ fontSize: 26, fontWeight: 900, marginTop: 10 }}>Pool Coletivo {coop?.nome}</h1>
            <p style={{ opacity: 0.8, fontSize: 13, marginTop: 5 }}>Agrupando pequenos volumes para venda corporativa.</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, opacity: 0.7, fontWeight: 700 }}>VOLUME TOTAL EM ESTOQUE</p>
            <p style={{ fontSize: 38, fontWeight: 900 }}>{fmtCO2(poolTotal)}</p>
          </div>
        </div>

        <div style={{ marginTop: 25, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, background: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 15 }}>
          <div>
            <p style={{ fontSize: 11, opacity: 0.7 }}>MINHA CONTRIBUIÇÃO</p>
            <p style={{ fontSize: 20, fontWeight: 800 }}>{fmtCO2(minhaQtdTotal)}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, opacity: 0.7 }}>MINHA PARTICIPAÇÃO</p>
            <p style={{ fontSize: 20, fontWeight: 800 }}>{poolTotal > 0 ? fmtPct((minhaQtdTotal/poolTotal)*100) : "0%"}</p>
          </div>
          <div>
            <p style={{ fontSize: 11, opacity: 0.7 }}>PREÇO ALVO DO POOL</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>{fmt(45.00)}/t</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        
        {/* 2. MEUS ATIVOS DISPONÍVEIS PARA UNIFICAR */}
        <div style={{ background: "#fff", borderRadius: 18, padding: 24, border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 15, color: "#1e293b" }}>🌿 Meus Créditos Livres</h3>
          <p style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Injete seus lotes individuais no Pool Coletivo para aumentar sua liquidez.</p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lotes.filter(l => l.status === "ativo" && l.quantidade > 0).map(l => (
              <div key={l.id} style={{ padding: 15, borderRadius: 12, border: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700 }}>{l.nome}</p>
                    <p style={{ fontSize: 11, color: "#64748b" }}>{l.tipo} · {l.certificadora}</p>
                  </div>
                  <span style={{ fontSize: 12, color: "#16a34a", fontWeight: 700 }}>{fmtCO2(l.quantidade)}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input 
                    type="number" 
                    placeholder="Qtd" 
                    value={lotesSel[l.id] || ""}
                    onChange={e => setLotesSel(prev => ({ ...prev, [l.id]: e.target.value }))}
                    style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
                  />
                  <Btn small onClick={() => handleUnificar(l.id)} disabled={enviando}>
                    Unificar
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. ESTRUTURA DO LOTE UNIFICADO */}
        <div style={{ background: "#fff", borderRadius: 18, padding: 24, border: "1px solid #e2e8f0" }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 15 }}>👥 Composição do Lote Mestre</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
            {coop?.contribuicoes?.length > 0 ? (
              coop.contribuicoes.slice(0, 5).map((c, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: c.userId === user.id ? "#16a34a" : "#334155" }}>
                      {c.user?.nome} {c.userId === user.id ? "(Você)" : ""}
                    </span>
                    <span style={{ color: "#64748b" }}>{fmtCO2(c.quantidade)}</span>
                  </div>
                  <div style={{ height: 6, background: "#f1f5f9", borderRadius: 10 }}>
                    <div style={{ width: `${(c.quantidade/poolTotal)*100}%`, height: "100%", background: c.userId === user.id ? "#16a34a" : "#0ea5e9", borderRadius: 10 }} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 20 }}>Aguardando primeira unificação...</p>
            )}
            
            <div style={{ marginTop: 10, padding: 15, background: "#f0f9ff", borderRadius: 12, border: "1px solid #bae6fd" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 18 }}>📢</span>
                <p style={{ fontSize: 11, color: "#0369a1", lineHeight: 1.4 }}>
                  <strong>Aviso de Venda:</strong> Quando o pool atingir 100 tCO₂, o lote será listado para compradores corporativos com preço premium.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}