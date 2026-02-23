import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId, type, cert, amount, price, total, status } = await request.json();

    const transacao = await prisma.transacao.create({
      data: { userId, type, cert, amount, price, total, status }
    });

    return NextResponse.json(transacao, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar transação:", error);
    return NextResponse.json({ error: "Erro ao salvar transação" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const transacoes = await prisma.transacao.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(transacoes);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar transações" }, { status: 500 });
  }
}