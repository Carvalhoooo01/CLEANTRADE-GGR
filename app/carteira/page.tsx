"use client";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, Btn, KpiCard, Badge } from "@/components/ui";
import { fmt } from "@/data/constants";

export default function CarteiraPage() {
  const { user, role, balance, setBalance, showToast, transactions } = useApp();
  const [valorInput, setValorInput] = useState("");

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
    <div className="flex flex-col gap-6 pb-10">

      {/* 1. CABEÇALHO DINÂMICO */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-sky-900 font-serif">
            Minha Carteira Digital
          </h2>
          <p className="text-sm text-slate-500">
            {role === "vendedor" ? "Gerencie seus lucros e resgates" : "Gerencie seus fundos para investimento"}
          </p>
        </div>
        <Badge label="REDE BLOCKCHAIN ATIVA" color="#16a34a" />
      </div>

      {/* 2. KPIs FINANCEIROS */}
      <div className="grid grid-cols-2 gap-4">
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

      <div className="grid gap-5" style={{ gridTemplateColumns: "1.2fr 1fr" }}>

        {/* 3. OPERAÇÕES */}
        <Card style={{ padding: "30px" }}>
          <h3 className="text-lg font-bold mb-5">
            {role === "vendedor" ? "Resgatar Saldo" : "Adicionar Fundos"}
          </h3>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-extrabold text-slate-400 mb-2 uppercase tracking-wide">
              DIGITE O VALOR (R$)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                placeholder="0,00"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                className="flex-1 p-3.5 rounded-[10px] border border-slate-300 text-lg font-bold outline-none
                           focus:border-gray-900 transition-colors"
              />
              <Btn
                onClick={handleFinanceiro}
                style={{ background: "#111827", color: "#fff", padding: "0 30px", borderRadius: "10px", fontWeight: "700" }}
              >
                {role === "vendedor" ? "Solicitar Saque" : "Adicionar via PIX"}
              </Btn>
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-400 text-center">
            {role === "vendedor"
              ? "* Transferências via PIX são processadas em até 30 minutos para sua conta cadastrada."
              : "* O saldo ficará disponível imediatamente após a confirmação do pagamento."}
          </p>
        </Card>

        {/* 4. ÚLTIMAS MOVIMENTAÇÕES */}
        <Card>
          <h3 className="text-base font-bold mb-4">Extrato Recente</h3>
          <div className="flex flex-col gap-3">
            {transactions.slice(0, 4).map((tx, i) => (
              <div
                key={i}
                className="flex justify-between items-center pb-3 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="text-[13px] font-bold text-slate-800 m-0">
                    {tx.type === "BUY" ? "Compra de Créditos" : "Venda de Créditos"}
                  </p>
                  <p className="text-[11px] text-slate-400 m-0">{tx.date || "22 Fev 2026"}</p>
                </div>
                <p className={`text-sm font-extrabold ${tx.type === "BUY" ? "text-red-500" : "text-green-600"}`}>
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
