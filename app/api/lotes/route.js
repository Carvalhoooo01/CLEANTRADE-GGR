import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const lotes = await prisma.lote.findMany({
      where: userId ? { userId } : {},
      orderBy: { id: "desc" }
    });
    return NextResponse.json(lotes);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar lotes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const novoLote = await prisma.lote.create({
      data: {
        nome: data.nome,
        tipo: data.tipo,
        quantidade: parseFloat(data.quantidade),
        preco: parseFloat(data.preco),
        userId: data.userId,
        status: "ativo"
      }
    });
    return NextResponse.json(novoLote, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao publicar lote" }, { status: 500 });
  }
}