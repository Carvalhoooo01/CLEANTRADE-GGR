"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, Badge, Btn, SectionHeader } from "@/components/ui";
import { Icons } from "@/components/Icons";
import { STATUS_COLORS } from "@/data/constants";

const MONITORING_DATA = [
  { id: 1, icon: "🌳", prop: "Fazenda Verde", sensor: "Satélite Sentinel-2", value: "Saúde da Mata: 96% (Excelente)", date: "Hoje, 10:32", status: "ativo" },
  { id: 2, icon: "☀️", prop: "Solar Cooperativa", sensor: "Sensor IoT", value: "Geração: 142 kWh · Operação Normal", date: "Hoje, 10:01", status: "ativo" },
  { id: 3, icon: "🌿", prop: "Cerrado", sensor: "Satélite Landsat-9", value: "Biomassa: Estável · Sem alertas", date: "Hoje, 07:15", status: "ativo" },
  { id: 4, icon: "💧", prop: "Sítio Esperança", sensor: "Sensor de Solo", value: "Umidade: 68% · Necessita atenção", date: "Ontem, 18:00", status: "pendente" },
  { id: 5, icon: "📡", prop: "Fazenda Verde", sensor: "Histórico Drone", value: "Mapeamento de 280ha concluído", date: "20/02/2026", status: "ativo" },
];

export default function MonitoramentoPage() {
  const { showToast } = useApp();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    showToast("Sincronizando com a rede de satélites...", "info");
    setTimeout(() => {
      setIsSyncing(false);
      showToast("Dados atualizados com sucesso!", "success");
    }, 2000);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingBottom: "40px" }}>

      {/* 1. CARDS DE RESUMO RÁPIDO */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
        {[
          ["Sensores Ativos", "8", "#16a34a", Icons.check],
          ["Pendentes", "2", "#f59e0b", Icons.alert],
          ["Conexão Satélite", "100%", "#3b82f6", Icons.satellite],
          ["Última Atualização", "Agora", "#6b7280", Icons.refresh],
        ].map(([l, v, c, icon]) => (
          <Card key={l} style={{ borderLeft: `4px solid ${c}`, padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <p style={{ fontSize: "11px", color: "#9ca3af", fontWeight: "700", textTransform: "uppercase" }}>{l}</p>
              <span style={{ color: c }}>{icon}</span>
            </div>
            <p style={{ fontSize: "20px", fontWeight: "800", color: "#111827" }}>{v}</p>
          </Card>
        ))}
      </div>

      {/* 2. LISTA DE MONITORAMENTO PRINCIPAL */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#111827" }}>Dados de Monitoramento</h2>
            <p style={{ fontSize: "13px", color: "#6b7280" }}>Histórico de leituras automáticas</p>
          </div>
          <Btn onClick={handleSync} disabled={isSyncing} small>
            {isSyncing ? "Buscando..." : "Atualizar agora"}
          </Btn>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {MONITORING_DATA.map((d) => (
            <div key={d.id} style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between", 
              padding: "16px", 
              background: "#fcfdfc", 
              borderRadius: "16px", 
              border: "1px solid #f1f5f1" 
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ 
                  width: "44px", 
                  height: "44px", 
                  borderRadius: "12px", 
                  background: "#f0fdf4", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "22px",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                }}>{d.icon}</div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "700", color: "#111827" }}>{d.prop}</p>
                  <p style={{ fontSize: "13px", color: d.status === 'ativo' ? "#059669" : "#b45309", fontWeight: "600" }}>{d.value}</p>
                  <p style={{ fontSize: "11px", color: "#9ca3af" }}>{d.sensor} • {d.date}</p>
                </div>
              </div>
              <Badge 
                label={d.status === 'ativo' ? 'OK' : 'VER'} 
                color={STATUS_COLORS[d.status]} 
              />
            </div>
          ))}
        </div>
      </Card>

      {/* 3. MENSAGEM DE CONFIANÇA TECNOLÓGICA */}
      <div style={{ 
        background: "#f8fafc", 
        padding: "20px", 
        borderRadius: "16px", 
        border: "1px solid #e2e8f0",
        textAlign: "center"
      }}>
        <p style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
          🛡️ <b>Monitoramento 100% Digital</b><br/>
          Seus créditos são auditados automaticamente via satélite. <br/>
          Não há necessidade de vistorias manuais.
        </p>
      </div>

    </div>
  );
}