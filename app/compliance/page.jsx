"use client";

import { useApp } from "@/context/AppContext";
import { Card, Badge, Btn } from "@/components/ui";

const COMPLIANCE_ALERTS = [
  { id: 1, type: "warning", urgency: "alta", title: "Relatório Q4/2025 pendente", desc: "Prazo final: 28/02. Envie o relatório de emissões para garantir seus créditos.", date: "Vence em 7 dias" },
  { id: 2, type: "warning", urgency: "media", title: "Renovação de Certificado", desc: "Certificado VCS-1234 vence em 45 dias. Clique para iniciar a renovação automática.", date: "Vence em 45 dias" },
  { id: 3, type: "ok", urgency: "ok", title: "Auditoria Gold Standard", desc: "Aprovado com nota máxima. Próxima conferência apenas em 2027.", date: "15/02/2026" },
];

const JURIDICO = [
  { t: "📜 Regulamentos", d: "Regras da CVM e Verra atualizadas", icon: "📑" },
  { t: "⚖️ Seus Contratos", d: "Modelos assinados digitalmente", icon: "✍️" },
  { t: "🤖 Assistente Legal", d: "Tire dúvidas sobre leis de carbono", icon: "💬" },
  { t: "🛡️ Seguro Coletivo", d: "Proteção contra quebra de contrato", icon: "🔐" },
];

const ALERT_ICON = { warning: "⚠️", info: "ℹ️", ok: "✅" };
const URGENCY_COLOR = { alta: "#ef4444", media: "#f59e0b", ok: "#16a34a" };
const URGENCY_LABEL = { alta: "URGENTE", media: "PENDENTE", ok: "CONCLUÍDO" };

export default function CompliancePage() {
  const { showToast } = useApp();

  const handleAction = (title) => {
    showToast(`Abrindo módulo para: ${title}`, "info");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "40px" }}>

      {/* 1. RESUMO DE SAÚDE JURÍDICA */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
        {[
          ["Alertas", "2", "#ef4444"],
          ["Prazos", "28/02", "#f59e0b"],
          ["Status", "Seguro", "#16a34a"],
        ].map(([l, v, c]) => (
          <Card key={l} style={{ borderBottom: `4px solid ${c}`, textAlign: "center", padding: "16px" }}>
            <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase" }}>{l}</p>
            <p style={{ fontSize: "18px", fontWeight: "800", color: "#111827", marginTop: "4px" }}>{v}</p>
          </Card>
        ))}
      </div>

      {/* 2. ALERTAS E PRAZOS (ESTILO NOTIFICAÇÃO) */}
      <Card>
        <div style={{ marginBottom: "18px" }}>
          <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>Obrigações e Compliance</h2>
          <p style={{ fontSize: "13px", color: "#6b7280" }}>Mantenha sua documentação em dia para vender</p>
        </div>

        {COMPLIANCE_ALERTS.map((a) => (
          <div key={a.id} 
            onClick={() => handleAction(a.title)}
            style={{
              padding: "16px", borderRadius: "16px", marginBottom: "12px", cursor: "pointer",
              background: a.type === "warning" ? "#fffbeb" : "#f0fdf4",
              border: `1px solid ${a.type === "warning" ? "#fde68a" : "#bbf7d0"}`,
              transition: "transform 0.2s"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ fontSize: "20px" }}>{ALERT_ICON[a.type]}</span>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "800", color: "#111827" }}>{a.title}</h3>
                  <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px", lineHeight: "1.4" }}>{a.desc}</p>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#9ca3af" }}>{a.date.toUpperCase()}</span>
              <Badge label={URGENCY_LABEL[a.urgency]} color={URGENCY_COLOR[a.urgency]} />
            </div>
          </div>
        ))}
      </Card>

      {/* 3. MÓDULO JURÍDICO (CARDS DE ACESSO RÁPIDO) */}
      <div style={{ marginBottom: "10px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: "800", color: "#111827", marginLeft: "4px", marginBottom: "12px" }}>Serviços Jurídicos</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {JURIDICO.map((item) => (
            <div key={item.t}
              onClick={() => handleAction(item.t)}
              style={{ 
                background: "#fff", borderRadius: "16px", padding: "16px", 
                border: "1px solid #e5e7eb", cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
              }}
            >
              <div style={{ fontSize: "22px", marginBottom: "10px" }}>{item.icon}</div>
              <p style={{ fontSize: "13px", fontWeight: "800", color: "#111827", marginBottom: "4px" }}>{item.t}</p>
              <p style={{ fontSize: "11px", color: "#9ca3af", lineHeight: "1.3" }}>{item.d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 4. BOTÃO DE SUPORTE DIRETO */}
      <Btn style={{ padding: "18px", background: "#111827" }} onClick={() => handleAction("Suporte Jurídico")}>
        ⚖️ Solicitar Revisão de Contrato
      </Btn>

    </div>
  );
}