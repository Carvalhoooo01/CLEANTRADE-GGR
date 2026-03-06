import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/pix/status/[txid]
// Retorna o status atual da transacao PIX
export async function GET(
  request: Request,
  { params }: { params: { txid: string } }
) {
  try {
    const { txid } = params;
    if (!txid) return NextResponse.json({ error: "txid obrigatorio" }, { status: 400 });

    const transacao = await prisma.transacao.findFirst({
      where: { txid },
      select: {
        id:     true,
        txid:   true,
        status: true,
        total:  true,
        userId: true,
      },
    });

    if (!transacao) return NextResponse.json({ error: "Transacao nao encontrada" }, { status: 404 });

    return NextResponse.json({
      txid:   transacao.txid,
      status: transacao.status, // "pendente" | "pago" | "expirado" | "cancelado"
      valor:  transacao.total,
      pago:   transacao.status === "pago",
    });

  } catch (err) {
    console.error("Erro ao consultar status PIX:", err);
    return NextResponse.json({ error: "Erro ao consultar status" }, { status: 500 });
  }
}