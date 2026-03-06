import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const items = await prisma.compliance.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: "Erro ao buscar compliance" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const item = await prisma.compliance.create({
      data: {
        userId:   data.userId,
        tipo:     data.tipo,
        nome:     data.nome,
        status:   data.status || "pendente",
        validade: data.validade ? new Date(data.validade) : null,
        obs:      data.obs || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao criar compliance" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { id, status, obs } = await request.json();
    const item = await prisma.compliance.update({ where: { id }, data: { status, obs } });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await prisma.compliance.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
  }
}
