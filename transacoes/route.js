import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId, type, cert, amount, price, total, status } = await request.json();

    if (!userId || !type || total == null) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const transacao = await prisma.transacao.create({
      data: {
        userId,
        type,
        cert:   cert   || "—",
        amount: parseFloat(amount) || 0,
        price:  parseFloat(price)  || 0,
        total:  parseFloat(total),
        status: status || "pago",
      },
    });

    return NextResponse.json(formatTransacao(transacao), { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar transação:", error);
    return NextResponse.json({ error: "Erro ao salvar transação" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId obrigatório" }, { status: 400 });
    }

    const transacoes = await prisma.transacao.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transacoes.map(formatTransacao));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
}

function formatTransacao(t) {
  const d = t.createdAt ? new Date(t.createdAt) : new Date();
  return {
    ...t,
    date: d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR").slice(0, 5),
  };
}