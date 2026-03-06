import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// ── Gerador de payload PIX estático padrão BCB/EMV ───────────────────────────
function crc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, "0");
}

function emvField(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

function gerarPayload(valor: number, txid: string): string {
  const chave  = "+5545991148223";
  const nome   = "Gustavo Carvalho";
  const cidade = "Cascavel";

  const merchantAccount = emvField("00", "BR.GOV.BCB.PIX") + emvField("01", chave);
  const payload =
    emvField("00", "01") +
    emvField("26", merchantAccount) +
    emvField("52", "0000") +
    emvField("53", "986") +
    emvField("54", valor.toFixed(2)) +
    emvField("58", "BR") +
    emvField("59", nome.slice(0, 25)) +
    emvField("60", cidade.slice(0, 15)) +
    emvField("62", emvField("05", txid.slice(0, 25)));

  return payload + emvField("63", crc16(payload + "6304"));
}

// POST /api/pix/gerar
// Body: { userId, valor }
// Retorna: { txid, payload, valor }
export async function POST(request: Request) {
  try {
    const { userId, valor } = await request.json();

    if (!userId) return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 });
    if (!valor || valor <= 0) return NextResponse.json({ error: "Valor invalido" }, { status: 400 });
    if (valor > 50000) return NextResponse.json({ error: "Valor maximo: R$ 50.000,00" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Usuario nao encontrado" }, { status: 404 });

    // Gera ID único para rastrear o pagamento
    const txid   = randomUUID().replace(/-/g, "").slice(0, 25);
    const payload = gerarPayload(Number(valor), txid);

    // Salva transação como pendente no banco
    const transacao = await prisma.transacao.create({
      data: {
        userId,
        type:   "deposito",
        cert:   "PIX",
        amount: 0,
        price:  0,
        total:  Number(valor),
        status: "pendente",
        txid,
      },
    });

    return NextResponse.json({ txid, payload, valor: Number(valor), transacaoId: transacao.id }, { status: 201 });

  } catch (err) {
    console.error("Erro ao gerar PIX:", err);
    return NextResponse.json({ error: "Erro ao gerar PIX" }, { status: 500 });
  }
}