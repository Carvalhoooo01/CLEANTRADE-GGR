import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const projetos = await prisma.projeto.findMany({
      where: userId ? { userId } : {},
      include: { property: { select: { name: true, area: true } }, monitoramentos: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projetos);
  } catch (err) {
    return NextResponse.json({ error: "Erro ao buscar projetos" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const projeto = await prisma.projeto.create({
      data: {
        nome:         data.nome,
        descricao:    data.descricao || null,
        tipo:         data.tipo || "Florestal",
        status:       data.status || "ativo",
        area:         parseFloat(data.area) || 0,
        co2Estimado:  parseFloat(data.co2Estimado) || 0,
        userId:       data.userId,
        propertyId:   data.propertyId || null,
      },
    });
    return NextResponse.json(projeto, { status: 201 });
  } catch (err) {
  console.error("Erro GET /api/projetos:", err) // adicione isso
  return NextResponse.json({ error: "Erro ao buscar projetos" }, { status: 500 });
}
}
export async function PATCH(request) {
  try {
    const { id, ...data } = await request.json();
    if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
    const projeto = await prisma.projeto.update({ where: { id }, data });
    return NextResponse.json(projeto);
  } catch (err) {
    return NextResponse.json({ error: "Erro ao atualizar projeto" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await prisma.monitoramento.deleteMany({ where: { projetoId: id } });
    await prisma.projeto.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao remover projeto" }, { status: 500 });
  }
}
