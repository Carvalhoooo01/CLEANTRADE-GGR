import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId    = searchParams.get("userId");
    const projetoId = searchParams.get("projetoId");
    const where = {};
    if (userId)    where.userId    = userId;
    if (projetoId) where.projetoId = projetoId;
    const items = await prisma.monitoramento.findMany({
      where,
      include: { projeto: { select: { nome: true, tipo: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: "Erro ao buscar monitoramentos" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const item = await prisma.monitoramento.create({
      data: {
        projetoId: data.projetoId,
        userId:    data.userId,
        tipo:      data.tipo || "satelite",
        co2:       parseFloat(data.co2) || 0,
        area:      parseFloat(data.area) || 0,
        ndvi:      data.ndvi ? parseFloat(data.ndvi) : null,
        obs:       data.obs || null,
      },
      include: { projeto: { select: { nome: true, tipo: true } } },
    });
    // Atualiza co2Verificado do projeto
    await prisma.projeto.update({
      where: { id: data.projetoId },
      data:  { co2Verificado: { increment: parseFloat(data.co2) || 0 } },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao registrar monitoramento" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await prisma.monitoramento.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
  }
}
