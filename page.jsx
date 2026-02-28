"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { Btn, Badge, KpiCard, SectionHeader, downloadCSV } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { PIE_COLORS, fmt, fmtCO2 } from "@/data/constants";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const generateReport = (transactions, role) => {
  const headers = ["Data", "Operação", "Certificado", "Quantidade (t)", "Valor (R$)", "Status"];
  const rows = transactions.map(t => [t.date, t.type, t.cert, t.amount, t.total, t.status]);
  downloadCSV([headers, ...rows], `relatorio_cleantrade_${role}.csv`);
};

function ChartTip({ active, payload, label, prefix = "", color = "#10b981" }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#111827", borderRadius: 8, padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.25)", border: `1px solid ${color}44` }}>
      <p style={{ color: "#9ca3af", fontSize: 10, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: color, fontSize: 13, fontWeight: 700 }}>
          {prefix}{p.value.toLocaleString("pt-BR")}
        </p>
      ))}
    </div>
  );
}

// --- MODAL DE ADICIONAR SALDO ---
function ModalSaldo({ onClose, onConfirm, themeColor, loading }) {
  const [valor, setValor] = useState("");
  const [erro, setErro]   = useState("");
  const valores = [500, 1000, 5000, 10000];

  const handleConfirm = () => {
    const num = parseFloat(valor.replace(",", "."));
    if (!num || num <= 0) return setErro("Informe um valor válido.");
    onConfirm(num);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
      <div style={{ background: "#fff", borderRadius: "20px", padding: "32px", width: "100%", maxWidth: "420px", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>➕ Adicionar Saldo</h3>
            <p style={{ fontSize: "13px", color: "#9ca3af", marginTop: 4 }}>Simule um depósito na carteira</p>
          </div>
          <button onClick={onClose} style={{ background: "#f3f4f6", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", marginBottom: "10px" }}>Valores Rápidos</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "20px" }}>
          {valores.map(v => (
            <button key={v} onClick={() => { setValor(String(v)); setErro(""); }}
              style={{ padding: "12px", borderRadius: "12px", border: `2px solid ${valor === String(v) ? themeColor : "#e5e7eb"}`, background: valor === String(v) ? `${themeColor}15` : "#f9fafb", color: valor === String(v) ? themeColor : "#374151", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>
              {fmt(v)}
            </button>
          ))}
        </div>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", marginBottom: "8px" }}>Ou digite o valor</p>
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", fontWeight: "700", color: "#9ca3af" }}>R$</span>
          <input type="number" placeholder="0,00" value={valor} onChange={e => { setValor(e.target.value); setErro(""); }}
            style={{ width: "100%", padding: "12px 14px 12px 40px", borderRadius: "12px", border: `2px solid ${erro ? "#ef4444" : "#e5e7eb"}`, fontSize: "16px", fontWeight: "700", boxSizing: "border-box", outline: "none" }} />
        </div>
        {erro && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px" }}>⚠️ {erro}</p>}
        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "2px solid #e5e7eb", background: "#fff", fontWeight: "700", fontSize: "14px", cursor: "pointer" }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, padding: "14px", borderRadius: "12px", border: "none", background: themeColor, color: "#fff", fontWeight: "700", fontSize: "14px", cursor: "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Salvando..." : "Confirmar Depósito"}
          </button>
        </div>
        <p style={{ textAlign: "center", fontSize: "11px", color: "#d1d5db", marginTop: "16px" }}>🔒 Simulação para fins de apresentação</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { ready, user, balance, setBalance, transactions, properties, showToast, role } = useApp();
  const router = useRouter();
  const [showModalSaldo, setShowModalSaldo] = useState(false);
  const [savingDeposit, setSavingDeposit]   = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    } else if (role === "vendedor") {
      router.replace("/vendedor");
    }
  }, [user, ready, role, router]);

  const monthlyData = useMemo(() => {
    const base = [
      { m: "Set", total: 0, volume: 0 },
      { m: "Out", total: 0, volume: 0 },
      { m: "Nov", total: 0, volume: 0 },
      { m: "Dez", total: 0, volume: 0 },
      { m: "Jan", total: 0, volume: 0 },
      { m: "Fev", total: 0, volume: 0 },
    ];
    if (!transactions?.length) return base;
    const mesMap = { "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr", "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago", "09": "Set", "10": "Out", "11": "Nov", "12": "Dez" };
    transactions.forEach(t => {
      const parts = t.date?.split(" ")[0]?.split("/");
      if (!parts || parts.length < 2) return;
      const mesAbrev = mesMap[parts[1]];
      if (!mesAbrev) return;
      const entry = base.find(b => b.m === mesAbrev);
      if (entry) {
        entry.total  += t.total  || 0;
        entry.volume += t.amount || 0;
      }
    });
    return base;
  }, [transactions]);

  const pieData = useMemo(() => {
    if (!transactions?.length) return [];
    const map = {};
    transactions.forEach(t => {
      const tipo = t.type || "Outro";
      if (!map[tipo]) map[tipo] = { name: tipo, value: 0 };
      map[tipo].value += t.amount || 0;
    });
    return Object.values(map);
  }, [transactions]);

  if (!ready || !user) return null;

  const isVendedor    = role === "vendedor";
  const themeColor    = isVendedor ? "#0ea5e9" : "#10b981";
  const themeGradient = isVendedor
    ? "linear-gradient(135deg,#0c4a6e,#0284c7)"
    : "linear-gradient(135deg,#064e3b,#14532d)";

  const totalCO2     = transactions?.reduce((s, t) => s + (t.amount || 0), 0) || 0;
  const totalVal     = transactions?.reduce((s, t) => s + (t.total  || 0), 0) || 0;
  const numProperties = properties?.length || 0;

  // ── salva depósito no banco ──────────────────────────────────────────────────
  const handleAddSaldo = async (valor) => {
    const novoSaldo = balance + valor;

    // Atualiza UI imediatamente
    setBalance(novoSaldo);
    showToast(`${fmt(valor)} adicionado à carteira!`, "success");
    setShowModalSaldo(false);

    // Persiste no banco
    setSavingDeposit(true);
    try {
      const res = await fetch("/api/usuarios/saldo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, saldo: novoSaldo }),
      });
      if (!res.ok) throw new Error("Falha ao salvar");

      // Atualiza localStorage para manter consistência
      const saved = localStorage.getItem("cleantrade_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.saldo = novoSaldo;
        localStorage.setItem("cleantrade_user", JSON.stringify(parsed));
      }
    } catch {
      showToast("Saldo atualizado localmente, mas erro ao salvar no banco.", "error");
      // Reverte se falhar
      setBalance(balance);
    } finally {
      setSavingDeposit(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "slideIn 0.4s ease-out" }}>

      {showModalSaldo && (
        <ModalSaldo
          themeColor={themeColor}
          loading={savingDeposit}
          onClose={() => setShowModalSaldo(false)}
          onConfirm={handleAddSaldo}
        />
      )}

      {/* BANNER */}
      <div style={{ background: themeGradient, borderRadius: 20, padding: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.12)", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: "-20px", bottom: "-20px", fontSize: "120px", opacity: 0.1, pointerEvents: "none" }}>🌱</div>
        <div style={{ zIndex: 1 }}>
          <p style={{ opacity: 0.8, fontSize: 14, fontWeight: "500", marginBottom: 4 }}>Bem-vindo de volta,</p>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{user.nome}</h2>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Badge label={isVendedor ? "PERFIL VENDEDOR" : "PERFIL COMPRADOR"} color="rgba(255,255,255,0.25)" />
            <span style={{ fontSize: 13, opacity: 0.9 }}>
              📍 {user.localizacao || "Cascavel, PR"} • <span style={{ color: "#fbbf24" }}>★ Premium</span>
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right", zIndex: 1 }}>
          <p style={{ opacity: 0.8, fontSize: 12, marginBottom: 4, fontWeight: "600", textTransform: "uppercase" }}>
            {isVendedor ? "Receita Acumulada" : "Saldo para Compensação"}
          </p>
          <p style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-1px" }}>{fmt(isVendedor ? totalVal : balance)}</p>
          <button
            onClick={() => isVendedor ? showToast("Área financeira em manutenção", "info") : setShowModalSaldo(true)}
            style={{ background: "#fff", color: themeColor, border: "none", padding: "8px 20px", borderRadius: "12px", fontSize: "12px", cursor: "pointer", marginTop: 12, fontWeight: "700", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
            {isVendedor ? "💳 Solicitar Saque" : "➕ Adicionar Saldo"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <KpiCard label={isVendedor ? "CO₂ Gerado (Mata)" : "CO₂ Compensado"} value={fmtCO2(totalCO2)} color={themeColor} />
        <KpiCard label="Áreas Registradas" value={numProperties} sub={numProperties === 1 ? "Propriedade" : "Propriedades"} color="#6366f1" />
        <KpiCard label="Cotação do Carbono" value="R$ 88,42" color="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
        {/* GRÁFICO EVOLUÇÃO */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #e5e7eb" }}>
          <SectionHeader title="Desempenho por Mês" action={<Btn small variant="ghost" onClick={() => generateReport(transactions || [], role)}>{Icons.download} CSV</Btn>} />
          <div style={{ height: 180, marginTop: 20 }}>
            {monthlyData.some(d => d.total > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorTheme" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={themeColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} dy={10} />
                  <Tooltip content={<ChartTip prefix="R$ " color={themeColor} />} />
                  <Area type="monotone" dataKey="total" stroke={themeColor} strokeWidth={4} fill="url(#colorTheme)" dot={{ fill: themeColor, strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: themeColor }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>
                Nenhuma transação ainda
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO PIZZA */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #e5e7eb" }}>
          <p style={{ fontSize: 15, fontWeight: 800, marginBottom: 20 }}>Distribuição por Tipo</p>
          <div style={{ height: 180 }}>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={8} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v.toFixed(2)} tCO₂`, n]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 13 }}>
                Nenhuma transação ainda
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: 12 }}>
            {pieData.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MOVIMENTAÇÕES */}
      <div style={{ background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #e5e7eb", marginBottom: 20 }}>
        <SectionHeader title="Movimentações" action={<Btn small variant="outline" onClick={() => generateReport(transactions || [], role)}>Relatório</Btn>} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          {transactions?.slice(0, 5).map(t => (
            <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "16px", background: "#fcfdfc", borderRadius: 14, border: "1px solid #f1f5f1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>🌿</div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{t.type}</p>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>{t.date} · {t.cert}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: themeColor }}>{fmtCO2(t.amount)}</p>
                <p style={{ fontSize: 13, color: "#6b7280" }}>{fmt(t.total)}</p>
              </div>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "20px" }}>Nenhuma movimentação encontrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}
