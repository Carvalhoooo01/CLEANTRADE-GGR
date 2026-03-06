"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";

const fmt = (v: number) => (v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
}

function emvField(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

function gerarPayloadPix(valor: number): string {
  const chave  = "+5545991148223";
  const nome   = "Gustavo Carvalho";
  const cidade = "Cascavel";
  const ma     = emvField("26", emvField("00", "BR.GOV.BCB.PIX") + emvField("01", chave));
  const payload =
    emvField("00", "01") + ma +
    emvField("52", "0000") + emvField("53", "986") +
    emvField("54", valor.toFixed(2)) +
    emvField("58", "BR") +
    emvField("59", nome.slice(0, 25)) +
    emvField("60", cidade.slice(0, 15)) +
    emvField("62", emvField("05", "***"));
  return payload + emvField("63", crc16(payload + "6304"));
}

export default function PixDeposito({ onClose }: { onClose?: () => void }) {
  const { user, balance, setBalance, setTx, showToast } = useApp();

  const [etapa,    setEtapa]    = useState<"valor" | "qrcode" | "confirmado">("valor");
  const [valor,    setValor]    = useState("");
  const [payload,  setPayload]  = useState("");
  const [qrUrl,    setQrUrl]    = useState("");
  const [copiado,  setCopiado]  = useState(false);
  const [salvando, setSalvando] = useState(false);

  const valorNum = parseFloat(String(valor).replace(/\./g, "").replace(",", ".")) || 0;

  useEffect(() => {
    if (etapa === "qrcode" && payload) {
      // qrserver.com — sem bloqueio, sem autenticação
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&ecc=M&data=${encodeURIComponent(payload)}`);
    }
  }, [etapa, payload]);

  const handleGerarQR = () => {
    if (valorNum <= 0) return showToast("Informe um valor valido.", "error");
    if (valorNum > 500000) return showToast("Valor maximo: R$ 500.000,00", "error");
    setPayload(gerarPayloadPix(valorNum));
    setEtapa("qrcode");
  };

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
      showToast("Codigo PIX copiado!", "success");
    } catch {
      showToast("Selecione e copie manualmente.", "error");
    }
  };

  const handleConfirmar = async () => {
    setSalvando(true);
    const novoSaldo = balance + valorNum;
    const dateStr   = new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR").slice(0, 5);
    const tempId    = `pix-${Date.now()}`;

    setBalance(novoSaldo);
    setTx((prev: any[]) => [{ id: tempId, type: "deposito", cert: "PIX", date: dateStr, amount: 0, price: 0, total: valorNum, status: "pago" }, ...(prev || [])]);

    try {
      await fetch("/api/usuarios/saldo", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, saldo: novoSaldo }) });
      const txRes = await fetch("/api/transacoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, type: "deposito", cert: "PIX", amount: 0, price: 0, total: valorNum, status: "pago" }) });
      if (txRes.ok) {
        const salvo = await txRes.json();
        setTx((prev: any[]) => prev.map((t: any) => t.id === tempId ? salvo : t));
      }
      const saved = sessionStorage.getItem("cleantrade_user");
      if (saved) { const p = JSON.parse(saved); p.saldo = novoSaldo; sessionStorage.setItem("cleantrade_user", JSON.stringify(p)); }
      setEtapa("confirmado");
    } catch {
      showToast("Erro ao salvar. Tente novamente.", "error");
      setBalance(balance);
      setTx((prev: any[]) => prev.filter((t: any) => t.id !== tempId));
    } finally { setSalvando(false); }
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Etapa 1: Valor */}
      {etapa === "valor" && (
        <>
          <div>
            <p className="font-extrabold text-lg mb-1">Depositar via PIX</p>
            <p className="text-gray-500 text-sm">Digite o valor que deseja depositar na sua carteira.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[50, 100, 500, 1000, 5000].map(v => (
              <button key={v} onClick={() => setValor(String(v))}
                className="px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all border-2"
                style={{ borderColor: valor === String(v) ? "#16a34a" : "#e5e7eb", background: valor === String(v) ? "#f0fdf4" : "#f9fafb", color: valor === String(v) ? "#16a34a" : "#374151" }}>
                {fmt(v)}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
            <input type="text" inputMode="decimal" value={valor}
              onChange={e => setValor(e.target.value.replace(/[^0-9.,]/g, ""))}
              placeholder="0,00"
              className="w-full pl-11 pr-4 py-4 rounded-xl border-2 border-gray-200 text-xl font-bold outline-none focus:border-green-600 box-border" />
          </div>
          {valorNum > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              Sera gerado um QR Code PIX de <strong>{fmt(valorNum)}</strong> para Gustavo Carvalho.
            </div>
          )}
          <div className="flex gap-2.5">
            {onClose && (
              <button onClick={onClose} className="flex-1 py-3.5 rounded-xl border border-gray-200 bg-white font-bold text-sm cursor-pointer">Cancelar</button>
            )}
            <button onClick={handleGerarQR} disabled={valorNum < 0}
              className="flex-1 py-3.5 rounded-xl border-none bg-green-600 text-white font-bold text-sm cursor-pointer disabled:opacity-50">
              Gerar QR Code PIX
            </button>
          </div>
        </>
      )}

      {/* Etapa 2: QR Code */}
      {etapa === "qrcode" && (
        <>
          <div className="text-center">
            <p className="font-extrabold text-lg mb-1">Escaneie o QR Code</p>
            <p className="text-gray-500 text-sm">Abra o app do seu banco e pague {fmt(valorNum)}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="bg-white border-2 border-green-200 rounded-2xl p-4 shadow-sm inline-flex items-center justify-center">
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR Code PIX"
                  width={220}
                  height={220}
                  className="rounded-lg"
                  onError={() => showToast("Erro ao carregar QR Code. Use o Copia e Cola.", "error")}
                />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-gray-400 text-sm">
                  Gerando QR Code...
                </div>
              )}
            </div>
          </div>

          {/* Destinatario */}
          <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-semibold">Destinatario</p>
              <p className="text-sm font-bold text-gray-900">Gustavo Carvalho</p>
              <p className="text-xs text-gray-500">+55 45 99114-8223</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 font-semibold">Valor</p>
              <p className="text-xl font-black text-green-600">{fmt(valorNum)}</p>
            </div>
          </div>

          {/* Copia e Cola */}
          <div>
            <p className="text-xs text-gray-400 font-semibold mb-1.5">PIX Copia e Cola</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono truncate">
                {payload.slice(0, 50)}...
              </div>
              <button onClick={handleCopiar}
                className="px-4 py-2 rounded-lg border-none font-bold text-xs cursor-pointer whitespace-nowrap transition-all text-white"
                style={{ background: copiado ? "#16a34a" : "#111827" }}>
                {copiado ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
            <strong>Importante:</strong> Apos realizar o pagamento no seu app, clique em "Ja Paguei" para creditar o saldo.
          </div>

          <div className="flex gap-2.5">
            <button onClick={() => setEtapa("valor")}
              className="flex-1 py-3.5 rounded-xl border border-gray-200 bg-white font-bold text-sm cursor-pointer">
              Voltar
            </button>
            <button onClick={handleConfirmar} disabled={salvando}
              className="flex-1 py-3.5 rounded-xl border-none bg-green-600 text-white font-bold text-sm cursor-pointer disabled:opacity-60">
              {salvando ? "Salvando..." : "Ja Paguei"}
            </button>
          </div>
        </>
      )}

      {/* Etapa 3: Confirmado */}
      {etapa === "confirmado" && (
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mx-auto mb-4">✅</div>
          <p className="font-extrabold text-xl mb-2 text-green-700">Deposito registrado!</p>
          <p className="text-gray-500 text-sm mb-1"><strong>{fmt(valorNum)}</strong> adicionado a sua carteira.</p>
          <p className="text-xs text-gray-400 mb-6">Saldo atual: <strong>{fmt(balance)}</strong></p>
          <button onClick={onClose || (() => setEtapa("valor"))}
            className="w-full py-3.5 rounded-xl border-none bg-green-600 text-white font-bold text-sm cursor-pointer">
            Concluir
          </button>
        </div>
      )}
    </div>
  );
}