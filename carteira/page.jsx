"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, Btn, KpiCard, Badge } from "@/components/ui";
import { fmt } from "@/data/constants";

export default function CarteiraPage() {
  const { user, role, balance, setBalance, showToast, transactions } = useApp();
  const [valorInput, setValorInput] = useState("");

  // Função para simular depósito ou saque
  const handleFinanceiro = () => {
    const v = parseFloat(valorInput);
    if (!v || v <= 0) return showToast("Insira um valor válido", "error");

    if (role === "vendedor") {
      if (v > balance) return showToast("Saldo insuficiente para saque", "error");
      setBalance(prev => prev - v);
      showToast(`Saque de ${fmt(v)} solicitado via PIX!`, "success");
    } else {
      setBalance(prev => prev + v);
      showToast(`Depósito de ${fmt(v)} confirmado!`, "success");
    }
    setValorInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      
      {/* 1. CABEÇALHO DINÂMICO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0c4a6e", fontFamily: "'Playfair Display', serif" }}>
            Minha Carteira Digital
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            {role === "vendedor" ? "Gerencie seus lucros e resgates" : "Gerencie seus fundos para investimento"}
          </p>
        </div>
        <Badge label="REDE BLOCKCHAIN ATIVA" color="#16a34a" />
      </div>

      {/* 2. KPIs FINANCEIROS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <KpiCard 
          label="Saldo Disponível" 
          value={fmt(balance)} 
          sub={role === "vendedor" ? "Disponível para saque" : "Pronto para investir"}
          color="#16a34a" 
        />
        <KpiCard 
          label="Em Trânsito" 
          value={fmt(role === "vendedor" ? 12500 : 0)} 
          sub="Liquidação em 24h"
          color="#0ea5e9" 
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
        
        {/* 3. OPERAÇÕES (DEPÓSITO/SAQUE) */}
        <Card style={{ padding: "30px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>
            {role === "vendedor" ? "Resgatar Saldo" : "Adicionar Fundos"}
          </h3>
          
          <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <label style={{ fontSize: "11px", fontWeight: "800", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
              DIGITE O VALOR (R$)
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <input 
                type="number"
                placeholder="0,00"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                style={{ 
                  flex: 1, padding: "14px", borderRadius: "10px", border: "1px solid #cbd5e1",
                  fontSize: "18px", fontWeight: "700", outline: "none"
                }}
              />
              <Btn 
                onClick={handleFinanceiro}
                style={{ 
                  background: "#111827", color: "#fff", padding: "0 30px",
                  borderRadius: "10px", fontWeight: "700"
                }}
              >
                {role === "vendedor" ? "Solicitar Saque" : "Adicionar via PIX"}
              </Btn>
            </div>
          </div>
          
          <p style={{ marginTop: "20px", fontSize: "12px", color: "#94a3b8", textAlign: "center" }}>
            {role === "vendedor" 
              ? "* Transferências via PIX são processadas em até 30 minutos para sua conta cadastrada."
              : "* O saldo ficará disponível imediatamente após a confirmação do pagamento."}
          </p>
        </Card>

        {/* 4. ÚLTIMAS MOVIMENTAÇÕES */}
        <Card>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px" }}>Extrato Recente</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {transactions.slice(0, 4).map((tx, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #f1f5f9" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                    {tx.type === "BUY" ? "Compra de Créditos" : "Venda de Créditos"}
                  </p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>{tx.date || "22 Fev 2026"}</p>
                </div>
                <p style={{ 
                  fontSize: "14px", fontWeight: "800", 
                  color: tx.type === "BUY" ? "#ef4444" : "#16a34a" 
                }}>
                  {tx.type === "BUY" ? "-" : "+"}{fmt(tx.total || tx.amount)}
                </p>
              </div>
            ))}
          </div>
          <Btn variant="ghost" small style={{ width: "100%", marginTop: "15px", color: "#0ea5e9" }}>
            Ver Extrato Completo
          </Btn>
        </Card>

      </div>
    </div>
  );
}